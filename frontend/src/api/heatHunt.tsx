import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, apiFetch } from './config';
import {
  HeatHuntStatus,
  HeatHuntProgressEvent,
  HeatHuntResult,
  HeatHuntContextValue,
} from '../types';

const HeatHuntContext = createContext<HeatHuntContextValue | undefined>(undefined);

export const HeatHuntProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<HeatHuntStatus>('idle');
  const [progressEvents, setProgressEvents] = useState<HeatHuntProgressEvent[]>([]);
  const [result, setResult] = useState<HeatHuntResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const activeJobIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTimestamp = (date: Date = new Date()): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const cleanupConnections = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

  /**
   * Fetches final results on agent completion and refreshes global application state.
   */
  const handleJobCompletion = useCallback(async (jobId: string) => {
    cleanupConnections();
    try {
      const res = await apiFetch<{
        status: string;
        result?: {
          status: string;
          city: string;
          ranked_zones?: any[];
          executive_briefing?: string;
          recommended_dispatches?: any[];
          primary_hotspots_count?: number;
          scan_summary?: { total_cells: number };
        };
      }>(`/api/heat-hunt/${jobId}/results`);

      if (res.status === 'completed' && res.result) {
        const ranked = res.result.ranked_zones || [];
        const criticalCount = ranked.filter(
          (z: any) => z.priority_level === 'CRITICAL' || z.priority_tier === 'CRITICAL'
        ).length;

        setResult({
          zonesScanned: res.result.scan_summary?.total_cells || 16568,
          criticalZonesFound: criticalCount,
          completedAt: formatTimestamp(new Date()),
          summary:
            res.result.executive_briefing ||
            `HeatSentinel autonomous agent completed investigation across ${ranked.length} priority zones.`,
        });
        setStatus('completed');

        // Instantly refresh all React Query caches across the dashboard
        queryClient.invalidateQueries({ queryKey: ['basic-scan'] });
        queryClient.invalidateQueries({ queryKey: ['zones'] });
        queryClient.invalidateQueries({ queryKey: ['heatmapMarkers'] });
        queryClient.invalidateQueries({ queryKey: ['heatmapGeoJSON'] });
        queryClient.invalidateQueries({ queryKey: ['kpis'] });
        queryClient.invalidateQueries({ queryKey: ['riskZoneSummary'] });
        queryClient.invalidateQueries({ queryKey: ['populationAtRisk'] });
      }
    } catch (err: any) {
      console.error('Failed to retrieve Heat Hunt final results:', err);
      setStatus('completed');
    }
  }, [cleanupConnections, queryClient]);

  /**
   * Fallback polling loop in case SSE is unavailable.
   */
  const startStatusPolling = useCallback((jobId: string) => {
    if (pollingIntervalRef.current) return;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const statusRes = await apiFetch<{
          status: string;
          progress_events: Array<{
            id: string;
            step_number: number;
            tool_name: string;
            message: string;
            display_name?: string;
            timestamp: string;
            type: 'info' | 'warning' | 'success' | 'error';
          }>;
          error?: string;
        }>(`/api/heat-hunt/${jobId}/status`);

        if (statusRes.progress_events && statusRes.progress_events.length > 0) {
          const mappedEvents: HeatHuntProgressEvent[] = statusRes.progress_events.map((e) => ({
            id: e.id,
            message: e.message,
            display_name: e.display_name,
            timestamp: e.timestamp || formatTimestamp(new Date()),
            stepNumber: e.step_number,
            totalSteps: 7,
            type: e.type || 'info',
          }));
          setProgressEvents(mappedEvents);
        }

        if (statusRes.status === 'completed') {
          await handleJobCompletion(jobId);
        } else if (statusRes.status === 'failed') {
          cleanupConnections();
          setStatus('failed');
          setErrorMessage(statusRes.error || 'Autonomous investigation halted unexpectedly.');
        }
      } catch (e) {
        console.warn('Status poll warning:', e);
      }
    }, 1200);
  }, [cleanupConnections, handleJobCompletion]);

  /**
   * Primary Heat Hunt Execution Trigger:
   * 1. Submits POST /api/heat-hunt/start to FastAPI backend
   * 2. Subscribes to real-time SSE stream at /api/heat-hunt/{jobId}/stream
   * 3. Falls back seamlessly to status polling if stream drops
   */
  const runHeatHunt = useCallback(async (params?: { startDate?: string; startTime?: string; provider?: string }) => {
    cleanupConnections();
    setStatus('running');
    setProgressEvents([]);
    setResult(null);
    setErrorMessage(null);

    // Initial local event
    const initialEvent: HeatHuntProgressEvent = {
      id: `evt-init-${Date.now()}`,
      message: 'Autonomous HeatSentinel agent initialized — starting Phoenix Heat Hunt investigation...',
      timestamp: formatTimestamp(new Date()),
      stepNumber: 0,
      totalSteps: 7,
      type: 'info',
    };
    setProgressEvents([initialEvent]);

    // Handle failure simulation toggle if user enabled it for testing
    if (simulateFailure) {
      setTimeout(() => {
        const failEvent: HeatHuntProgressEvent = {
          id: `evt-fail-${Date.now()}`,
          message: 'Connection interrupted: Unable to retrieve thermal telemetry stream from regional sensor node.',
          timestamp: formatTimestamp(new Date()),
          stepNumber: 3,
          totalSteps: 7,
          type: 'error',
        };
        setProgressEvents((prev) => [...prev, failEvent]);
        setStatus('failed');
        setErrorMessage('Thermal telemetry connection interrupted: Unable to stream high-resolution raster tiles from regional sensors.');
      }, 1500);
      return;
    }

    try {
      // 1. Start Job via Backend API
      const startRes = await apiFetch<{
        job_id?: string;
        jobId?: string;
        status: string;
      }>('/api/heat-hunt/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: params?.startDate || '2024-08-01',
          start_time: params?.startTime || '14:00',
          provider: params?.provider || 'auto',
          model_name: 'gemini-3.5-flash-lite',
          mode: 'live',
        }),
      });

      const jobId = startRes.job_id || startRes.jobId;
      if (!jobId) {
        throw new Error('Backend did not return a valid jobId.');
      }
      activeJobIdRef.current = jobId;

      // 2. Connect to Server-Sent Events (SSE) Stream
      const streamUrl = `${API_BASE_URL}/api/heat-hunt/${jobId}/stream`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        if (!event.data) return;
        if (event.data === '[DONE]') {
          handleJobCompletion(jobId);
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          const newEvent: HeatHuntProgressEvent = {
            id: parsed.id || `evt-${Date.now()}-${Math.random()}`,
            message: parsed.message || 'Agent executing tactical tool...',
            display_name: parsed.display_name,
            timestamp: parsed.timestamp || formatTimestamp(new Date()),
            stepNumber: typeof parsed.step_number === 'number' ? parsed.step_number : 1,
            totalSteps: 7,
            type: parsed.type || (parsed.tool_name === 'finalize_heat_hunt' ? 'success' : 'info'),
          };

          setProgressEvents((prev) => {
            if (prev.some((e) => e.id === newEvent.id)) return prev;
            return [...prev, newEvent];
          });

          if (parsed.tool_name === 'finalize_heat_hunt' || parsed.tool_name === 'agent_completed') {
            handleJobCompletion(jobId);
          }
        } catch (err) {
          console.warn('Failed to parse SSE event chunk:', err);
        }
      };

      es.onerror = (err) => {
        console.warn('SSE stream encountered error / disconnection — activating polling fallback:', err);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        startStatusPolling(jobId);
      };
    } catch (err: any) {
      console.error('Failed to initiate Heat Hunt:', err);
      setStatus('failed');
      setErrorMessage(err.message || 'Failed to start Heat Hunt backend job.');
    }
  }, [cleanupConnections, handleJobCompletion, simulateFailure, startStatusPolling]);

  const resetHeatHunt = useCallback(() => {
    cleanupConnections();
    setStatus('idle');
    setProgressEvents([]);
    setResult(null);
    setErrorMessage(null);
  }, [cleanupConnections]);

  return (
    <HeatHuntContext.Provider
      value={{
        status,
        progressEvents,
        result,
        errorMessage,
        simulateFailure,
        setSimulateFailure,
        runHeatHunt,
        resetHeatHunt,
      }}
    >
      {children}
    </HeatHuntContext.Provider>
  );
};

export const useHeatHunt = (): HeatHuntContextValue => {
  const context = useContext(HeatHuntContext);
  if (!context) {
    throw new Error('useHeatHunt must be used within a HeatHuntProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { USE_MOCK_DATA, apiFetch } from './config';
import {
  HeatHuntStatus,
  HeatHuntProgressEvent,
  HeatHuntResult,
  HeatHuntContextValue,
} from '../types';

export const MOCK_HEAT_HUNT_STEPS: Array<{
  message: string;
  type: 'info' | 'warning' | 'success';
}> = [
  { message: 'Dividing Phoenix target area into scan zones...', type: 'info' },
  { message: 'Scanning thermal conditions...', type: 'info' },
  { message: 'Hotspot detected — refining priority AOI...', type: 'warning' },
  { message: 'Joining Census vulnerability data...', type: 'info' },
  { message: 'Checking protective resource coverage...', type: 'info' },
  { message: 'Calculating Response Gap scores...', type: 'info' },
  { message: 'Ranking zones by priority...', type: 'success' },
];

const HeatHuntContext = createContext<HeatHuntContextValue | undefined>(undefined);

export const HeatHuntProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<HeatHuntStatus>('idle');
  const [progressEvents, setProgressEvents] = useState<HeatHuntProgressEvent[]>([]);
  const [result, setResult] = useState<HeatHuntResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const formatTimestamp = (date: Date = new Date()): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  /**
   * Heat Hunt execution handler.
   * In Mock Mode: Simulates 800ms telemetry events with progress and failure toggles.
   * In Production (USE_MOCK_DATA = false): Triggers backend execution and event polling.
   */
  const runHeatHunt = useCallback(() => {
    clearAllTimers();
    setStatus('running');
    setProgressEvents([]);
    setResult(null);
    setErrorMessage(null);

    const startTime = new Date();
    const initialEvent: HeatHuntProgressEvent = {
      id: `evt-init-${Date.now()}`,
      message: 'Agent initialized — starting Phoenix Heat Hunt investigation...',
      timestamp: formatTimestamp(startTime),
      stepNumber: 0,
      totalSteps: MOCK_HEAT_HUNT_STEPS.length,
      type: 'info',
    };
    setProgressEvents([initialEvent]);

    if (!USE_MOCK_DATA) {
      // Backend integration hook
      apiFetch<{ jobId: string }>('/api/heat-hunt/start', { method: 'POST' })
        .then(({ jobId }) => {
          console.log(`Heat Hunt job started with ID: ${jobId}`);
          // Connect to SSE or polling loop here
        })
        .catch((err) => {
          setStatus('failed');
          setErrorMessage(err.message || 'Failed to start Heat Hunt backend job.');
        });
      return;
    }

    const stepInterval = 800; // ~800ms per event per specification

    MOCK_HEAT_HUNT_STEPS.forEach((step, index) => {
      const stepNumber = index + 1;
      const delay = (index + 1) * stepInterval;

      const timer = setTimeout(() => {
        // If simulation mode is set to fail and we reached step 3
        if (simulateFailure && index === 2) {
          const failEvent: HeatHuntProgressEvent = {
            id: `evt-fail-${Date.now()}`,
            message: 'Connection interrupted: Unable to retrieve high-resolution thermal raster stream from regional sensor node.',
            timestamp: formatTimestamp(new Date()),
            stepNumber: 3,
            totalSteps: MOCK_HEAT_HUNT_STEPS.length,
            type: 'error',
          };
          setProgressEvents((prev) => [...prev, failEvent]);
          setStatus('failed');
          setErrorMessage('Thermal telemetry connection interrupted: Unable to stream high-resolution raster tiles from regional sensors. Please check connectivity and retry.');
          clearAllTimers();
          return;
        }

        const newEvent: HeatHuntProgressEvent = {
          id: `evt-${stepNumber}-${Date.now()}`,
          message: step.message,
          timestamp: formatTimestamp(new Date()),
          stepNumber,
          totalSteps: MOCK_HEAT_HUNT_STEPS.length,
          type: step.type,
        };

        setProgressEvents((prev) => [...prev, newEvent]);

        // If this is the final step
        if (index === MOCK_HEAT_HUNT_STEPS.length - 1) {
          const terminalTimer = setTimeout(() => {
            const finalEvent: HeatHuntProgressEvent = {
              id: `evt-completed-${Date.now()}`,
              message: 'Heat Hunt completed successfully. 12 zones analyzed, 2 critical risk anomalies flagged for rapid intervention.',
              timestamp: formatTimestamp(new Date()),
              stepNumber: MOCK_HEAT_HUNT_STEPS.length,
              totalSteps: MOCK_HEAT_HUNT_STEPS.length,
              type: 'success',
            };
            setProgressEvents((prev) => [...prev, finalEvent]);
            setStatus('completed');
            setResult({
              zonesScanned: 12,
              criticalZonesFound: 2,
              completedAt: formatTimestamp(new Date()),
              summary: 'Zone 7 (Central Phoenix) & Zone 5 (South Mountain) require highest response prioritization.',
            });
          }, 600);
          timersRef.current.push(terminalTimer);
        }
      }, delay);

      timersRef.current.push(timer);
    });
  }, [simulateFailure]);

  const resetHeatHunt = useCallback(() => {
    clearAllTimers();
    setStatus('idle');
    setProgressEvents([]);
    setResult(null);
    setErrorMessage(null);
  }, []);

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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { AgentInsightsPage } from './pages/AgentInsightsPage';
import { HeatMapPage } from './pages/HeatMapPage';
import { RiskZonesPage } from './pages/RiskZonesPage';
import { EventsAlertsPage } from './pages/EventsAlertsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ResponsePlannerPage } from './pages/ResponsePlannerPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { SettingsPage } from './pages/SettingsPage';
import { HeatHuntProvider } from './api/heatHunt';
import { CityProvider } from './context/CityContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CityProvider>
        <HeatHuntProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Default Route: Overview */}
                <Route index element={<OverviewPage />} />

                {/* Core Functional Module Routes */}
                <Route path="heat-map" element={<HeatMapPage />} />
                <Route path="risk-zones" element={<RiskZonesPage />} />
                <Route path="events-alerts" element={<EventsAlertsPage />} />
                <Route path="agent-insights" element={<AgentInsightsPage />} />
                <Route path="resources" element={<ResourcesPage />} />
                <Route path="response-planner" element={<ResponsePlannerPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="data-explorer" element={<DataExplorerPage />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Fallback to Overview */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </HeatHuntProvider>
      </CityProvider>
    </QueryClientProvider>
  );
}


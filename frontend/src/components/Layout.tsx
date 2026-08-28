import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { PresenterDemoController } from './PresenterDemoController';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  // Dynamic header subtitle based on current route
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/':
        return {
          greeting: 'Good Morning, Team HeatSentinel',
          subtitle: "Here's your city heat intelligence overview",
        };
      case '/heat-map':
        return {
          greeting: 'Hyperlocal Heat Map',
          subtitle: 'Live thermal GIS visualization and satellite feeds',
        };
      case '/risk-zones':
        return {
          greeting: 'Risk Zones Management',
          subtitle: 'Vulnerability assessment and high-exposure sectors',
        };
      case '/events-alerts':
        return {
          greeting: 'Events & Alert Center',
          subtitle: 'Critical heat advisories and active automated triggers',
        };
      case '/agent-insights':
        return {
          greeting: 'Agent Insights & Analysis',
          subtitle: 'Autonomous AI decision logs and predictive projections',
        };
      case '/resources':
        return {
          greeting: 'Resource Directory',
          subtitle: 'Cooling centers, water distribution points, and mobile units',
        };
      case '/response-planner':
        return {
          greeting: 'Response Planner',
          subtitle: 'Automated municipal deployment schedules and task workflows',
        };
      case '/reports':
        return {
          greeting: 'Intelligence Reports',
          subtitle: 'City heat mitigation audits and performance metrics',
        };
      case '/data-explorer':
        return {
          greeting: 'Data Explorer',
          subtitle: 'Sensor feeds, environmental API logs, and export utilities',
        };
      case '/settings':
        return {
          greeting: 'System Settings',
          subtitle: 'Agent configuration, thresholds, and administrative permissions',
        };
      default:
        return {
          greeting: 'Good Morning, Team HeatSentinel',
          subtitle: "Here's your city heat intelligence overview",
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div id="app-root-layout" className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Desktop Fixed Left Sidebar (hidden on <lg) */}
      <Sidebar />

      {/* Mobile Slide-in Full Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (Header + Scrollable Routed Outlet) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <Header
          greeting={headerInfo.greeting}
          subtitle={headerInfo.subtitle}
          alertCount={3}
          location="Phoenix, AZ"
          userName="HeatSentinel Team"
          userRole="Administrator"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Scrollable Page Body with bottom padding for comfortable scrolling */}
        <main
          id="main-scrollable-content"
          className="flex-1 overflow-y-auto bg-[#F8FAFC] pb-24 lg:pb-12"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (hidden on lg+) */}
      <BottomTabBar />

      {/* Presenter Pitch Controller HUD */}
      <PresenterDemoController />
    </div>
  );
};



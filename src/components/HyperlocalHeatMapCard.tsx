import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  Info,
  ChevronDown,
  Layers,
  Plus,
  Minus,
  Navigation,
  Maximize2,
} from 'lucide-react';
import { MapFilterTab, HeatZoneMarker } from '../types';
import {
  PHOENIX_CENTER,
  mockHeatZoneMarkers,
  mockHeatGeoJSON,
} from '../data/mockHeatMapData';

interface HyperlocalHeatMapCardProps {
  onZoneSelect?: (zoneId: string) => void;
  className?: string;
}

export const HyperlocalHeatMapCard: React.FC<HyperlocalHeatMapCardProps> = ({
  onZoneSelect = (zoneId) => console.log('Selected Heat Zone:', zoneId),
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<MapFilterTab>('risk');
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('Today');
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Filter tabs config
  const filterTabs: { id: MapFilterTab; label: string }[] = [
    { id: 'risk', label: 'Heat Risk' },
    { id: 'index', label: 'Heat Index' },
    { id: 'vulnerability', label: 'Vulnerability' },
    { id: 'resources', label: 'Resources' },
  ];

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Free, publicly accessible lightweight Carto / OSM raster basemap style (no API token required)
    const style: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        },
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: PHOENIX_CENTER,
      zoom: 10.3,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);

      // Add Mock Stylized Heat GeoJSON Polygon Source & Layers
      // NOTE: This represents a stylized GIS mock layer for urban thermal risk visualization.
      if (!map.getSource('heat-risk-overlay')) {
        map.addSource('heat-risk-overlay', {
          type: 'geojson',
          data: mockHeatGeoJSON,
        });

        // Heat fill layer with soft blur/opacity
        map.addLayer({
          id: 'heat-risk-fill',
          type: 'fill',
          source: 'heat-risk-overlay',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': ['get', 'opacity'],
          },
        });

        // Delicate contour stroke layer
        map.addLayer({
          id: 'heat-risk-line',
          type: 'line',
          source: 'heat-risk-overlay',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 1.5,
            'line-opacity': 0.6,
          },
        });
      }

      // Add Custom Numbered Markers
      mockHeatZoneMarkers.forEach((markerData: HeatZoneMarker) => {
        const el = document.createElement('div');
        el.className = 'heat-zone-marker-container group cursor-pointer';

        // Size classes based on severity/importance
        const sizeClasses =
          markerData.size === 'lg'
            ? 'w-10 h-10 text-base font-black shadow-lg ring-4 ring-white/90'
            : markerData.size === 'md'
            ? 'w-8 h-8 text-sm font-bold shadow-md ring-3 ring-white/90'
            : 'w-7 h-7 text-xs font-bold shadow-sm ring-2 ring-white/90';

        el.innerHTML = `
          <div 
            class="flex items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-115 active:scale-95 ${sizeClasses}"
            style="background-color: ${markerData.color};"
          >
            <span class="tabular-nums drop-shadow-xs">${markerData.zoneNumber}</span>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onZoneSelect(markerData.id);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(markerData.coordinates)
          .addTo(map);

        markersRef.current.push(marker);
      });
    });

    // Resize observer to ensure map canvas fits container seamlessly
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Map control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut({ duration: 300 });
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: PHOENIX_CENTER,
        zoom: 10.3,
        essential: true,
        duration: 800,
      });
    }
  };

  return (
    <div
      id="hyperlocal-heat-map-card"
      className={`bg-white border border-[#F1F5F9] rounded-2xl shadow-xs overflow-hidden flex flex-col ${className}`}
    >
      {/* CARD HEADER */}
      <div
        id="heat-map-header"
        className="p-3.5 sm:p-5 border-b border-[#F1F5F9] flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        {/* Left: Title + Filter Pill Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <h2 className="text-[15px] sm:text-[17px] font-bold text-[#0F172A] tracking-tight">
              Hyperlocal Heat Risk Map
            </h2>
            <button
              type="button"
              aria-label="More information about the heat risk map"
              className="text-[#94A3B8] hover:text-[#64748B] focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors p-1 rounded-full min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
              title="Autonomous thermal layer aggregated from urban sensors and surface telemetry"
            >
              <Info size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Filter Pills - Horizontal scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x" role="tablist" aria-label="Map Layer Filters">
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`map-filter-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-all cursor-pointer whitespace-nowrap min-h-[36px] flex items-center shrink-0 ${
                    isActive
                      ? 'bg-[#F97316] text-white shadow-2xs'
                      : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Today Dropdown + Layers Button */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* Timeframe selector */}
          <div className="relative">
            <button
              type="button"
              aria-label="Select timeframe"
              aria-expanded={isTimeDropdownOpen}
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none border border-slate-200/80 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
            >
              <span>{selectedTimeRange}</span>
              <ChevronDown size={13} className="text-[#64748B]" />
            </button>

            {isTimeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {['Today', '24h Forecast', 'Peak Heat (2PM)', 'Historic (7D)'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSelectedTimeRange(opt);
                      setIsTimeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors ${
                      selectedTimeRange === opt
                        ? 'text-[#F97316] bg-orange-50/60 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layers Button */}
          <div className="relative">
            <button
              type="button"
              aria-label="Toggle map layers menu"
              aria-expanded={isLayersOpen}
              onClick={() => setIsLayersOpen(!isLayersOpen)}
              className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0D9488] hover:bg-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Layers size={14} strokeWidth={2.2} />
              <span>Layers</span>
              <ChevronDown size={12} />
            </button>

            {isLayersOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Active Layers
                </div>
                <label className="flex items-center gap-2 px-2 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#0D9488] rounded w-4 h-4" />
                  <span>Thermal Contours</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#0D9488] rounded w-4 h-4" />
                  <span>Risk Zone Clusters</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="accent-[#0D9488] rounded w-4 h-4" />
                  <span>Cooling Outposts</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div className="relative w-full h-[300px] sm:h-[460px] lg:h-[500px] bg-[#F1F5F9] overflow-hidden">
        {/* MapLibre Container */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Top-Left Stacked Controls - Touch friendly min size */}
        <div
          id="map-navigation-controls"
          className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200/80 overflow-hidden z-10"
        >
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-[#0F172A] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors border-b border-slate-100 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-[#0F172A] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors border-b border-slate-100 cursor-pointer"
          >
            <Minus size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Recenter on Phoenix"
            title="Recenter Map"
            className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-[#0F172A] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer"
          >
            <Navigation size={14} strokeWidth={2.2} className="rotate-45" />
          </button>
        </div>

        {/* Bottom-Left Floating Legend Card */}
        <div
          id="map-floating-legend"
          className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 shadow-md border border-slate-200/80 z-10 flex flex-col gap-1 sm:gap-1.5 min-w-[150px] sm:min-w-[200px]"
        >
          <span className="text-[10px] sm:text-[11px] font-bold text-[#0F172A] tracking-tight">
            Heat Risk Level
          </span>

          {/* 4-Stop Gradient Bar (Teal -> Amber -> Orange -> Red) */}
          <div className="w-full h-2 sm:h-2.5 rounded-full bg-gradient-to-r from-[#0D9488] via-[#D97706] via-[#EA580C] to-[#DC2626] shadow-inner" />

          {/* Legend Labels */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-semibold text-[#64748B] pt-0.5">
            <span>Low</span>
            <span>Mod</span>
            <span>High</span>
            <span className="text-[#DC2626] font-bold">Critical</span>
          </div>
        </div>

        {/* Bottom-Right "Expand Map" Button */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
          <button
            type="button"
            aria-label="Expand map view"
            onClick={() => console.log('Expand map modal / view requested')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-xs hover:bg-white text-[#0F172A] rounded-full shadow-md border border-slate-200/80 text-[11px] sm:text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-all cursor-pointer hover:shadow-lg min-h-[34px]"
          >
            <Maximize2 size={13} strokeWidth={2} />
            <span className="hidden xs:inline">Expand Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};

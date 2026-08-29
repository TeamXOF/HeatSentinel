import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  Info,
  ChevronDown,
  Layers,
  Plus,
  Minus,
  Navigation,
  Maximize2,
  MapPin,
  Sparkles,
  ShieldAlert,
  Flame,
  Compass,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { MapFilterTab, HeatZoneMarker } from '../types';
import { PHOENIX_CENTER } from '../data/mockHeatMapData';
import { useBasicScan } from '../api';
import { useCity } from '../context/CityContext';
import { useQueryClient } from '@tanstack/react-query';
import { createCustomZoneEvidence } from '../data/mockZoneEvidenceData';

import {
  generateDistrictThermalGrid,
  generateDistrictHotspotPolygons,
  generateDistrictMarkers,
} from '../data/districtThermalEngine';

export interface PhoenixDistrictPreset {
  id: string;
  zoneId: string;
  name: string;
  shortLabel: string;
  icon: string;
  coordinates: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  peakTempF: number;
  peakTempC: number;
  responseGap: number;
  tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  population: number;
  coolingCentersCount: number;
  description: string;
  isCustom?: boolean;
}

export const PHOENIX_DISTRICT_PRESETS: PhoenixDistrictPreset[] = [
  {
    id: 'downtown',
    zoneId: 'zone-7',
    name: 'Downtown & Central Business Corridor',
    shortLabel: 'Downtown Core',
    icon: '🏛️',
    coordinates: [-112.0740, 33.4490],
    zoom: 13.2,
    pitch: 45,
    bearing: -15,
    peakTempF: 114.1,
    peakTempC: 45.6,
    responseGap: 8.7,
    tier: 'CRITICAL',
    population: 42800,
    coolingCentersCount: 1,
    description: 'High thermal mass concrete canyon, heavy transit pedestrian exposure, severe night heat retention.',
  },
  {
    id: 'maryvale',
    zoneId: 'zone-1',
    name: 'Maryvale & West Phoenix Urban Corridor',
    shortLabel: 'Maryvale & West',
    icon: '🏘️',
    coordinates: [-112.1650, 33.4750],
    zoom: 13.0,
    pitch: 40,
    bearing: -10,
    peakTempF: 108.5,
    peakTempC: 42.5,
    responseGap: 7.8,
    tier: 'HIGH',
    population: 68500,
    coolingCentersCount: 2,
    description: 'Highest residential senior population and socioeconomic vulnerability. Low shade tree canopy.',
  },
  {
    id: 'south-phoenix',
    zoneId: 'zone-5',
    name: 'South Phoenix & Baseline Corridor',
    shortLabel: 'South Phoenix',
    icon: '🌵',
    coordinates: [-112.0520, 33.4120],
    zoom: 13.0,
    pitch: 35,
    bearing: 5,
    peakTempF: 111.0,
    peakTempC: 43.9,
    responseGap: 7.4,
    tier: 'HIGH',
    population: 39400,
    coolingCentersCount: 2,
    description: 'Extensive asphalt surface parking, industrial thermal emissions, critical agricultural buffer.',
  },
  {
    id: 'encanto',
    zoneId: 'zone-3',
    name: 'Encanto & Eastlake / Garfield District',
    shortLabel: 'Encanto / Garfield',
    icon: '🏫',
    coordinates: [-112.0780, 33.4880],
    zoom: 13.4,
    pitch: 40,
    bearing: -20,
    peakTempF: 110.0,
    peakTempC: 43.3,
    responseGap: 7.1,
    tier: 'HIGH',
    population: 31200,
    coolingCentersCount: 2,
    description: 'Dense historical residential fabric with elevated elderly demographics and transit corridors.',
  },
  {
    id: 'camelback',
    zoneId: 'zone-2-camelback',
    name: 'Camelback East & Midtown Corridor',
    shortLabel: 'Camelback East',
    icon: '🏙️',
    coordinates: [-111.9680, 33.5090],
    zoom: 12.8,
    pitch: 30,
    bearing: 0,
    peakTempF: 104.2,
    peakTempC: 40.1,
    responseGap: 5.6,
    tier: 'MODERATE',
    population: 28900,
    coolingCentersCount: 3,
    description: 'Mixed commercial/residential corridor with moderate tree cover and active cooling facilities.',
  },
  {
    id: 'tempe',
    zoneId: 'zone-2-tempe',
    name: 'Tempe & ASU Salt River Gateway',
    shortLabel: 'Tempe / ASU',
    icon: '🎓',
    coordinates: [-111.9300, 33.4350],
    zoom: 13.0,
    pitch: 35,
    bearing: -10,
    peakTempF: 103.0,
    peakTempC: 39.4,
    responseGap: 5.2,
    tier: 'MODERATE',
    population: 51200,
    coolingCentersCount: 4,
    description: 'High student foot traffic, light rail stations, urban heat island along Rio Salado parkway.',
  },
  {
    id: 'glendale',
    zoneId: 'zone-6-glendale',
    name: 'Glendale & Westgate Entertainment District',
    shortLabel: 'Glendale & Westgate',
    icon: '🏟️',
    coordinates: [-112.1860, 33.5380],
    zoom: 13.0,
    pitch: 35,
    bearing: 5,
    peakTempF: 109.4,
    peakTempC: 43.0,
    responseGap: 6.8,
    tier: 'HIGH',
    population: 48900,
    coolingCentersCount: 3,
    description: 'Heavy stadium asphalt parking, shopping corridors, residential buffer, high daytime thermal absorption.',
  },
  {
    id: 'scottsdale',
    zoneId: 'zone-8-scottsdale',
    name: 'Old Town Scottsdale & Waterfront',
    shortLabel: 'Scottsdale',
    icon: '🌵',
    coordinates: [-111.9260, 33.4940],
    zoom: 13.2,
    pitch: 30,
    bearing: -5,
    peakTempF: 105.8,
    peakTempC: 41.0,
    responseGap: 4.8,
    tier: 'MODERATE',
    population: 32000,
    coolingCentersCount: 3,
    description: 'High tourism pedestrian corridor with irrigated parks and mixed shade structures.',
  },
  {
    id: 'mesa',
    zoneId: 'zone-9-mesa',
    name: 'Downtown Mesa & Pioneer Park Corridor',
    shortLabel: 'Downtown Mesa',
    icon: '🚋',
    coordinates: [-111.8315, 33.4150],
    zoom: 13.0,
    pitch: 35,
    bearing: 0,
    peakTempF: 108.0,
    peakTempC: 42.2,
    responseGap: 6.2,
    tier: 'MODERATE',
    population: 58000,
    coolingCentersCount: 4,
    description: 'Light rail urban core, extensive civic spaces, high transit-dependent workforce demographic.',
  },
  {
    id: 'peoria',
    zoneId: 'zone-10-peoria',
    name: 'Peoria Sports Complex & P83 District',
    shortLabel: 'Peoria',
    icon: '⚾',
    coordinates: [-112.2370, 33.6330],
    zoom: 13.0,
    pitch: 35,
    bearing: 10,
    peakTempF: 107.2,
    peakTempC: 41.8,
    responseGap: 5.4,
    tier: 'MODERATE',
    population: 36000,
    coolingCentersCount: 2,
    description: 'Suburban commercial corridor, stadium concrete pads, and arterial highway heat retention.',
  },
  {
    id: 'all-phoenix',
    zoneId: 'all-phoenix',
    name: 'Metropolitan Phoenix Macro Heat Grid',
    shortLabel: 'All Metro Phoenix',
    icon: '🌐',
    coordinates: PHOENIX_CENTER,
    zoom: 11.2,
    pitch: 20,
    bearing: 0,
    peakTempF: 114.1,
    peakTempC: 45.6,
    responseGap: 8.7,
    tier: 'CRITICAL',
    population: 262000,
    coolingCentersCount: 14,
    description: 'Comprehensive 8-sector metropolitan thermal mesh tiled and cross-referenced with Census ACS.',
  },
];


// Helper to generate circular GeoJSON buffer polygon for custom user target
function createCircleGeoJSON(centerLng: number, centerLat: number, radiusMiles: number = 0.8, points: number = 32): GeoJSON.FeatureCollection {
  const km = radiusMiles * 1.60934;
  const coords: number[][] = [];
  const distanceX = km / (111.32 * Math.cos((centerLat * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([centerLng + x, centerLat + y]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Custom Target AOI',
          radius_mi: radiusMiles,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      },
    ],
  };
}

interface HyperlocalHeatMapCardProps {
  onZoneSelect?: (zoneId: string) => void;
  onDistrictChange?: (district: PhoenixDistrictPreset) => void;
  className?: string;
}

export const HyperlocalHeatMapCard: React.FC<HyperlocalHeatMapCardProps> = ({
  onZoneSelect = (zoneId) => console.log('Selected Heat Zone:', zoneId),
  onDistrictChange,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<MapFilterTab>('risk');
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('Today');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('downtown');
  const [customDistrict, setCustomDistrict] = useState<PhoenixDistrictPreset | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);


  const queryClient = useQueryClient();
  const { activeCity } = useCity();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const customTargetMarkerRef = useRef<maplibregl.Marker | null>(null);

  const activeDistrict: PhoenixDistrictPreset = useMemo(() => {
    if (customDistrict && selectedDistrictId === 'custom-aoi') {
      return customDistrict;
    }
    if (activeCity.id !== 'phoenix') {
      return {
        id: activeCity.id,
        zoneId: `zone-${activeCity.id}`,
        name: `${activeCity.fullName} Heat Corridor`,
        shortLabel: activeCity.name,
        icon:
          activeCity.id === 'las-vegas'
            ? '🎰'
            : activeCity.id === 'miami'
            ? '🌴'
            : activeCity.id === 'houston'
            ? '🚀'
            : activeCity.id === 'los-angeles'
            ? '🎬'
            : activeCity.id === 'new-york'
            ? '🗽'
            : '📍',
        coordinates: activeCity.coordinates,
        zoom: activeCity.defaultZoom,
        pitch: 40,
        bearing: -10,
        peakTempF: activeCity.baselineTempF,
        peakTempC: Math.round((((activeCity.baselineTempF - 32) * 5) / 9) * 10) / 10,
        responseGap: activeCity.heatTier === 'CRITICAL' ? 8.4 : activeCity.heatTier === 'HIGH' ? 7.6 : 6.2,
        tier: activeCity.heatTier,
        population: 52000,
        coolingCentersCount: 3,
        description: activeCity.description,
      };
    }
    return PHOENIX_DISTRICT_PRESETS.find((d) => d.id === selectedDistrictId) || PHOENIX_DISTRICT_PRESETS[0];
  }, [customDistrict, selectedDistrictId, activeCity]);

  // Fly camera to city coordinates when active city changes
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      mapInstanceRef.current.flyTo({
        center: activeCity.coordinates,
        zoom: activeCity.defaultZoom,
        pitch: 40,
        bearing: -10,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    }
  }, [activeCity, mapLoaded]);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['basic-scan'] });
      await queryClient.invalidateQueries({ queryKey: ['kpis'] });
      await queryClient.invalidateQueries({ queryKey: ['agentStatus'] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 700);
    }
  };

  // React Query for Live/Cached Basic Pipeline Scan
  const { data: scanResult, isLoading: isScanLoading } = useBasicScan({
    city: activeCity.name,
    startDate: selectedTimeRange === 'Today' ? undefined : undefined,
  });


  // Dynamically generate district thermal raster and ranked polygons
  const districtThermalGrid = useMemo(() => {
    const tempMultiplier =
      selectedTimeRange === '24h Forecast'
        ? 1.02
        : selectedTimeRange === 'Historic (7D)'
        ? 0.96
        : 1.0;
    return generateDistrictThermalGrid(
      activeDistrict.coordinates[0],
      activeDistrict.coordinates[1],
      activeDistrict.peakTempC * tempMultiplier,
      activeDistrict.id === 'all-phoenix' ? 7.0 : 2.2,
      activeDistrict.id === 'all-phoenix' ? 24 : 18,
      activeDistrict.id === 'all-phoenix' ? 24 : 18
    );
  }, [activeDistrict, selectedTimeRange]);

  const districtHotspotPolygons = useMemo(() => {
    return generateDistrictHotspotPolygons(activeDistrict);
  }, [activeDistrict]);

  const districtMarkers = useMemo(() => {
    return generateDistrictMarkers(activeDistrict);
  }, [activeDistrict]);

  // Filter tabs config
  const filterTabs: { id: MapFilterTab; label: string }[] = [
    { id: 'risk', label: 'Heat Risk Zones' },
    { id: 'index', label: 'Thermal Grid (60m)' },
    { id: 'vulnerability', label: 'Census SVI' },
    { id: 'resources', label: 'MAG Cooling' },
  ];

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

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
      center: activeDistrict.coordinates,
      zoom: activeDistrict.zoom,
      pitch: activeDistrict.pitch,
      bearing: activeDistrict.bearing,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);

      // Layer 1: FortyGuard Raw 60m Thermal Cells (Vibrant Multi-Stop Heat Ramp)
      if (!map.getSource('fortyguard-thermal-grid')) {
        map.addSource('fortyguard-thermal-grid', {
          type: 'geojson',
          data: districtThermalGrid,
        });

        // 1a: Thermal Grid Fill with FortyGuard's exact color spectrum
        map.addLayer({
          id: 'thermal-grid-fill',
          type: 'fill',
          source: 'fortyguard-thermal-grid',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'temp'], ['get', 'value'], 41],
              37.0, '#38BDF8', // Cool Sky Blue (98.6°F)
              39.0, '#10B981', // Emerald Green (102.2°F)
              41.0, '#FBBF24', // Warm Amber (105.8°F)
              43.0, '#F97316', // Fiery Orange (109.4°F)
              45.0, '#EF4444', // Hot Red (113.0°F)
              46.5, '#991B1B', // Deep Crimson (115.7°F)
            ],
            'fill-opacity': 0.72,
          },
        });

        // 1b: Thermal Grid Boundary Lines (Crisp 60m Satellite Mesh)
        map.addLayer({
          id: 'thermal-grid-line',
          type: 'line',
          source: 'fortyguard-thermal-grid',
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 0.75,
            'line-opacity': 0.40,
          },
        });

        // Interactive Hover Tooltip for 60m Grid Cells
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'thermal-cell-tooltip',
          offset: 12,
        });

        map.on('mousemove', 'thermal-grid-fill', (e) => {
          if (e.features && e.features.length > 0) {
            map.getCanvas().style.cursor = 'crosshair';
            const f = e.features[0];
            const props = f.properties;
            const tempF = props?.temp_f ?? (props?.temp ? (props.temp * 1.8 + 32).toFixed(1) : '108.5');
            const tempC = props?.temp ?? (props?.temp_f ? ((props.temp_f - 32) / 1.8).toFixed(1) : '42.5');
            const tileId = props?.tile_id ?? props?.grid_id ?? '0';

            popup
              .setLngLat(e.lngLat)
              .setHTML(
                `<div style="font-family: ui-sans-serif, system-ui; background: #0F172A; color: white; padding: 6px 10px; border-radius: 8px; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid #334155;">
                  <div style="font-weight: 800; color: #F97316; margin-bottom: 2px;">🛰️ FortyGuard 60m Cell #${tileId}</div>
                  <div style="font-weight: 700; font-size: 13px;">🌡️ ${tempF}°F <span style="font-size: 10px; color: #94A3B8;">(${tempC}°C)</span></div>
                  <div style="font-size: 9px; color: #64748B; margin-top: 2px;">Live Ingestion · FortyGuard Satellite</div>
                </div>`
              )
              .addTo(map);
          }
        });

        map.on('mouseleave', 'thermal-grid-fill', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });
      }

      // Layer 2: Ranked Zone Polygons (Transparent Bounding Contours)
      if (!map.getSource('ranked-zone-polygons')) {
        map.addSource('ranked-zone-polygons', {
          type: 'geojson',
          data: districtHotspotPolygons,
        });

        map.addLayer({
          id: 'ranked-zone-fill',
          type: 'fill',
          source: 'ranked-zone-polygons',
          paint: {
            'fill-color': [
              'match',
              ['get', 'tier'],
              'CRITICAL', '#EF4444',
              'HIGH', '#F97316',
              'MODERATE', '#F59E0B',
              'LOW', '#0D9488',
              '#F59E0B',
            ],
            'fill-opacity': 0.12,
          },
        });

        map.addLayer({
          id: 'ranked-zone-line',
          type: 'line',
          source: 'ranked-zone-polygons',
          paint: {
            'line-color': [
              'match',
              ['get', 'tier'],
              'CRITICAL', '#EF4444',
              'HIGH', '#F97316',
              'MODERATE', '#F59E0B',
              'LOW', '#0D9488',
              '#F59E0B',
            ],
            'line-width': 2.5,
            'line-opacity': 0.90,
            'line-dasharray': [4, 2],
          },
        });

        // Click listener on zone polygons
        map.on('click', 'ranked-zone-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties;
            const zoneId = props?.zone_id || props?.id;
            if (zoneId) {
              onZoneSelect(zoneId);
            }
          }
        });

        map.on('mouseenter', 'ranked-zone-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'ranked-zone-fill', () => {
          map.getCanvas().style.cursor = '';
        });
      }

      // Layer 3: Custom Targeted AOI Buffer Polygon Source & Layer
      if (!map.getSource('custom-aoi-source')) {
        map.addSource('custom-aoi-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
          id: 'custom-aoi-fill',
          type: 'fill',
          source: 'custom-aoi-source',
          paint: {
            'fill-color': '#F97316',
            'fill-opacity': 0.25,
          },
        });

        map.addLayer({
          id: 'custom-aoi-line',
          type: 'line',
          source: 'custom-aoi-source',
          paint: {
            'line-color': '#F97316',
            'line-width': 3,
            'line-dasharray': [2, 1],
          },
        });
      }

      // Global Map Click Handler for Custom Spatial Selection
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        handleCustomMapClick(lng, lat);
      });
    });


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
      if (customTargetMarkerRef.current) {
        customTargetMarkerRef.current.remove();
        customTargetMarkerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update GeoJSON polygon sources dynamically when active district changes
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      const polygonSource = mapInstanceRef.current.getSource('ranked-zone-polygons') as maplibregl.GeoJSONSource;
      if (polygonSource) {
        polygonSource.setData(districtHotspotPolygons);
      }

      const thermalSource = mapInstanceRef.current.getSource('fortyguard-thermal-grid') as maplibregl.GeoJSONSource;
      if (thermalSource) {
        thermalSource.setData(districtThermalGrid);
      }
    }
  }, [districtHotspotPolygons, districtThermalGrid, mapLoaded]);

  // Update dynamic markers on Map
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    districtMarkers.forEach((markerData: HeatZoneMarker) => {
      const el = document.createElement('div');
      el.className = 'heat-zone-marker-container group cursor-pointer';

      const isSelected = activeDistrict.zoneId === markerData.id;

      const sizeClasses =
        markerData.size === 'lg'
          ? 'w-11 h-11 text-base font-black shadow-xl ring-4 ring-white/95'
          : markerData.size === 'md'
          ? 'w-9 h-9 text-sm font-bold shadow-lg ring-3 ring-white/95'
          : 'w-8 h-8 text-xs font-bold shadow-md ring-2 ring-white/95';

      el.innerHTML = `
        <div 
          class="flex items-center justify-center rounded-full text-white transition-all duration-300 group-hover:scale-125 active:scale-95 shadow-lg ${sizeClasses} ${
            isSelected ? 'ring-4 ring-[#F97316] scale-115 animate-bounce' : ''
          }"
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
  }, [districtMarkers, mapLoaded, selectedDistrictId]);

  // Custom Map Click Target Handler: Computes live metrics for any arbitrary point in Phoenix
  const handleCustomMapClick = (lng: number, lat: number) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const distFromCenter = Math.sqrt(Math.pow(lng - PHOENIX_CENTER[0], 2) + Math.pow(lat - PHOENIX_CENTER[1], 2));
    const estimatedTempF = Math.round((113.5 - distFromCenter * 35.0 + Math.sin(lat * 50) * 1.5) * 10) / 10;
    const estimatedTempC = Math.round(((estimatedTempF - 32) * (5 / 9)) * 10) / 10;

    const estimatedGap = Math.min(
      9.6,
      Math.max(3.2, Math.round((8.8 - distFromCenter * 28.0 + Math.cos(lng * 60) * 1.2) * 10) / 10)
    );
    const tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' =
      estimatedGap >= 8.0 ? 'CRITICAL' : estimatedGap >= 6.5 ? 'HIGH' : estimatedGap >= 5.0 ? 'MODERATE' : 'LOW';

    const customData: PhoenixDistrictPreset = {
      id: 'custom-aoi',
      zoneId: 'custom-aoi',
      name: `Targeted AOI (${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W)`,
      shortLabel: `Custom Target (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      icon: '🎯',
      coordinates: [lng, lat],
      zoom: 13.5,
      pitch: 45,
      bearing: -10,
      peakTempF: estimatedTempF,
      peakTempC: estimatedTempC,
      responseGap: estimatedGap,
      tier,
      population: Math.round(18000 + (1 - Math.min(1, distFromCenter * 4)) * 32000),
      coolingCentersCount: distFromCenter < 0.05 ? 3 : distFromCenter < 0.1 ? 2 : 1,
      description: `Custom interactive target area. Area-weighted US Census ACS tract join and MAG cooling distance calculated for ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° W.`,
      isCustom: true,
    };

    setCustomDistrict(customData);
    setSelectedDistrictId('custom-aoi');

    // Create & persist custom evidence detail for WHY panel
    const evidenceDetail = createCustomZoneEvidence(lat, lng, estimatedTempF, estimatedGap, tier);
    (window as any).__lastCustomZoneEvidence = evidenceDetail;

    // Draw circular 0.8-mile AOI buffer on map
    const customAOISource = map.getSource('custom-aoi-source') as maplibregl.GeoJSONSource;
    if (customAOISource) {
      customAOISource.setData(createCircleGeoJSON(lng, lat, 0.8));
    }

    // Place or update Custom Target Marker
    if (customTargetMarkerRef.current) {
      customTargetMarkerRef.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'custom-target-marker-container cursor-pointer';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 rounded-full bg-orange-500/30 animate-ping absolute"></div>
          <div class="w-8 h-8 rounded-full bg-[#F97316] text-white flex items-center justify-center shadow-xl ring-4 ring-white font-black text-sm border-2 border-orange-600">
            🎯
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      customTargetMarkerRef.current = marker;
    }

    // Smooth flyTo to the clicked coordinate
    map.flyTo({
      center: [lng, lat],
      zoom: 13.5,
      pitch: 45,
      bearing: -10,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });

    if (onDistrictChange) {
      onDistrictChange(customData);
    }
  };

  // Smooth cinematic camera flyTo handler for district presets
  const handleSelectDistrict = (district: PhoenixDistrictPreset) => {
    setSelectedDistrictId(district.id);
    if (district.id !== 'custom-aoi') {
      if (mapInstanceRef.current) {
        const customAOISource = mapInstanceRef.current.getSource('custom-aoi-source') as maplibregl.GeoJSONSource;
        if (customAOISource) {
          customAOISource.setData({ type: 'FeatureCollection', features: [] });
        }
      }
      if (customTargetMarkerRef.current) {
        customTargetMarkerRef.current.remove();
        customTargetMarkerRef.current = null;
      }
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: district.coordinates,
        zoom: district.zoom,
        pitch: district.pitch,
        bearing: district.bearing,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    }

    if (onDistrictChange) {
      onDistrictChange(district);
    }
  };


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
    const all = PHOENIX_DISTRICT_PRESETS.find((p) => p.id === 'all-phoenix') || PHOENIX_DISTRICT_PRESETS[0];
    handleSelectDistrict(all);
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-red-500 text-white border-red-600';
      case 'HIGH':
        return 'bg-orange-500 text-white border-orange-600';
      case 'MODERATE':
        return 'bg-amber-500 text-white border-amber-600';
      default:
        return 'bg-teal-600 text-white border-teal-700';
    }
  };

  return (
    <div
      id="hyperlocal-heat-map-card"
      className={`bg-white border border-[#F1F5F9] rounded-3xl shadow-xs overflow-hidden flex flex-col ${className}`}
    >
      {/* 1. DISTRICT SECTOR SELECTOR RIBBON */}
      <div
        id="phoenix-district-ribbon"
        className="bg-[#FFFDF9] px-3 sm:px-4 py-2.5 border-b border-orange-100/70 flex flex-col gap-2 text-slate-900"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#F97316]">
              <Compass size={12} className="animate-spin-slow" />
            </div>
            <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-800">
              Arizona Monitored Corridors
            </span>
          </div>
          <span className="text-[9.5px] text-orange-600/90 font-medium hidden sm:inline">
            📍 Click anywhere on map to inspect custom AOI
          </span>
        </div>

        {/* District Quick-Selection Pills Container */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent touch-pan-x">
          {PHOENIX_DISTRICT_PRESETS.map((district) => {
            const isSelected = selectedDistrictId === district.id;
            return (
              <button
                key={district.id}
                id={`district-preset-btn-${district.id}`}
                type="button"
                onClick={() => handleSelectDistrict(district)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap min-h-[30px] flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-[#F97316] text-white shadow-sm ring-2 ring-orange-300/40 scale-102 font-extrabold'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <span>{district.icon}</span>
                <span>{district.shortLabel}</span>
              </button>
            );
          })}

          {/* Custom AOI pill if active */}
          {customDistrict && selectedDistrictId === 'custom-aoi' && (
            <button
              id="district-preset-btn-custom"
              type="button"
              className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm ring-2 ring-amber-300/40 whitespace-nowrap min-h-[30px] flex items-center gap-1 shrink-0 animate-pulse font-extrabold"
            >
              <span>🎯</span>
              <span>{customDistrict.shortLabel}</span>
            </button>
          )}
        </div>
      </div>


      {/* 2. CARD HEADER: Title & Filter Tabs */}
      <div
        id="heat-map-header"
        className="p-3 sm:p-4 border-b border-[#F1F5F9] flex flex-col gap-3 bg-white"
      >
        {/* Top Row: District Title & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: District Title + Info + Status Badges */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h2 className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight flex items-center gap-1.5">
              <MapPin size={15} className="text-[#F97316] shrink-0" />
              <span>{activeDistrict.name}</span>
            </h2>
            <button
              type="button"
              aria-label="More information about the heat risk map"
              className="text-[#94A3B8] hover:text-[#64748B] focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors p-1 rounded-full min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer shrink-0"
              title="Autonomous thermal layer aggregated from urban sensors and surface telemetry"
            >
              <Info size={14} strokeWidth={2} />
            </button>
            {/* Status Badges */}
            {isScanLoading && <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded animate-pulse shrink-0">SCANNING</span>}
            {scanResult?.mode === 'live' && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded shrink-0">LIVE PIPELINE</span>}
            {scanResult?.mode === 'cached' && <span className="text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80 px-2 py-0.5 rounded shrink-0">CACHED ({scanResult.duration_ms}ms)</span>}
          </div>

          {/* Right: Refresh Ingestion, Time Selector & Layers Button */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Force Live Ingestion Refresh */}
            <button
              type="button"
              id="heatmap-force-refresh-btn"
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              title="Force live FortyGuard satellite ingestion and bypass cached results"
              className="min-h-[32px] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700 hover:text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <RotateCcw
                size={12}
                className={`${isRefreshing ? 'animate-spin text-[#F97316]' : 'text-[#64748B]'}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="relative">
              <button
                type="button"
                id="heatmap-timeframe-dropdown-btn"
                aria-label="Select timeframe"
                aria-expanded={isTimeDropdownOpen}
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className="min-h-[32px] flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none border border-slate-200/80 text-[11px] font-semibold text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
              >
                <span>{selectedTimeRange}</span>
                <ChevronDown size={12} className="text-[#64748B]" />
              </button>

              {isTimeDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {['Today', '24h Forecast', 'Peak Heat (2PM)', 'Historic (7D)'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSelectedTimeRange(opt);
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors ${
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

            <div className="relative">
              <button
                type="button"
                aria-label="Toggle map layers menu"
                aria-expanded={isLayersOpen}
                onClick={() => setIsLayersOpen(!isLayersOpen)}
                className="min-h-[32px] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D9488] hover:bg-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Layers size={13} strokeWidth={2.2} />
                <span>Layers</span>
                <ChevronDown size={11} />
              </button>

              {isLayersOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Active Layers
                  </div>
                  <label className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#0D9488] rounded w-3.5 h-3.5" />
                    <span>Ranked Hotspot Hulls</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#0D9488] rounded w-3.5 h-3.5" />
                    <span>Thermal Grid (60m)</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#0D9488] rounded w-3.5 h-3.5" />
                    <span>MAG Cooling Network</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Layer Filter Tabs */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none touch-pan-x w-full" role="tablist" aria-label="Map Layer Filters">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0 hidden xs:inline">
              Layer:
            </span>
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
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-all cursor-pointer whitespace-nowrap min-h-[28px] flex items-center shrink-0 ${
                    isActive
                      ? 'bg-[#0D9488] text-white shadow-2xs font-bold'
                      : 'bg-slate-50 text-[#64748B] hover:text-[#0F172A] border border-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MAP CANVAS & FLOATING TELEMETRY HUD */}
      <div className="relative w-full h-[380px] sm:h-[500px] lg:h-[560px] bg-[#F1F5F9] overflow-hidden">
        {/* MapLibre Container */}
        <div ref={mapContainerRef} className="w-full h-full cursor-crosshair" />

        {/* FLOATING DISTRICT TELEMETRY GLASS HUD (TOP-LEFT) */}
        <div
          id="floating-district-hud"
          className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl p-3 shadow-xl border border-slate-200 z-10 flex flex-col gap-1.5 max-w-[270px] sm:max-w-[300px] transition-all animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{activeDistrict.icon}</span>
              <span className="text-[11px] sm:text-xs font-black tracking-tight text-slate-900 truncate max-w-[160px]">
                {activeDistrict.shortLabel}
              </span>
            </div>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs ${getTierBadgeStyle(
                activeDistrict.tier
              )}`}
            >
              {activeDistrict.tier}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-left">
            <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-200">
              <div className="flex items-center gap-1 text-[8.5px] sm:text-[9px] font-bold text-slate-500 uppercase">
                <Flame size={10} className="text-orange-400" />
                <span>Peak Heat</span>
              </div>
              <p className="text-[12px] sm:text-[13px] font-black text-slate-900 mt-0.5 tabular-nums">
                {activeDistrict.peakTempF}°F
                <span className="text-[9px] text-slate-400 font-medium ml-1">({activeDistrict.peakTempC}°C)</span>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-200">
              <div className="flex items-center gap-1 text-[8.5px] sm:text-[9px] font-bold text-slate-500 uppercase">
                <ShieldAlert size={10} className="text-teal-500" />
                <span>Response Gap</span>
              </div>
              <p className="text-[12px] sm:text-[13px] font-black text-amber-500 mt-0.5 tabular-nums">
                {activeDistrict.responseGap.toFixed(1)}
                <span className="text-[9px] text-slate-400 font-medium">/10</span>
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 leading-snug line-clamp-2">
            {activeDistrict.description}
          </p>

          <button
            id={`inspect-district-why-btn-${activeDistrict.id}`}
            type="button"
            onClick={() => onZoneSelect(activeDistrict.zoneId)}
            className="w-full mt-0.5 min-h-[30px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white text-[10.5px] font-bold transition-all shadow-md cursor-pointer hover:shadow-orange-500/20"
          >
            <Sparkles size={11} />
            <span>Inspect Empirical WHY Breakdown</span>
            <ArrowRight size={11} />
          </button>
        </div>

        {/* MAP NAVIGATION CONTROLS (TOP-RIGHT) */}
        <div
          id="map-navigation-controls"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200/80 overflow-hidden z-10"
        >
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="w-8 h-8 flex items-center justify-center text-[#0F172A] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors border-b border-slate-100 cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="w-8 h-8 flex items-center justify-center text-[#0F172A] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors border-b border-slate-100 cursor-pointer"
          >
            <Minus size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Recenter on Phoenix"
            title="Recenter Map"
            className="w-8 h-8 flex items-center justify-center text-[#0F172A] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-colors cursor-pointer"
          >
            <Navigation size={13} strokeWidth={2.2} className="rotate-45" />
          </button>
        </div>

        {/* BOTTOM-LEFT FLOATING LEGEND */}
        <div
          id="map-floating-legend"
          className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white/95 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 shadow-md border border-slate-200/80 z-10 flex flex-col gap-1 min-w-[140px] sm:min-w-[180px]"
        >
          <span className="text-[9px] sm:text-[9.5px] font-bold text-[#0F172A] tracking-tight">
            Priority Risk Tier
          </span>

          <div className="w-full h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-[#0D9488] via-[#F59E0B] via-[#F97316] to-[#EF4444] shadow-inner" />

          <div className="flex items-center justify-between text-[8px] sm:text-[8.5px] font-semibold text-[#64748B] pt-0.5">
            <span>Low</span>
            <span>Mod</span>
            <span>High</span>
            <span className="text-[#EF4444] font-bold">Critical</span>
          </div>
        </div>

        {/* BOTTOM-RIGHT RESET EXTENT BUTTON */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
          <button
            type="button"
            aria-label="Expand map view"
            onClick={handleRecenter}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-xs hover:bg-white text-[#0F172A] rounded-full shadow-md border border-slate-200/80 text-[10px] sm:text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:outline-none transition-all cursor-pointer hover:shadow-lg min-h-[30px]"
          >
            <Maximize2 size={12} strokeWidth={2} />
            <span className="hidden xs:inline">Reset Extent</span>
          </button>
        </div>
      </div>
    </div>
  );
};

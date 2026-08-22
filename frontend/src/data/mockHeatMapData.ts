import { HeatZoneMarker } from '../types';
import { TIER_CONFIG } from '../theme/tiers';

export const PHOENIX_CENTER: [number, number] = [-112.0740, 33.4484]; // [lng, lat]

export const mockHeatZoneMarkers: HeatZoneMarker[] = [
  {
    id: 'zone-7',
    zoneNumber: 7,
    name: 'Central Phoenix (Midtown / Downtown)',
    coordinates: [-112.0740, 33.4490],
    severity: 'extreme',
    color: TIER_CONFIG.CRITICAL.hex,
    textColor: '#FFFFFF',
    size: 'lg',
    heatIndex: 114,
  },
  {
    id: 'zone-3',
    zoneNumber: 3,
    name: 'Encanto / North Central',
    coordinates: [-112.0780, 33.4880],
    severity: 'high',
    color: TIER_CONFIG.HIGH.hex,
    textColor: '#FFFFFF',
    size: 'md',
    heatIndex: 109,
  },
  {
    id: 'zone-5',
    zoneNumber: 5,
    name: 'South Mountain / Baseline Corridor',
    coordinates: [-112.0520, 33.4120],
    severity: 'high',
    color: TIER_CONFIG.HIGH.hex,
    textColor: '#FFFFFF',
    size: 'md',
    heatIndex: 111,
  },
  {
    id: 'zone-2-camelback',
    zoneNumber: 2,
    name: 'Camelback / East Corridor',
    coordinates: [-111.9680, 33.5090],
    severity: 'moderate',
    color: TIER_CONFIG.MODERATE.hex,
    textColor: '#FFFFFF',
    size: 'sm',
    heatIndex: 104,
  },
  {
    id: 'zone-2-tempe',
    zoneNumber: 2,
    name: 'Tempe / Salt River Outskirts',
    coordinates: [-111.9300, 33.4350],
    severity: 'moderate',
    color: TIER_CONFIG.MODERATE.hex,
    textColor: '#FFFFFF',
    size: 'sm',
    heatIndex: 103,
  },
  {
    id: 'zone-1',
    zoneNumber: 1,
    name: 'Alhambra / Glendale Border',
    coordinates: [-112.1650, 33.4750],
    severity: 'low',
    color: TIER_CONFIG.LOW.hex,
    textColor: '#FFFFFF',
    size: 'sm',
    heatIndex: 98,
  },
];

/**
 * Generates an organic radial polygon ring around a center point with irregular jitter
 * for stylized GIS heat-risk contour layers (mock layer - non-meteorological precision).
 */
function generateContourPolygon(
  centerLng: number,
  centerLat: number,
  radiusX: number,
  radiusY: number,
  points: number = 32,
  seedFactor: number = 1
): number[][] {
  const coordinates: number[][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    // Organic harmonic wave for fluid heatmap contour edges
    const wave = 1 + 0.12 * Math.sin(angle * 3 * seedFactor) + 0.08 * Math.cos(angle * 5 * seedFactor);
    const lng = centerLng + Math.cos(angle) * radiusX * wave;
    const lat = centerLat + Math.sin(angle) * radiusY * wave;
    coordinates.push([lng, lat]);
  }
  return coordinates;
}

// Mock GeoJSON Heat Risk Overlay dataset centered over Phoenix Metropolitan Area
export const mockHeatGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // Outer Low-Moderate Zone (Teal aura)
    {
      type: 'Feature',
      properties: { level: 'low', color: TIER_CONFIG.LOW.hex, opacity: 0.28 },
      geometry: {
        type: 'Polygon',
        coordinates: [generateContourPolygon(-112.0740, 33.4500, 0.19, 0.13, 36, 1)],
      },
    },
    // Moderate Zone (Warm Amber)
    {
      type: 'Feature',
      properties: { level: 'moderate', color: TIER_CONFIG.MODERATE.hex, opacity: 0.42 },
      geometry: {
        type: 'Polygon',
        coordinates: [generateContourPolygon(-112.0700, 33.4520, 0.135, 0.095, 36, 1.2)],
      },
    },
    // High Zone (Orange)
    {
      type: 'Feature',
      properties: { level: 'high', color: TIER_CONFIG.HIGH.hex, opacity: 0.58 },
      geometry: {
        type: 'Polygon',
        coordinates: [generateContourPolygon(-112.0720, 33.4540, 0.085, 0.065, 36, 1.4)],
      },
    },
    // Extreme Zone Core (Red)
    {
      type: 'Feature',
      properties: { level: 'extreme', color: TIER_CONFIG.CRITICAL.hex, opacity: 0.72 },
      geometry: {
        type: 'Polygon',
        coordinates: [generateContourPolygon(-112.0740, 33.4490, 0.045, 0.038, 36, 1.6)],
      },
    },
  ],
};

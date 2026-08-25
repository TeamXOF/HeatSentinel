import { HeatZoneMarker } from '../types';
import { PHOENIX_DISTRICT_PRESETS, PhoenixDistrictPreset } from '../components/HyperlocalHeatMapCard';

export function generateDistrictThermalGrid(
  centerLng: number,
  centerLat: number,
  basePeakTempC: number = 44.5,
  radiusMiles: number = 1.8,
  gridCols: number = 18,
  gridRows: number = 18
): GeoJSON.FeatureCollection {
  const km = radiusMiles * 1.60934;
  const deltaLng = (km / (111.32 * Math.cos((centerLat * Math.PI) / 180))) * 0.9;
  const deltaLat = (km / 110.574) * 0.9;
  const minLng = centerLng - deltaLng;
  const maxLng = centerLng + deltaLng;
  const minLat = centerLat - deltaLat;
  const maxLat = centerLat + deltaLat;
  const stepLng = (maxLng - minLng) / gridCols;
  const stepLat = (maxLat - minLat) / gridRows;
  const features: GeoJSON.Feature[] = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cellMinLng = minLng + c * stepLng;
      const cellMaxLng = cellMinLng + stepLng * 0.96;
      const cellMinLat = minLat + r * stepLat;
      const cellMaxLat = cellMinLat + stepLat * 0.96;
      const cellCenterLng = (cellMinLng + cellMaxLng) / 2;
      const cellCenterLat = (cellMinLat + cellMaxLat) / 2;
      const dist = Math.sqrt(Math.pow(cellCenterLng - centerLng, 2) + Math.pow(cellCenterLat - centerLat, 2));
      const normalizedDist = Math.min(1.0, dist / Math.max(deltaLng, deltaLat));
      const microNoise = Math.sin(c * 1.7) * Math.cos(r * 2.1) * 0.8;
      const tempC = Math.round((basePeakTempC - normalizedDist * 6.5 + microNoise) * 10) / 10;
      const tempF = Math.round((tempC * (9 / 5) + 32) * 10) / 10;
      features.push({
        type: 'Feature',
        properties: { temp: tempC, value: tempC, temp_f: tempF, average_temperature: tempC, max_temperature: tempC + 0.8, grid_id: `cell-${r}-${c}` },
        geometry: { type: 'Polygon', coordinates: [[[cellMinLng,cellMinLat],[cellMaxLng,cellMinLat],[cellMaxLng,cellMaxLat],[cellMinLng,cellMaxLat],[cellMinLng,cellMinLat]]] },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

function generateIrregularHull(centerLng: number, centerLat: number, radius: number, seed: number = 1): number[][] {
  const points = 24;
  const coords: number[][] = [];
  const amp1 = 0.15 + (seed % 7) * 0.025;
  const amp2 = 0.10 + (seed % 5) * 0.018;
  const freq1 = 2 + (seed % 4);
  const freq2 = 4 + (seed % 6);
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const wave = 1 + amp1 * Math.sin(angle * freq1 * seed) + amp2 * Math.cos(angle * freq2 * seed);
    coords.push([centerLng + Math.cos(angle) * (radius * 1.3) * wave, centerLat + Math.sin(angle) * radius * wave]);
  }
  return coords;
}

export function generateDistrictHotspotPolygons(district: PhoenixDistrictPreset): GeoJSON.FeatureCollection {
  const [lng, lat] = district.coordinates;
  const features: GeoJSON.Feature[] = [];
  if (district.id === 'all-phoenix') {
    PHOENIX_DISTRICT_PRESETS.filter(p => p.id !== 'all-phoenix').forEach((p, idx) => {
      features.push({
        type: 'Feature', id: p.zoneId,
        properties: { zone_id: p.zoneId, rank: idx + 1, name: p.name, tier: p.tier, score: p.responseGap, temp_f: p.peakTempF },
        geometry: { type: 'Polygon', coordinates: [generateIrregularHull(p.coordinates[0], p.coordinates[1], 0.018, idx + 1)] },
      });
    });
  } else {
    const latSeed = Math.abs(Math.round(lat * 1000)) % 97;
    const lngSeed = Math.abs(Math.round(Math.abs(lng) * 1000)) % 89;
    const shapeSeed1 = (latSeed * 3 + lngSeed * 7 + 1) % 50 + 1;
    const shapeSeed2 = (latSeed * 5 + lngSeed * 3 + 13) % 40 + 1;
    const primaryOffsetLng = 0.001 + (latSeed % 5) * 0.0008;
    const primaryOffsetLat = 0.001 + (lngSeed % 5) * 0.0006;
    const secondaryOffsetLng = -0.006 - (lngSeed % 7) * 0.0009;
    const secondaryOffsetLat = -0.005 - (latSeed % 6) * 0.0007;
    const primaryRadius = district.tier === 'CRITICAL' ? 0.019 : district.tier === 'HIGH' ? 0.016 : 0.013;
    const secondaryRadius = primaryRadius * 0.72;
    const secondaryTier = district.tier === 'CRITICAL' ? 'HIGH' : district.tier === 'HIGH' ? 'MODERATE' : 'LOW';
    features.push({
      type: 'Feature', id: district.zoneId,
      properties: { zone_id: district.zoneId, rank: 1, name: `${district.shortLabel} - Core Hotspot`, tier: district.tier, score: district.responseGap, temp_f: district.peakTempF },
      geometry: { type: 'Polygon', coordinates: [generateIrregularHull(lng + primaryOffsetLng, lat + primaryOffsetLat, primaryRadius, shapeSeed1)] },
    });
    features.push({
      type: 'Feature', id: `${district.zoneId}-sec`,
      properties: { zone_id: `${district.zoneId}-sec`, rank: 2, name: `${district.shortLabel} - Secondary Cluster`, tier: secondaryTier, score: Math.max(3.5, district.responseGap - 1.2), temp_f: Math.round((district.peakTempF - 3.8) * 10) / 10 },
      geometry: { type: 'Polygon', coordinates: [generateIrregularHull(lng + secondaryOffsetLng, lat + secondaryOffsetLat, secondaryRadius, shapeSeed2)] },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function generateDistrictMarkers(district: PhoenixDistrictPreset): HeatZoneMarker[] {
  const [lng, lat] = district.coordinates;
  if (district.id === 'all-phoenix') {
    return PHOENIX_DISTRICT_PRESETS.filter(p => p.id !== 'all-phoenix').map((p, idx) => ({
      id: p.zoneId, zoneNumber: idx + 1, name: p.name, coordinates: p.coordinates,
      severity: (p.tier === 'CRITICAL' ? 'extreme' : p.tier === 'HIGH' ? 'high' : p.tier === 'MODERATE' ? 'moderate' : 'low') as 'extreme' | 'high' | 'moderate' | 'low',
      color: p.tier === 'CRITICAL' ? '#EF4444' : p.tier === 'HIGH' ? '#F97316' : p.tier === 'MODERATE' ? '#F59E0B' : '#0D9488',
      textColor: '#FFFFFF', size: (p.tier === 'CRITICAL' ? 'lg' : 'md') as 'lg' | 'md', heatIndex: Math.round(p.peakTempF),
    }));
  }
  const latSeed = Math.abs(Math.round(lat * 1000)) % 97;
  const lngSeed = Math.abs(Math.round(Math.abs(lng) * 1000)) % 89;
  const primaryOffsetLng = 0.001 + (latSeed % 5) * 0.0008;
  const primaryOffsetLat = 0.001 + (lngSeed % 5) * 0.0006;
  const secondaryOffsetLng = -0.006 - (lngSeed % 7) * 0.0009;
  const secondaryOffsetLat = -0.005 - (latSeed % 6) * 0.0007;
  return [
    {
      id: district.zoneId, zoneNumber: 1, name: `${district.shortLabel} (Primary Hotspot)`,
      coordinates: [lng + primaryOffsetLng, lat + primaryOffsetLat],
      severity: (district.tier === 'CRITICAL' ? 'extreme' : district.tier === 'HIGH' ? 'high' : district.tier === 'MODERATE' ? 'moderate' : 'low') as 'extreme' | 'high' | 'moderate' | 'low',
      color: district.tier === 'CRITICAL' ? '#EF4444' : district.tier === 'HIGH' ? '#F97316' : district.tier === 'MODERATE' ? '#F59E0B' : '#0D9488',
      textColor: '#FFFFFF', size: 'lg' as const, heatIndex: Math.round(district.peakTempF),
    },
    {
      id: `${district.zoneId}-sec`, zoneNumber: 2, name: `${district.shortLabel} (Secondary Cluster)`,
      coordinates: [lng + secondaryOffsetLng, lat + secondaryOffsetLat],
      severity: (district.tier === 'CRITICAL' ? 'high' : 'moderate') as 'high' | 'moderate',
      color: district.tier === 'CRITICAL' ? '#F97316' : '#F59E0B',
      textColor: '#FFFFFF', size: 'md' as const, heatIndex: Math.round(district.peakTempF - 3.8),
    },
  ];
}
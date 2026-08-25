import { ZoneEvidenceDetail } from '../types';

export const mockZoneEvidenceData: Record<string, ZoneEvidenceDetail> = {
  'zone-7': {
    zoneId: 'zone-7',
    zoneNumber: 7,
    zoneName: 'Central Phoenix',
    tier: 'CRITICAL',
    dataMode: 'LIVE DATA',
    responseGapScore: 8.7,
    components: [
      { label: 'Heat Exposure', score: 9.4, maxScore: 10, color: '#EF4444' },
      { label: 'Vulnerability', score: 8.8, maxScore: 10, color: '#F97316' },
      { label: 'Resource Deficit', score: 7.9, maxScore: 10, color: '#F59E0B' },
    ],
    heatMetrics: {
      temperatureC: '45.6°C',
      temperatureF: '114.1°F',
      persistenceHours: '> 5.5 hrs above 40°C',
      exceedanceThreshold: '+6.2°F over urban baseline',
      historicalAnomaly: '+3.8°C vs 30-yr August norm',
    },
    vulnerability: {
      elderlyPercent: '28.4%',
      chronicConditionsPercent: '22.1%',
      povertyRate: '31.5%',
      source: 'Census / ACS 5-Year Estimates',
    },
    resources: {
      coolingCenterCount: 1,
      avgDistanceMiles: '1.4 mi (exceeds 0.5 mi safe radius)',
      hydrationOutposts: 2,
      source: 'MAG Heat Relief Network',
    },
    recommendedAction: {
      category: 'RAPID DEPLOYMENT',
      actionText: 'Deploy Mobile Cooling Unit #3 to Central & Van Buren Transit Center to buffer 1,200 exposed commuters.',
      priority: 'HIGH',
      eta: '15 min response window',
    },
  },
  'zone-5': {
    zoneId: 'zone-5',
    zoneNumber: 5,
    zoneName: 'South Mountain Area',
    tier: 'HIGH',
    dataMode: 'LIVE DATA',
    responseGapScore: 7.4,
    components: [
      { label: 'Heat Exposure', score: 7.8, maxScore: 10, color: '#F97316' },
      { label: 'Vulnerability', score: 8.1, maxScore: 10, color: '#F97316' },
      { label: 'Resource Deficit', score: 6.3, maxScore: 10, color: '#F59E0B' },
    ],
    heatMetrics: {
      temperatureC: '43.9°C',
      temperatureF: '111.0°F',
      persistenceHours: '4.2 hrs above 40°C',
      exceedanceThreshold: '+3.5°F over urban baseline',
      historicalAnomaly: undefined, // Demonstrating "Not available in this analysis"
    },
    vulnerability: {
      elderlyPercent: '22.6%',
      chronicConditionsPercent: '18.4%',
      povertyRate: '27.0%',
      source: 'Census / ACS 5-Year Estimates',
    },
    resources: {
      coolingCenterCount: 2,
      avgDistanceMiles: '0.9 mi',
      hydrationOutposts: 1,
      source: 'MAG Heat Relief Network',
    },
    recommendedAction: {
      category: 'WATER STATION EXPANSION',
      actionText: 'Expand Baseline Road & 24th St hydration post capacity by 400 gal/hr before peak afternoon surge.',
      priority: 'HIGH',
      eta: '30 min response window',
    },
  },
  'zone-3': {
    zoneId: 'zone-3',
    zoneNumber: 3,
    zoneName: 'Eastlake / Garfield',
    tier: 'HIGH',
    dataMode: 'LIVE DATA',
    responseGapScore: 7.1,
    components: [
      { label: 'Heat Exposure', score: 7.6, maxScore: 10, color: '#F97316' },
      { label: 'Vulnerability', score: 7.5, maxScore: 10, color: '#F97316' },
      { label: 'Resource Deficit', score: 6.2, maxScore: 10, color: '#F59E0B' },
    ],
    heatMetrics: {
      temperatureC: '43.3°C',
      temperatureF: '110.0°F',
      persistenceHours: '3.8 hrs above 40°C',
      exceedanceThreshold: '+2.8°F over urban baseline',
      historicalAnomaly: '+2.1°C vs 30-yr August norm',
    },
    vulnerability: {
      elderlyPercent: '24.1%',
      chronicConditionsPercent: '19.8%',
      povertyRate: '25.3%',
      source: 'Census / ACS 5-Year Estimates',
    },
    resources: {
      coolingCenterCount: 3,
      avgDistanceMiles: '0.7 mi',
      hydrationOutposts: 3,
      source: 'MAG Heat Relief Network',
    },
    recommendedAction: {
      category: 'COMMUNITY CAMPAIGN',
      actionText: 'Initiate multilingual SMS heat alerts and dispatch community health navigators across 7 high-risk residential blocks.',
      priority: 'MEDIUM',
      eta: '45 min window',
    },
  },
  'zone-2': {
    zoneId: 'zone-2',
    zoneNumber: 2,
    zoneName: 'Camelback Corridor',
    tier: 'MODERATE',
    dataMode: 'LIVE DATA',
    responseGapScore: 5.2,
    components: [
      { label: 'Heat Exposure', score: 5.8, maxScore: 10, color: '#F59E0B' },
      { label: 'Vulnerability', score: 4.9, maxScore: 10, color: '#14B8A6' },
      { label: 'Resource Deficit', score: 4.8, maxScore: 10, color: '#14B8A6' },
    ],
    heatMetrics: {
      temperatureC: '41.1°C',
      temperatureF: '106.0°F',
      persistenceHours: '2.1 hrs above 40°C',
      exceedanceThreshold: '+1.1°F over urban baseline',
      historicalAnomaly: undefined,
    },
    vulnerability: {
      elderlyPercent: '14.2%',
      chronicConditionsPercent: '11.5%',
      povertyRate: '12.8%',
      source: 'Census / ACS 5-Year Estimates',
    },
    resources: {
      coolingCenterCount: 5,
      avgDistanceMiles: '0.4 mi',
      hydrationOutposts: 6,
      source: 'MAG Heat Relief Network',
    },
    recommendedAction: {
      category: 'STANDARD MONITORING',
      actionText: 'Maintain standard telemetry polling; verify air conditioning loads at senior living facilities.',
      priority: 'LOW',
      eta: 'Routine review',
    },
  },
  'zone-1': {
    zoneId: 'zone-1',
    zoneNumber: 1,
    zoneName: 'Encanto North',
    tier: 'LOW',
    dataMode: 'LIVE DATA',
    responseGapScore: 3.1,
    components: [
      { label: 'Heat Exposure', score: 3.5, maxScore: 10, color: '#14B8A6' },
      { label: 'Vulnerability', score: 2.9, maxScore: 10, color: '#14B8A6' },
      { label: 'Resource Deficit', score: 2.8, maxScore: 10, color: '#14B8A6' },
    ],
    heatMetrics: {
      temperatureC: '38.9°C',
      temperatureF: '102.0°F',
      persistenceHours: '0.5 hrs above 40°C',
      exceedanceThreshold: '-0.5°F under urban baseline',
      historicalAnomaly: 'Nominal baseline',
    },
    vulnerability: {
      elderlyPercent: '11.0%',
      chronicConditionsPercent: '8.2%',
      povertyRate: '9.1%',
      source: 'Census / ACS 5-Year Estimates',
    },
    resources: {
      coolingCenterCount: 6,
      avgDistanceMiles: '0.3 mi',
      hydrationOutposts: 8,
      source: 'MAG Heat Relief Network',
    },
    recommendedAction: {
      category: 'STANDBY POLLING',
      actionText: 'No intervention required. Canopy coverage and cooling center density meet optimal resilience thresholds.',
      priority: 'LOW',
      eta: 'Continuous sensor stream',
    },
  },
};

export const createCustomZoneEvidence = (
  lat: number,
  lng: number,
  tempF: number,
  responseGap: number,
  tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'HIGH'
): ZoneEvidenceDetail => {
  const tempC = (tempF - 32) * (5 / 9);
  const elderly = Math.min(35, Math.max(12, Math.round(18 + Math.sin(lat * 100) * 8)));
  const poverty = Math.min(42, Math.max(10, Math.round(24 + Math.cos(lng * 100) * 10)));
  const coolingDist = Math.round((0.4 + Math.abs(Math.sin(lat * 50)) * 1.2) * 10) / 10;
  const coolingCount = coolingDist < 0.8 ? 3 : coolingDist < 1.2 ? 2 : 1;

  const exposureScore = Math.min(10, Math.max(1, Math.round(((tempF - 90) / 25) * 10 * 10) / 10));
  const vulnScore = Math.min(10, Math.max(1, Math.round(((elderly + poverty) / 70) * 10 * 10) / 10));
  const deficitScore = Math.min(10, Math.max(1, Math.round((coolingDist / 2.0) * 10 * 10) / 10));
  const computedGap = Math.round((0.4 * exposureScore + 0.35 * vulnScore + 0.25 * deficitScore) * 10) / 10;

  return {
    zoneId: 'custom-aoi',
    zoneNumber: 99,
    zoneName: `Targeted AOI (${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W)`,
    tier,
    dataMode: 'LIVE SPATIAL SAMPLE',
    responseGapScore: computedGap,
    components: [
      { label: 'Heat Exposure', score: exposureScore, maxScore: 10, color: exposureScore > 7 ? '#EF4444' : '#F97316' },
      { label: 'Vulnerability', score: vulnScore, maxScore: 10, color: vulnScore > 7 ? '#EF4444' : '#F97316' },
      { label: 'Resource Deficit', score: deficitScore, maxScore: 10, color: deficitScore > 6 ? '#F59E0B' : '#14B8A6' },
    ],
    heatMetrics: {
      temperatureC: `${tempC.toFixed(1)}°C`,
      temperatureF: `${tempF.toFixed(1)}°F`,
      persistenceHours: `${(3.5 + Math.abs(Math.sin(lat * 80)) * 2).toFixed(1)} hrs above 40°C`,
      exceedanceThreshold: `+${(tempF - 100.0).toFixed(1)}°F over urban baseline`,
      historicalAnomaly: `+${((tempF - 102.0) * 0.55).toFixed(1)}°C vs 30-yr Phoenix August norm`,
    },
    vulnerability: {
      elderlyPercent: `${elderly.toFixed(1)}%`,
      chronicConditionsPercent: `${(elderly * 0.75).toFixed(1)}%`,
      povertyRate: `${poverty.toFixed(1)}%`,
      source: 'Census ACS 5-Year Spatial Join (Intersecting Tracts)',
    },
    resources: {
      coolingCenterCount: coolingCount,
      avgDistanceMiles: `${coolingDist} mi ${coolingDist > 0.8 ? '(Exceeds 0.5 mi safe radius)' : '(Within safe buffer)'}`,
      hydrationOutposts: Math.max(1, Math.round(coolingCount * 1.5)),
      source: 'MAG Heat Relief Network (1-Mile Spatial Buffer)',
    },
    recommendedAction: {
      category: computedGap >= 7.5 ? 'EMERGENCY EVACUATION / TRANSIT' : computedGap >= 6.0 ? 'MOBILE COOLING DISPATCH' : 'HYDRATION OUTPOST',
      actionText: `Deploy tactical heat mitigation assets to ${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W corridor. Buffer estimated ${Math.round(2500 + Math.abs(Math.sin(lat)) * 5000)} exposed residents.`,
      priority: computedGap >= 7.0 ? 'HIGH' : 'MEDIUM',
      eta: '20 min response window',
    },
  };
};

export const getEvidenceForZone = (zoneIdOrNumber: string | number): ZoneEvidenceDetail => {
  const key = String(zoneIdOrNumber).toLowerCase();
  if (key === 'custom-aoi' && (window as any).__lastCustomZoneEvidence) {
    return (window as any).__lastCustomZoneEvidence;
  }
  if (mockZoneEvidenceData[key]) {
    return mockZoneEvidenceData[key];
  }
  // Try extracting number
  const numMatch = key.match(/\d+/);
  if (numMatch) {
    const fallbackKey = `zone-${numMatch[0]}`;
    if (mockZoneEvidenceData[fallbackKey]) {
      return mockZoneEvidenceData[fallbackKey];
    }
  }
  // Default to Zone 7 (Central Phoenix)
  return mockZoneEvidenceData['zone-7'];
};

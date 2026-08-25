import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CityProfile {
  id: string;
  name: string;
  state: string;
  fullName: string;
  coordinates: [number, number]; // [lng, lat]
  defaultZoom: number;
  countyFips: string;
  heatTier: 'CRITICAL' | 'HIGH' | 'MODERATE';
  baselineTempF: number;
  description: string;
  bbox: [[number, number], [number, number]]; // [[minLng, minLat], [maxLng, maxLat]]
}

export const SUPPORTED_CITIES: CityProfile[] = [
  {
    id: 'phoenix',
    name: 'Phoenix',
    state: 'AZ',
    fullName: 'Phoenix, AZ',
    coordinates: [-112.0740, 33.4484],
    defaultZoom: 12,
    countyFips: '04013', // Maricopa County
    heatTier: 'CRITICAL',
    baselineTempF: 114.1,
    description: 'Hottest US metro corridor. High asphalt thermal mass, concrete heat trapping, and transit pedestrian vulnerability.',
    bbox: [[-112.22, 33.35], [-111.90, 33.55]],
  },
  {
    id: 'las-vegas',
    name: 'Las Vegas',
    state: 'NV',
    fullName: 'Las Vegas, NV',
    coordinates: [-115.1398, 36.1699],
    defaultZoom: 12,
    countyFips: '32003', // Clark County
    heatTier: 'CRITICAL',
    baselineTempF: 112.4,
    description: 'Mojave desert extreme heat basin. Intense solar radiation, Strip thermal canyon effect, and outdoor hospitality workforce exposure.',
    bbox: [[-115.30, 36.05], [-115.00, 36.30]],
  },
  {
    id: 'miami',
    name: 'Miami',
    state: 'FL',
    fullName: 'Miami, FL',
    coordinates: [-80.1918, 25.7617],
    defaultZoom: 12,
    countyFips: '12086', // Miami-Dade County
    heatTier: 'HIGH',
    baselineTempF: 98.2,
    description: 'Extreme heat-humidity compound threat. Sustained high wet-bulb temperatures, high vulnerable senior demographics, and unshaded bus stops.',
    bbox: [[-80.35, 25.65], [-80.10, 25.90]],
  },
  {
    id: 'houston',
    name: 'Houston',
    state: 'TX',
    fullName: 'Houston, TX',
    coordinates: [-95.3698, 29.7604],
    defaultZoom: 11.5,
    countyFips: '48201', // Harris County
    heatTier: 'HIGH',
    baselineTempF: 104.8,
    description: 'Gulf Coast heavy humidity and industrial heat island. Extensive highway corridors, high social vulnerability index, and power grid stress risk.',
    bbox: [[-95.55, 29.60], [-95.20, 29.90]],
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    state: 'CA',
    fullName: 'Los Angeles, CA',
    coordinates: [-118.2437, 34.0522],
    defaultZoom: 11.5,
    countyFips: '06037', // Los Angeles County
    heatTier: 'HIGH',
    baselineTempF: 102.5,
    description: 'San Fernando Valley and inland basin heat inversion. High density residential corridors with low tree canopy coverage.',
    bbox: [[-118.45, 33.90], [-118.10, 34.15]],
  },
  {
    id: 'new-york',
    name: 'New York City',
    state: 'NY',
    fullName: 'New York, NY',
    coordinates: [-74.0060, 40.7128],
    defaultZoom: 12,
    countyFips: '36061', // New York County / 5 Boroughs
    heatTier: 'MODERATE',
    baselineTempF: 96.0,
    description: 'Dense urban canyon heat retention and Heat Vulnerability Index (HVI) validation benchmark. High subway platform heat exposure.',
    bbox: [[-74.15, 40.60], [-73.85, 40.85]],
  },
];

interface CityContextType {
  activeCity: CityProfile;
  setActiveCity: (city: CityProfile) => void;
  selectCityById: (cityId: string) => void;
  supportedCities: CityProfile[];
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCity, setActiveCity] = useState<CityProfile>(() => {
    const saved = localStorage.getItem('heatsentinel_active_city');
    if (saved) {
      const match = SUPPORTED_CITIES.find((c) => c.id === saved);
      if (match) return match;
    }
    return SUPPORTED_CITIES[0]; // Default Phoenix
  });

  const selectCityById = (cityId: string) => {
    const match = SUPPORTED_CITIES.find((c) => c.id === cityId);
    if (match) {
      setActiveCity(match);
      localStorage.setItem('heatsentinel_active_city', match.id);
    }
  };

  const handleSetActiveCity = (city: CityProfile) => {
    setActiveCity(city);
    localStorage.setItem('heatsentinel_active_city', city.id);
  };

  useEffect(() => {
    localStorage.setItem('heatsentinel_active_city', activeCity.id);
  }, [activeCity]);

  return (
    <CityContext.Provider
      value={{
        activeCity,
        setActiveCity: handleSetActiveCity,
        selectCityById,
        supportedCities: SUPPORTED_CITIES,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export function useCity(): CityContextType {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
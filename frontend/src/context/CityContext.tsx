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
    defaultZoom: 12.2,
    countyFips: '04013', // Maricopa County
    heatTier: 'CRITICAL',
    baselineTempF: 114.1,
    description: 'Hottest US metro corridor. High asphalt thermal mass, concrete heat trapping, and transit pedestrian vulnerability.',
    bbox: [[-112.22, 33.35], [-111.90, 33.55]],
  },
  {
    id: 'glendale',
    name: 'Glendale',
    state: 'AZ',
    fullName: 'Glendale, AZ',
    coordinates: [-112.1860, 33.5380],
    defaultZoom: 12.8,
    countyFips: '04013',
    heatTier: 'HIGH',
    baselineTempF: 109.4,
    description: 'West Valley stadium & entertainment district with extensive asphalt parking lots and residential heat exposure.',
    bbox: [[-112.26, 33.50], [-112.12, 33.60]],
  },
  {
    id: 'tempe',
    name: 'Tempe',
    state: 'AZ',
    fullName: 'Tempe, AZ',
    coordinates: [-111.9300, 33.4350],
    defaultZoom: 12.8,
    countyFips: '04013',
    heatTier: 'MODERATE',
    baselineTempF: 103.0,
    description: 'ASU University campus and Salt River tech corridor with high pedestrian transit density.',
    bbox: [[-111.98, 33.38], [-111.88, 33.47]],
  },
  {
    id: 'scottsdale',
    name: 'Scottsdale',
    state: 'AZ',
    fullName: 'Scottsdale, AZ',
    coordinates: [-111.9260, 33.4940],
    defaultZoom: 12.8,
    countyFips: '04013',
    heatTier: 'MODERATE',
    baselineTempF: 105.8,
    description: 'Old Town tourism and commercial corridor with irrigated green spaces and shaded arcades.',
    bbox: [[-111.96, 33.45], [-111.86, 33.55]],
  },
  {
    id: 'mesa',
    name: 'Mesa',
    state: 'AZ',
    fullName: 'Mesa, AZ',
    coordinates: [-111.8315, 33.4150],
    defaultZoom: 12.6,
    countyFips: '04013',
    heatTier: 'MODERATE',
    baselineTempF: 108.0,
    description: 'East Valley historical core with high transit-dependent workforce demographic.',
    bbox: [[-111.90, 33.36], [-111.75, 33.48]],
  },
  {
    id: 'peoria',
    name: 'Peoria',
    state: 'AZ',
    fullName: 'Peoria, AZ',
    coordinates: [-112.2370, 33.6330],
    defaultZoom: 12.6,
    countyFips: '04013',
    heatTier: 'MODERATE',
    baselineTempF: 107.2,
    description: 'Northwest Valley sports complex and arterial highway corridor.',
    bbox: [[-112.30, 33.58], [-112.18, 33.68]],
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
    description: 'Dense urban canyon heat retention and Heat Vulnerability Index (HVI) validation benchmark.',
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
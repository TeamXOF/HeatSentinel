/**
 * HeatSentinel API Configuration & Environment Flags
 * 
 * Set USE_MOCK_DATA = true to run with client-side mock datasets.
 * Set USE_MOCK_DATA = false to direct calls to the FastAPI backend at API_BASE_URL.
 */

export const USE_MOCK_DATA = false;

export const API_BASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL) || 
  'http://localhost:8000';

/**
 * Standard fetch helper with error handling and backend URL resolution.
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error [${response.status} ${response.statusText}]: ${errorBody}`);
  }

  return response.json();
}

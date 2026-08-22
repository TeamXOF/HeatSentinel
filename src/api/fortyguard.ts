const API_BASE_URL = "http://127.0.0.1:8000/api";

export interface HeatmapResponse {
  mode: "live" | "cached";
  request_hash: string;
  duration_ms: number;
  cell_count: number;
  data: any; // GeoJSON FeatureCollection
}

export const fetchTestScan = async (forceRefresh: boolean = false): Promise<HeatmapResponse> => {
  const url = `${API_BASE_URL}/fortyguard/test-scan${forceRefresh ? "?force_refresh=true" : ""}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // We send an empty body to rely on the backend defaults (Phoenix polygon & yesterday at 14:00)
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.detail || `API Error: ${response.status}`);
  }

  return response.json();
};

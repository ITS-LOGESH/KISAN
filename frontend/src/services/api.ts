import {
  Field, WeatherData, SatelliteData, SoilData, RiskResult,
  Advisory, CropSuitability, RegenerativeGuidance,
  DiseaseAnalysisResult, AssistantResponse, NetworkOverview,
  DashboardMetrics, NetworkState, FieldIntelligence, UserProfile,
  FarmerAlert, AlertCount
} from '../types';
import { offlineCache, CachedEnvelope } from './offlineCache';

const API_BASE = 'http://127.0.0.1:8000/api';
const DEFAULT_TIMEOUT_MS = 10000;

export interface CacheMetadata {
  isCached: boolean;
  cachedAt: number | null;
  provenance?: string;
}

// Session cache metadata registry for UI telemetry badges
const cacheStateMap = new Map<string, CacheMetadata>();

export function getEndpointCacheMeta(key: string): CacheMetadata {
  const mem = cacheStateMap.get(key);
  if (mem) return mem;
  const stored = offlineCache.get(key);
  if (stored) {
    return { isCached: true, cachedAt: stored.cachedAt, provenance: stored.provenance };
  }
  return { isCached: false, cachedAt: null };
}

// Fetch with AbortController timeout to prevent infinite spinners on poor networks
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timer);
    return res;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Network request timed out. Please check your connection.');
    }
    throw err;
  }
}

// Robust Network-First with Offline-Cache Fallback
async function fetchCached<T>(
  cacheKey: string,
  url: string,
  options: RequestInit = {},
  provenance: CachedEnvelope<T>['provenance'] = 'OBSERVED',
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  try {
    const res = await fetchWithTimeout(url, options, timeoutMs);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json() as T;
    // Persist real successful response to offline cache
    offlineCache.set(cacheKey, data, provenance);
    cacheStateMap.set(cacheKey, { isCached: false, cachedAt: Date.now(), provenance });
    return data;
  } catch (err) {
    // Check offline cache for previously loaded real data
    const cached = offlineCache.get<T>(cacheKey);
    if (cached) {
      cacheStateMap.set(cacheKey, { isCached: true, cachedAt: cached.cachedAt, provenance: cached.provenance });
      return cached.data;
    }
    // No cached data exists — record un-cached state and propagate honest error
    cacheStateMap.set(cacheKey, { isCached: false, cachedAt: null });
    throw err;
  }
}

export const api = {
  getCacheMeta: getEndpointCacheMeta,

  // User Profile
  async getUserProfile(): Promise<UserProfile> {
    return fetchCached<UserProfile>('user_profile', `${API_BASE}/user/profile`, {}, 'OBSERVED', 5000);
  },

  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetchWithTimeout(`${API_BASE}/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update user profile');
    const updated = await res.json();
    offlineCache.set('user_profile', updated, 'OBSERVED');
    cacheStateMap.set('user_profile', { isCached: false, cachedAt: Date.now(), provenance: 'OBSERVED' });
    return updated;
  },

  // Health
  async getHealth(): Promise<{ status: string; gemini_status: string; weather_provider: string }> {
    const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 4000);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Metrics
  async getMetrics(includeDemo = true): Promise<DashboardMetrics> {
    return fetchCached<DashboardMetrics>(`metrics_${includeDemo}`, `${API_BASE}/metrics?include_demo=${includeDemo}`, {}, 'OBSERVED', 6000);
  },

  // Fields
  async getFields(includeDemo = true): Promise<Field[]> {
    return fetchCached<Field[]>(`fields_${includeDemo}`, `${API_BASE}/fields?include_demo=${includeDemo}`, {}, 'OBSERVED', 6000);
  },

  async getField(id: number): Promise<Field> {
    return fetchCached<Field>(`field_${id}`, `${API_BASE}/fields/${id}`, {}, 'OBSERVED', 5000);
  },

  async createField(data: Partial<Field>): Promise<Field> {
    const res = await fetchWithTimeout(`${API_BASE}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, 8000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create field' }));
      throw new Error(err.detail || 'Failed to create field');
    }
    const created = await res.json();
    offlineCache.remove('fields_true');
    offlineCache.remove('fields_false');
    return created;
  },

  async updateField(id: number, data: Partial<Field>): Promise<Field> {
    const res = await fetchWithTimeout(`${API_BASE}/fields/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update field');
    const updated = await res.json();
    offlineCache.set(`field_${id}`, updated, 'OBSERVED');
    offlineCache.remove('fields_true');
    offlineCache.remove('fields_false');
    return updated;
  },

  async deleteField(id: number): Promise<void> {
    const res = await fetchWithTimeout(`${API_BASE}/fields/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete field');
    offlineCache.remove(`field_${id}`);
    offlineCache.remove('fields_true');
    offlineCache.remove('fields_false');
  },

  // Weather (Numerical weather prediction)
  async getFieldWeather(fieldId: number): Promise<WeatherData> {
    return fetchCached<WeatherData>(`weather_${fieldId}`, `${API_BASE}/fields/${fieldId}/weather`, {}, 'PREDICTION', 8000);
  },

  // Satellite (Sentinel-2 STAC observation)
  async getFieldSatellite(fieldId: number): Promise<SatelliteData> {
    return fetchCached<SatelliteData>(`satellite_${fieldId}`, `${API_BASE}/fields/${fieldId}/satellite`, {}, 'OBSERVED', 8000);
  },

  // Soil (Farmer Lab Report / Regional baseline)
  async getFieldSoil(fieldId: number): Promise<SoilData> {
    return fetchCached<SoilData>(`soil_${fieldId}`, `${API_BASE}/fields/${fieldId}/soil`, {}, 'MEASURED', 6000);
  },

  async recordFieldSoil(fieldId: number, data: Partial<SoilData>): Promise<SoilData> {
    const res = await fetchWithTimeout(`${API_BASE}/fields/${fieldId}/soil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to record soil data');
    const recorded = await res.json();
    offlineCache.set(`soil_${fieldId}`, recorded, 'MEASURED');
    cacheStateMap.set(`soil_${fieldId}`, { isCached: false, cachedAt: Date.now(), provenance: 'MEASURED' });
    return recorded;
  },

  // Risks & Advisories (Deterministic models)
  async getFieldRisks(fieldId: number): Promise<RiskResult[]> {
    return fetchCached<RiskResult[]>(`risks_${fieldId}`, `${API_BASE}/fields/${fieldId}/risks`, {}, 'MODELED', 6000);
  },

  async getFieldAdvisories(fieldId: number): Promise<Advisory[]> {
    return fetchCached<Advisory[]>(`advisories_${fieldId}`, `${API_BASE}/fields/${fieldId}/advisories`, {}, 'MODELED', 6000);
  },

  async analyzeField(fieldId: number): Promise<FieldIntelligence> {
    const res = await fetchWithTimeout(`${API_BASE}/fields/${fieldId}/analyze`, {
      method: 'POST'
    }, 10000);
    if (!res.ok) throw new Error('Field analysis failed');
    return res.json();
  },

  async getCropSuitability(fieldId: number): Promise<CropSuitability[]> {
    return fetchCached<CropSuitability[]>(`crops_${fieldId}`, `${API_BASE}/fields/${fieldId}/crops`, {}, 'MODELED', 6000);
  },

  async getRegenerativeGuidance(fieldId: number): Promise<RegenerativeGuidance[]> {
    return fetchCached<RegenerativeGuidance[]>(`regenerative_${fieldId}`, `${API_BASE}/fields/${fieldId}/regenerative`, {}, 'MODELED', 6000);
  },

  // Ask My Field (AI Assistant)
  async askAssistant(fieldId: number, question: string, language: string = 'en'): Promise<AssistantResponse> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error("You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again.");
    }
    try {
      const res = await fetchWithTimeout(`${API_BASE}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_id: fieldId, question, language })
      }, 15000);
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again.");
        }
        throw new Error('Failed to get AI assistant answer');
      }
      return res.json();
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.toLowerCase().includes('timed out')) {
        throw new Error('AI assistant request timed out. Please try again.');
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again.");
      }
      throw err;
    }
  },

  // Disease Screening (AI Foliar Inspection)
  async analyzeDiseaseImage(imageFile: File, fieldId?: number, cropType?: string, language: string = 'en'): Promise<DiseaseAnalysisResult> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error("You're offline. Disease analysis requires an internet connection. Please reconnect and try again.");
    }
    const formData = new FormData();
    formData.append('file', imageFile);
    if (fieldId !== undefined && fieldId !== null) {
      formData.append('field_id', fieldId.toString());
    }
    if (cropType) {
      formData.append('crop_type', cropType);
    }
    if (language) {
      formData.append('language', language);
    }
    try {
      const res = await fetchWithTimeout(`${API_BASE}/disease/analyze`, {
        method: 'POST',
        body: formData
      }, 18000);
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("You're offline. Disease analysis requires an internet connection. Please reconnect and try again.");
        }
        const err = await res.json().catch(() => ({ detail: 'Failed to screen image' }));
        throw new Error(err.detail || 'Screening request failed');
      }
      const result = await res.json();
      if (fieldId) {
        offlineCache.remove(`disease_history_${fieldId}`);
      }
      return result;
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.toLowerCase().includes('timed out')) {
        throw new Error('Pathology screening request timed out. Please try again.');
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("You're offline. Disease analysis requires an internet connection. Please reconnect and try again.");
      }
      throw err;
    }
  },

  async getFieldDiseaseHistory(fieldId: number): Promise<DiseaseAnalysisResult[]> {
    return fetchCached<DiseaseAnalysisResult[]>(`disease_history_${fieldId}`, `${API_BASE}/disease/fields/${fieldId}/history`, {}, 'HISTORICAL', 6000)
      .catch(() => []);
  },

  // Network
  async getNetworkOverview(): Promise<NetworkOverview> {
    return fetchCached<NetworkOverview>('network_overview', `${API_BASE}/network/overview`, {}, 'OBSERVED', 6000);
  },

  async getNetworkStates(): Promise<NetworkState[]> {
    return fetchCached<NetworkState[]>('network_states', `${API_BASE}/network/states`, {}, 'OBSERVED', 6000);
  },

  // Geocoding
  async searchLocation(query: string) {
    const res = await fetchWithTimeout(`${API_BASE}/geocoding/search?q=${encodeURIComponent(query)}`, {}, 5000);
    if (!res.ok) return [];
    return res.json();
  },

  async reverseGeocode(lat: number, lon: number) {
    const res = await fetchWithTimeout(`${API_BASE}/geocoding/reverse?lat=${lat}&lon=${lon}`, {}, 5000);
    if (!res.ok) return null;
    return res.json();
  },

  // Alerts
  // STRICT RULE: evaluate defaults to false so retrieval NEVER generates alerts!
  async getAlerts(params?: { field_id?: number; unread_only?: boolean; evaluate?: boolean }): Promise<FarmerAlert[]> {
    const evaluate = params?.evaluate ?? false;
    const query = new URLSearchParams();
    if (params?.field_id !== undefined) query.set('field_id', params.field_id.toString());
    if (params?.unread_only !== undefined) query.set('unread_only', params.unread_only.toString());
    query.set('evaluate', evaluate.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    
    const cacheKey = `alerts_${params?.field_id ?? 'all'}_${params?.unread_only ?? 'all'}`;
    return fetchCached<FarmerAlert[]>(cacheKey, `${API_BASE}/alerts${qs}`, {}, 'OBSERVED', 6000);
  },

  async getFieldAlerts(fieldId: number, evaluate = false): Promise<FarmerAlert[]> {
    const cacheKey = `field_alerts_${fieldId}`;
    return fetchCached<FarmerAlert[]>(cacheKey, `${API_BASE}/fields/${fieldId}/alerts?evaluate=${evaluate}`, {}, 'OBSERVED', 6000);
  },

  async getAlertCount(): Promise<AlertCount> {
    return fetchCached<AlertCount>('alerts_count', `${API_BASE}/alerts/count`, {}, 'OBSERVED', 4000)
      .catch(() => ({ total: 0, unread: 0 }));
  },

  async markAlertRead(alertId: number): Promise<FarmerAlert> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/${alertId}/read`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to mark alert as read');
    offlineCache.remove('alerts_all_all');
    offlineCache.remove('alerts_all_true');
    offlineCache.remove('alerts_all_false');
    offlineCache.remove('alerts_count');
    return res.json();
  },

  async markAllAlertsRead(fieldId?: number): Promise<{ success: boolean; marked_count: number }> {
    const qs = fieldId !== undefined ? `?field_id=${fieldId}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/alerts/mark-all-read${qs}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to mark all alerts as read');
    offlineCache.remove('alerts_all_all');
    offlineCache.remove('alerts_all_true');
    offlineCache.remove('alerts_all_false');
    offlineCache.remove('alerts_count');
    if (fieldId) {
      offlineCache.remove(`field_alerts_${fieldId}`);
    }
    return res.json();
  }
};

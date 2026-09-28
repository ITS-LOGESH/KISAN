// Kisan Client-Side Offline Cache & Provenance Manager

const CACHE_PREFIX = 'kisan_cache_';
const memoryStore = new Map<string, string>();

export interface CachedEnvelope<T> {
  data: T;
  cachedAt: number; // epoch ms
  provenance?: 'MEASURED' | 'OBSERVED' | 'MODELED' | 'PREDICTION' | 'HISTORICAL' | 'UNKNOWN';
}

export const offlineCache = {
  get<T>(key: string): CachedEnvelope<T> | null {
    const fullKey = CACHE_PREFIX + key;
    try {
      const raw = localStorage.getItem(fullKey) || memoryStore.get(fullKey);
      if (!raw) return null;
      return JSON.parse(raw) as CachedEnvelope<T>;
    } catch (err) {
      console.warn(`[OfflineCache] Error reading ${key}:`, err);
      return null;
    }
  },

  set<T>(key: string, data: T, provenance?: CachedEnvelope<T>['provenance']): void {
    const fullKey = CACHE_PREFIX + key;
    const envelope: CachedEnvelope<T> = {
      data,
      cachedAt: Date.now(),
      provenance: provenance || 'OBSERVED'
    };
    try {
      const serialized = JSON.stringify(envelope);
      localStorage.setItem(fullKey, serialized);
      memoryStore.set(fullKey, serialized);
    } catch (err) {
      console.warn(`[OfflineCache] Error writing ${key}:`, err);
      memoryStore.set(fullKey, JSON.stringify(envelope));
    }
  },

  remove(key: string): void {
    const fullKey = CACHE_PREFIX + key;
    try {
      localStorage.removeItem(fullKey);
      memoryStore.delete(fullKey);
    } catch {}
  },

  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      memoryStore.clear();
    } catch {}
  },

  formatTime(epochMs: number | null | undefined): string {
    if (!epochMs) return '';
    try {
      const d = new Date(epochMs);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `${timeStr}`;
      }
      const dateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
      return `${dateStr}, ${timeStr}`;
    } catch {
      return '';
    }
  }
};

import type { GeoBundle } from "@/features/geo/geoApi";

const CACHE_DB_NAME = "geo-base-map-cache";
const CACHE_DB_VERSION = 1;
const CACHE_STORE_NAME = "geo-bundles";
const CACHE_KEY_VERSION = "v2";

/** 24 hours geographic boundaries change at most once per year. */
export const BASE_MAP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type GeoBundleCacheEntry = {
  key: string;
  bundle: GeoBundle;
  cachedAt: number;
};

// IndexedDB helpers
function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<GeoBundleCacheEntry | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE_NAME, "readonly");
    const req = tx.objectStore(CACHE_STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, entry: GeoBundleCacheEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE_NAME, "readwrite");
    const req = tx.objectStore(CACHE_STORE_NAME).put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Public API
/**
 * Builds a stable, deterministic cache key for a base map request.
 * Layers are sorted alphabetically so the same set always produces the same key.
 *
 * Example key:
 *   "geo-base-map:v1:year=2026:layers=cantons,country,districts,lakes:clearOthers=false"
 *
 * Bump CACHE_KEY_VERSION (e.g. "v2") to invalidate all existing entries
 * if the GeoBundle structure changes in a future release.
 */
export function buildGeoCacheKey(year: number, layers: string[], clearOthers: boolean): string {
  const sortedLayers = [...layers].sort().join(",");
  return `geo-base-map:${CACHE_KEY_VERSION}:year=${year}:layers=${sortedLayers}:clearOthers=${clearOthers}`;
}

/**
 * Reads a cached GeoBundle from IndexedDB.
 * Returns null when the entry is absent, IndexedDB is unavailable, or any error occurs.
 * The bundle is stored as a structured-clone object, no JSON parsing on read.
 */
export async function getCachedGeoBundle(
  key: string
): Promise<{ bundle: GeoBundle; cachedAt: number } | null> {
  try {
    const db = await openCacheDB();
    const entry = await idbGet(db, key);
    db.close();
    if (!entry) return null;
    return { bundle: entry.bundle, cachedAt: entry.cachedAt };
  } catch {
    return null;
  }
}

/**
 * Writes a GeoBundle to IndexedDB.
 * Silently ignores any error, cache writes are best-effort and must not block rendering.
 * The bundle is stored as a structured-clone object, no JSON.stringify needed.
 */
export async function setCachedGeoBundle(key: string, bundle: GeoBundle): Promise<void> {
  try {
    const db = await openCacheDB();
    await idbPut(db, { key, bundle, cachedAt: Date.now() });
    db.close();
  } catch {
    // Non-critical: the bundle is already rendered regardless of write outcome.
  }
}

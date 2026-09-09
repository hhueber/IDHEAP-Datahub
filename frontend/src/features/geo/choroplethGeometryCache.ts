import { ChoroplethGranularity, ChoroplethGeometriesResponse } from "./geoApi";

/**
 * LRU budget-based cache for choropleth geometry responses.
 *
 * Weight per granularity (commune data is much heavier):
 *   commune=5, district=2, canton=1, federal=1
 * Maximum total budget: 12 (allows ~2 commune sets or many lighter ones).
 */

const GRANULARITY_WEIGHT: Record<ChoroplethGranularity, number> = {
  commune: 5,
  district: 2,
  canton: 1,
  federal: 1,
};

const MAX_BUDGET = 12;

type CacheKey = `${number}:${ChoroplethGranularity}`;

type CacheEntry = {
  key: CacheKey;
  data: ChoroplethGeometriesResponse;
  weight: number;
};

const _order: CacheKey[] = [];
const _store = new Map<CacheKey, CacheEntry>();

function _makeKey(year: number, granularity: ChoroplethGranularity): CacheKey {
  return `${year}:${granularity}`;
}

function _currentBudget(): number {
  let total = 0;
  for (const entry of _store.values()) total += entry.weight;
  return total;
}

function _evictToFit(needed: number): void {
  while (_order.length > 0 && _currentBudget() + needed > MAX_BUDGET) {
    const lruKey = _order.shift()!;
    _store.delete(lruKey);
  }
}

export const choroplethGeometryCache = {
  has(year: number, granularity: ChoroplethGranularity): boolean {
    return _store.has(_makeKey(year, granularity));
  },

  get(year: number, granularity: ChoroplethGranularity): ChoroplethGeometriesResponse | undefined {
    const key = _makeKey(year, granularity);
    const entry = _store.get(key);
    if (!entry) return undefined;
    // Move to end (most recently used)
    const idx = _order.indexOf(key);
    if (idx !== -1) _order.splice(idx, 1);
    _order.push(key);
    return entry.data;
  },

  set(year: number, granularity: ChoroplethGranularity, data: ChoroplethGeometriesResponse): void {
    const key = _makeKey(year, granularity);
    const weight = GRANULARITY_WEIGHT[granularity];

    // Remove existing entry for this key if present
    if (_store.has(key)) {
      const idx = _order.indexOf(key);
      if (idx !== -1) _order.splice(idx, 1);
      _store.delete(key);
    }

    _evictToFit(weight);
    _store.set(key, { key, data, weight });
    _order.push(key);
  },
};

import { apiFetch } from "@/shared/apiFetch";

export type Position = [number, number];

export type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] }
  | { type: "MultiLineString"; coordinates: Position[][] }
  | { type: "LineString"; coordinates: Position[] }
  | { type: "Point"; coordinates: Position }
  | { type: "MultiPoint"; coordinates: Position[] };

export type Feature<P = Record<string, any>> = {
  type: "Feature";
  geometry: Geometry;
  properties: P;
};

export type FeatureCollection<P = Record<string, any>> = {
  type: "FeatureCollection";
  features: Feature<P>[];
};

export type YearMeta = {
  requested: number;
  country?: number | null;
  lakes?: number | null;
  cantons?: number | null;
  districts?: number | null;
};

export type GeoBundle = {
  year: YearMeta;
  country?: FeatureCollection<{ uid: number }>;
  lakes?: FeatureCollection<{ uid: number; name: string; code: string }>;
  cantons?: FeatureCollection<{ uid: number; code: string; name: string }>;
  districts?: FeatureCollection<{ uid: number; name: string; code?: string }>;
};

export const geoApi = {
  // année courante par défaut (si non fournie)
  getByYear: (year?: number, signal?: AbortSignal) =>
    apiFetch<GeoBundle>("geo/by_year", {
      method: "GET",
      signal,
      query: typeof year === "number" ? { year } : undefined,
    }),
};
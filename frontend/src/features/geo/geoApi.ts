// Types utilitaires pour manipuler des données GeoJSON + appel API geo/by_year
import { apiFetch } from "@/shared/apiFetch";

// Coordonnée [longitude, latitude]
export type Position = [number, number];

// Géométrie GeoJSON (types courants)
export type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] }
  | { type: "MultiLineString"; coordinates: Position[][] }
  | { type: "LineString"; coordinates: Position[] }
  | { type: "Point"; coordinates: Position }
  | { type: "MultiPoint"; coordinates: Position[] };

// Entité GeoJSON générique (avec propriétés typées)
export type Feature<P = Record<string, any>> = {
  type: "Feature";
  geometry: Geometry;
  properties: P;
};

// Collection GeoJSON
export type FeatureCollection<P = Record<string, any>> = {
  type: "FeatureCollection";
  features: Feature<P>[];
};

// Métadonnées de l’année demandée (compteurs par couche)
export type YearMeta = {
  requested: number;
  country?: number | null;
  lakes?: number | null;
  cantons?: number | null;
  districts?: number | null;
};

// Regroupe toutes les couches géo pour une année
export type GeoBundle = {
  year: YearMeta;
  country?: FeatureCollection<{ uid: number }>;
  lakes?: FeatureCollection<{ uid: number; name: string; code: string }>;
  cantons?: FeatureCollection<{ uid: number; code: string; name: string }>;
  districts?: FeatureCollection<{ uid: number; name: string; code?: string }>;
};

type GeoLayer = "country" | "lakes" | "cantons" | "districts" | "communes";

// Client API : récupère les couches géo pour une année donnée
// Donne le choix des GeoLayer souhaiter
export const geoApi = {
  // Si `year` est omise, le backend peut renvoyer l’année par défaut (courante)
  getByYear: (year?: number, signal?: AbortSignal, opts?: { layers?: GeoLayer[]; clearOthers?: boolean }) =>
    apiFetch<GeoBundle>("geo/by_year", {
      method: "GET",
      signal,
      query: {
        ...(typeof year === "number" ? { year } : {}),
        ...(opts?.layers?.length ? { layers: opts.layers.join(",") } : {}),
        ...(typeof opts?.clearOthers === "boolean"
          ? { clear_others: String(opts.clearOthers) }
          : {}),
      },
    }),
  getChoropleth: (params: { scope: "per_survey" | "global"; question_uid: number; year: number; }, signal?: AbortSignal) =>
    apiFetch<ChoroplethResponse>("geo/choropleth", {
      method: "GET",
      signal,
      query: {
        scope: params.scope,
        question_uid: params.question_uid,
        year: params.year,
      },
    }),
};

export type PlaceOfInterestMapDTO = {
  code: string;
  name: string;
  pos: [number, number];
};

// Client API pour récupérer la liste des villes affichées sur la carte.
export const PlaceOfInterestApi = {
  list: (lang: string, signal?: AbortSignal) =>
    apiFetch<PlaceOfInterestMapDTO[]>("geo/placeOfInterest", {
      method: "GET",
      signal,
      query: { lang },
    }),
};

export type LegendItem = {
  label: string;
  color: string;
  value?: any | null;   // categorical
  min?: number | null;  // gradient
  max?: number | null;  // gradient
};

export type GradientMeta = {
  mode: "continuous";
  start: string;
  end: string;
  vmin: number;
  vmax: number;
  ticks: number[];
};

export type MapLegend = {
  type: "categorical" | "gradient";
  title: string;
  items: LegendItem[];
  gradient?: GradientMeta | null;
};

export type ChoroplethResponse = {
  question_uid: number;
  year_requested: number;
  year_geo_communes?: number | null;
  legend: MapLegend;
  feature_collection: FeatureCollection<{
    commune_uid: number;
    name?: string;
    code?: string;
    value: string | null;
  }>;
};

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

export type ThemeMapPreviewYear = {
  requested: number;
  country?: number | null;
  lakes?: number | null;
  cantons?: number | null;
  districts?: number | null;
  communes?: number | null;
};

export type ThemeMapPreviewBundle = {
  year: ThemeMapPreviewYear;
  country?: FeatureCollection<{ uid: number }>;
  lakes?: FeatureCollection<{ uid: number; name: string; code: string }>;
  cantons?: FeatureCollection<{ uid: number; code: string; name: string }>;
  districts?: FeatureCollection<{ uid: number; name: string; code?: string }>;
  communes?: FeatureCollection<{ uid: number; name: string; code?: string }>;
};

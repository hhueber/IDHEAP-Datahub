import { useEffect, useMemo, useState } from "react";
import {
  geoApi,
  ChoroplethGranularity,
  ChoroplethGeometriesResponse,
  ChoroplethValuesResponse,
  ChoroplethResponse,
} from "@/features/geo/geoApi";
import { choroplethGeometryCache } from "@/features/geo/choroplethGeometryCache";
import { useTranslation } from "react-i18next";
import { normalizeGeoLanguage } from "@/features/geo/geoLanguage";

type Params = {
  scope: "per_survey" | "global";
  question_uid: number | null;
  year: number | null;
  bins?: number;
  granularity?: ChoroplethGranularity;
};

const NO_DATA_COLOR = "#cccccc";

function mergeChoroplethGeometriesAndValues(
  geometries: ChoroplethGeometriesResponse,
  values: ChoroplethValuesResponse
): ChoroplethResponse {
  // No values at all → preserve old behavior: empty feature collection
  if (Object.keys(values.values).length === 0) {
    return {
      question_uid: values.question_uid,
      year_requested: values.year_requested,
      year_geo_districts: geometries.year_geo_districts ?? null,
      year_geo_cantons: geometries.year_geo_cantons ?? null,
      granularity: values.granularity,
      legend: values.legend,
      feature_collection: { type: "FeatureCollection", features: [] },
    };
  }

  const features = geometries.feature_collection.features.map((f) => {
    const uid = String(f.properties.unit_uid);
    const entry = values.values[uid];

    if (entry) {
      return {
        ...f,
        properties: {
          level: f.properties.level,
          unit_uid: f.properties.unit_uid,
          name: f.properties.name,
          code: f.properties.code,
          geo_year_used: f.properties.geo_year_used,
          value: entry.value ?? null,
          value_kind: entry.value_kind,
          fill_color: entry.fill_color,
          fill_pattern: entry.fill_pattern ?? undefined,
          special_dominant: entry.special_dominant,
          top_real_count: entry.top_real_count,
          cnt_null: entry.cnt_null,
          cnt_empty: entry.cnt_empty,
        },
      };
    }

    // Unit has geometry but no answer data
    return {
      ...f,
      properties: {
        level: f.properties.level,
        unit_uid: f.properties.unit_uid,
        name: f.properties.name,
        code: f.properties.code,
        geo_year_used: f.properties.geo_year_used,
        value: null,
        value_kind: "no_data" as const,
        fill_color: NO_DATA_COLOR,
        fill_pattern: undefined,
        special_dominant: false,
        top_real_count: 0,
        cnt_null: 0,
        cnt_empty: 0,
      },
    };
  });

  return {
    question_uid: values.question_uid,
    year_requested: values.year_requested,
    year_geo_districts: geometries.year_geo_districts ?? null,
    year_geo_cantons: geometries.year_geo_cantons ?? null,
    granularity: values.granularity,
    legend: values.legend,
    feature_collection: {
      type: "FeatureCollection",
      features,
    },
  };
}

export function useChoropleth(params: Params) {
  const { i18n } = useTranslation();
  const [data, setData] = useState<ChoroplethResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const lang = normalizeGeoLanguage(
    i18n.resolvedLanguage ?? i18n.language
  );

  const enabled = useMemo(
    () => typeof params.question_uid === "number" && typeof params.year === "number",
    [params.question_uid, params.year]
  );

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setErrorKey(null);
      return;
    }

    const ctrl = new AbortController();
    let alive = true;

    const year = params.year as number;
    const granularity = params.granularity ?? "commune";

    setLoading(true);
    setErrorKey(null);

    const cachedGeo = choroplethGeometryCache.get(year, granularity);

    const fetchPromise = cachedGeo
      ? // Cache hit: fetch only values
        geoApi
          .getChoroplethValues(
            { scope: params.scope, question_uid: params.question_uid as number, year, granularity, lang },
            ctrl.signal
          )
          .then((values) => mergeChoroplethGeometriesAndValues(cachedGeo, values))
      : // Cache miss: fetch geometry + values in parallel
        Promise.all([
          geoApi.getChoroplethGeometries({ year, granularity }, ctrl.signal),
          geoApi.getChoroplethValues(
            { scope: params.scope, question_uid: params.question_uid as number, year, granularity, lang },
            ctrl.signal
          ),
        ]).then(([geo, values]) => {
          choroplethGeometryCache.set(year, granularity, geo);
          return mergeChoroplethGeometriesAndValues(geo, values);
        });

    fetchPromise
      .then((merged) => {
        if (!alive) return;
        setData(merged);
      })
      .catch((e: any) => {
        if (!alive) return;
        const name = e?.name || "";
        const msg = (e?.message || "").toLowerCase();
        if (name === "AbortError" || msg.includes("aborted") || msg.includes("canceled")) return;
        setErrorKey("map.errors.loadGeometry");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [enabled, params.question_uid, params.year, params.bins, params.granularity, params.scope, lang]);

  return { data, loading, errorKey };
}

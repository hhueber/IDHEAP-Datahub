import { useEffect, useMemo, useState } from "react";
import { geoApi, ChoroplethResponse } from "@/features/geo/geoApi";

type Params = {
  scope: "per_survey" | "global";
  question_uid: number | null;
  year: number | null;
  bins?: number;
};

export function useChoropleth(params: Params) {
  const [data, setData] = useState<ChoroplethResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

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

    setLoading(true);
    setErrorKey(null);

    geoApi.getChoropleth({
        scope: params.scope,
        question_uid: params.question_uid as number,
        year: params.year as number,
       
        }, ctrl.signal)
      .then((res) => {
        if (!alive) return;        
        setData(res);
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
  }, [enabled, params.question_uid, params.year, params.bins]);

  return { data, loading, errorKey };
}

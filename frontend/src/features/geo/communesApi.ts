import { apiFetch } from "@/shared/apiFetch";
import { normalizeGeoLanguage } from "@/features/geo/geoLanguage";

export type PlaceOfInterestSuggestType = "commune" | "district" | "canton";

export type PlaceOfInterestSuggestDTO = {
  uid: number;
  type: PlaceOfInterestSuggestType;
  code: string;
  name?: string | null;
  default_name: string;
  names?: {
    fr?: string | null;
    de?: string | null;
    it?: string | null;
    en?: string | null;
    ro?: string | null;
  };
  pos: [number, number]; // [lat, lon]
};

export type PlaceOfInterestSuggestResponse = {
  success: boolean;
  detail: string;
  data: PlaceOfInterestSuggestDTO[];
};

export const communesApi = {
  suggest: (q: string, lang: string, signal?: AbortSignal, limit = 50) =>
    apiFetch<PlaceOfInterestSuggestResponse>("geoSearch/suggest/public", {
      method: "GET",
      signal,
      query: { q, lang: normalizeGeoLanguage(lang), limit },
    }),
};
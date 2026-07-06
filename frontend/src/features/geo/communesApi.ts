import { apiFetch } from "@/shared/apiFetch";

export type PlaceOfInterestSuggestType = "commune" | "district" | "canton";

export type PlaceOfInterestSuggestDTO = {
  uid: number;
  type: PlaceOfInterestSuggestType;
  code: string;
  default_name: string;
  pos: [number, number]; // [lat, lon]
};

export type PlaceOfInterestSuggestResponse = {
  success: boolean;
  detail: string;
  data: PlaceOfInterestSuggestDTO[];
};

export const communesApi = {
  suggest: (q: string, signal?: AbortSignal, limit = 50) =>
    apiFetch<PlaceOfInterestSuggestResponse>("geoSearch/suggest/public", {
      method: "GET",
      signal,
      query: { q, limit },
    }),
};
import { apiFetch } from "@/shared/apiFetch";

export type PlaceOfInterestSuggestDTO = {
  default_name: string;
  pos: [number, number]; // [lat, lon]
};

export type PlaceOfInterestSuggestResponse = {
  success: boolean;
  detail: string;
  data: PlaceOfInterestSuggestDTO[];
};

export const communesApi = {
  suggest: (q: string, signal?: AbortSignal, limit = 10) =>
    apiFetch<PlaceOfInterestSuggestResponse>("communes/suggest/public", {
      method: "GET",
      signal,
      query: { q, limit },
    }),
};
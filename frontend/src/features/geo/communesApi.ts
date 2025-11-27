import { apiFetch } from "@/shared/apiFetch";

export type CitySuggestDTO = {
  default_name: string;
  pos: [number, number]; // [lat, lon]
};

export type CitySuggestResponse = {
  success: boolean;
  detail: string;
  data: CitySuggestDTO[];
};

export const communesApi = {
  suggest: (q: string, signal?: AbortSignal, limit = 10) =>
    apiFetch<CitySuggestResponse>("communes/suggest/public", {
      method: "GET",
      signal,
      query: { q, limit },
    }),
};
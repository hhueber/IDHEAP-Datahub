import { apiFetch } from "@/shared/apiFetch";

export type GeoSuggestionType = "commune" | "district" | "canton";

export type GeoSuggestion = {
  uid: number;
  type: GeoSuggestionType;
  code: string;
  name: string;
  name_fr?: string;
  name_de?: string;
  name_it?: string;
  name_ro?: string;
  name_en?: string;
};

export async function suggestGeo(q: string, limit = 20) {
  return apiFetch<{
    success: boolean;
    detail: string;
    data: GeoSuggestion[];
  }>(
    `/geoSearch/suggest/geo?q=${encodeURIComponent(q)}&limit=${limit}`,
    { method: "GET", auth: true }
  );
}

export async function getGeoPoint(type: GeoSuggestionType, uid: number) {
  return apiFetch<{
    success: boolean;
    detail: string;
    data?: { lat: number; lon: number };
  }>(
    `/geoSearch/${type}/${uid}/point`,
    { method: "GET", auth: true }
  );

}

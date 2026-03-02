import { apiFetch } from "@/shared/apiFetch";

export type CommuneSuggestion = {
  uid: number;
  code: string;
  name: string;
  name_fr?: string; name_de?: string; name_it?: string; name_ro?: string; name_en?: string;
};

export async function suggestCommunes(q: string, limit = 10) {
  return apiFetch<{ success: boolean; detail: string; data: CommuneSuggestion[] }>(
    `/communes/suggest?q=${encodeURIComponent(q)}&limit=${limit}`,
    { method: "GET", auth: true }
  );
}

export async function getCommunePoint(uid: number) {
  return apiFetch<{ success: boolean; detail: string; data?: { lat: number; lon: number } }>(
    `/communes/${uid}/point`,
    { method: "GET", auth: true }
  );
}

import { apiFetch } from "@/shared/apiFetch";

export type ListResponse<T> = { success: boolean; detail: string; data: T[] };
export type OneResponse<T>  = { success: boolean; detail: string; data: T };
export type MutResponse     = { success: boolean; detail: string };

export function makeConfigService<T>(base: string) {
  return {
    list:   () => apiFetch<ListResponse<T>>(base, { method: "GET", auth: true }),
    get:    (code: string) => apiFetch<OneResponse<T>>(`${base}/${encodeURIComponent(code)}`, { method: "GET", auth: true }),
    upsert: (body: T) => apiFetch<MutResponse>(base, { method: "POST", auth: true, body }),
    remove: (code: string) => apiFetch<MutResponse>(`${base}/${encodeURIComponent(code)}`, { method: "DELETE", auth: true }),
  };
}

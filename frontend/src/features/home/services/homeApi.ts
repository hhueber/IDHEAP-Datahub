import { apiFetch } from "@/lib/apiFetch";

export type SurveyLite = { uid: number; year: number };
export type QuestionMeta = { uid: number; code: string; label: string };

export type HomeBootstrap = {
  message: string;
  surveys: SurveyLite[];
  stats?: { surveys: number };
  globals: { items: QuestionMeta[]; count?: number };
};

export const homeApi = {
  getBootstrap: (signal?: AbortSignal, lang?: string) =>
    apiFetch<HomeBootstrap>("home/bootstrap", {
      method: "GET",
      signal,
      headers: {
        "Accept-Language": lang ?? "en", // forcer le header
      },
    }),
};
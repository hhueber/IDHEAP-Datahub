import { apiFetch } from "@/shared/apiFetch";

export type SurveyBrief = { uid: number; year: number };

export type QuestionItem = {
  uid: number;
  label: string; // libellé canonique
  text: string;  // texte localisé (ou label si le texte est absent côté serveur)
};

export type QuestionList = {
  items: QuestionItem[];
  count?: number;
};

export type ThemeConfig = Record<string, string>;

export type HomeBootstrap = {
  message: string;
  surveys: SurveyBrief[];
  stats?: { surveys: number };
  globals: QuestionList;
  themeConfig?: ThemeConfig;
};

export const homeApi = {
  getBootstrap: (signal?: AbortSignal, lang?: string) =>
    apiFetch<HomeBootstrap>("home/bootstrap", {
      method: "GET",
      signal,
      headers: {
        "Accept-Language": lang ?? "en",
      },
    }),
};

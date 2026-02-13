import { apiFetch } from "@/shared/apiFetch";
import type { QuestionItem } from "@/features/home/services/homeApi";

export const questionsApi = {
  getBySurvey: (surveyUid: number, signal?: AbortSignal, lang?: string) =>
    apiFetch<{ survey: { uid: number }; items: QuestionItem[] }>("questions", {
      method: "GET",
      signal,
      query: { scope: "per_survey", survey_uid: surveyUid },
      headers: { "Accept-Language": lang ?? "en" }, // on passe la langue
    }),

  getAvailableYears: (questionUid: number, scope: "per_survey" | "global", signal?: AbortSignal) =>
    apiFetch<number[]>(`questions/${questionUid}/years`, {
      method: "GET",
      signal,
      query: { scope },
    }),
};

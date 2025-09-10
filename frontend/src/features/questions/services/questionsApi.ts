import { apiFetch } from "@/lib/apiFetch";
import type { QuestionMeta } from "@/features/home/services/homeApi";

export const questionsApi = {
  getBySurvey: (
    surveyUid: number,
    signal?: AbortSignal,
    lang?: string
  ) =>
    apiFetch<{ survey: { uid: number }; items: QuestionMeta[] }>("questions", {
      method: "GET",
      signal,
      query: { scope: "per_survey", survey_uid: surveyUid },
      acceptLanguage: lang, // forcer le header
    }),
};
import { apiFetch } from "@/shared/apiFetch";

export const statsApi = {
  getComparison: (params: {
    scope: "per_survey" | "global";
    question_uid: number;
    year: number;
    area_uid: number;
    level: "commune" | "district" | "canton";
  }) =>
    apiFetch("geo/comparison", {
      method: "GET",
      query: params,
    }),
};
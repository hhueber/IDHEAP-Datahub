import { apiFetch } from "@/shared/apiFetch";

export type ExportQuestionPayload = {
  uid: number;
  scope: "global" | "per_survey";
  survey_uid: number | null;
};

export async function exportCsv(
  questions: ExportQuestionPayload[],
  lang: string
): Promise<Blob> {
  return apiFetch<Blob>("export/csv", {
    method: "POST",
    body: { questions },
    headers: {
      "Accept-Language": lang,
    },
    responseType: "blob",
  });
}

export type QuestionCollectionKind = "saved";

export type QuestionOriginScope = "global" | "per_survey";

export type StoredQuestionItem = {
  uid: number;
  label: string;
  text: string;
  primary: string;
  scope: QuestionOriginScope;
  surveyUid: number | null;

  year?: number;      // per_survey
};

export type QuestionCollectionsState = {
  saved: StoredQuestionItem[];
};

export type DragQuestionPayload = {
  uid: number;
  label: string;
  text: string;
  primary: string;
  scope: QuestionOriginScope;
  surveyUid: number | null;
};

export function buildStoredQuestionKey(item: {
  uid: number;
  scope: QuestionOriginScope;
  surveyUid: number | null;
}): string {
  return `${item.scope}:${item.surveyUid ?? "none"}:${item.uid}`;
}

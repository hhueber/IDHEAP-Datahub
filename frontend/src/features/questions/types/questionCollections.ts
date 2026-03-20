export type QuestionCollectionKind = "favorites" | "saved";

export type QuestionOriginScope = "global" | "per_survey";

export type StoredQuestionItem = {
  uid: number;
  label: string;
  text: string;
  primary: string;
  scope: QuestionOriginScope;
  surveyUid: number | null;
};

export type QuestionCollectionsState = {
  favorites: StoredQuestionItem[];
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

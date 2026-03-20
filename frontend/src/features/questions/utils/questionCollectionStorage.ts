import type {
  QuestionCollectionKind,
  QuestionCollectionsState,
  StoredQuestionItem,
} from "@/features/questions/types/questionCollections";
import { buildStoredQuestionKey } from "@/features/questions/types/questionCollections";

const FAVORITES_KEY = "question_favorites_v1";
const SAVED_KEY = "question_saved_v1";

const DEFAULT_STATE: QuestionCollectionsState = {
  favorites: [],
  saved: [],
};

function isStoredQuestionItem(value: unknown): value is StoredQuestionItem {
  if (!value || typeof value !== "object") return false;

  const v = value as StoredQuestionItem;

  return (
    typeof v.uid === "number" &&
    typeof v.label === "string" &&
    typeof v.text === "string" &&
    typeof v.primary === "string" &&
    (v.scope === "global" || v.scope === "per_survey") &&
    (typeof v.surveyUid === "number" || v.surveyUid === null)
  );
}

function sanitizeState(raw: unknown): QuestionCollectionsState {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_STATE;
  }

  const maybe = raw as Partial<QuestionCollectionsState>;

  const favorites = Array.isArray(maybe.favorites)
    ? maybe.favorites.filter(isStoredQuestionItem)
    : [];

  const saved = Array.isArray(maybe.saved)
    ? maybe.saved.filter(isStoredQuestionItem)
    : [];

  return {
    favorites: dedupeItems(favorites),
    saved: dedupeItems(saved),
  };
}

function dedupeItems(items: StoredQuestionItem[]): StoredQuestionItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = buildStoredQuestionKey(item);

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function loadQuestionCollections(): QuestionCollectionsState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const favRaw = localStorage.getItem(FAVORITES_KEY);
    const savedRaw = localStorage.getItem(SAVED_KEY);

    return sanitizeState({
      favorites: favRaw ? JSON.parse(favRaw) : [],
      saved: savedRaw ? JSON.parse(savedRaw) : [],
    });
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveQuestionCollections(state: QuestionCollectionsState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
    localStorage.setItem(SAVED_KEY, JSON.stringify(state.saved));
  } catch {}
}

export function addQuestionToCollection(
  state: QuestionCollectionsState,
  kind: QuestionCollectionKind,
  item: StoredQuestionItem
): QuestionCollectionsState {
  const current = state[kind];
  const itemKey = buildStoredQuestionKey(item);

  const alreadyExists = current.some(
    (existing) => buildStoredQuestionKey(existing) === itemKey
  );

  if (alreadyExists) {
    return state;
  }

  return {
    ...state,
    [kind]: [item, ...current],
  };
}

export function removeQuestionFromCollection(
  state: QuestionCollectionsState,
  kind: QuestionCollectionKind,
  item: Pick<StoredQuestionItem, "uid" | "scope" | "surveyUid">
): QuestionCollectionsState {
  const itemKey = buildStoredQuestionKey(item);

  return {
    ...state,
    [kind]: state[kind].filter(
      (existing) => buildStoredQuestionKey(existing) !== itemKey
    ),
  };
}

export function isQuestionInCollection(
  state: QuestionCollectionsState,
  kind: QuestionCollectionKind,
  item: Pick<StoredQuestionItem, "uid" | "scope" | "surveyUid">
): boolean {
  const itemKey = buildStoredQuestionKey(item);

  return state[kind].some(
    (existing) => buildStoredQuestionKey(existing) === itemKey
  );
}

export function clearQuestionCollection(
  state: QuestionCollectionsState,
  kind: QuestionCollectionKind
): QuestionCollectionsState {
  return {
    ...state,
    [kind]: [],
  };
}

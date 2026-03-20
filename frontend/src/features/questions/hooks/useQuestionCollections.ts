import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  QuestionCollectionKind,
  QuestionCollectionsState,
  StoredQuestionItem,
} from "@/features/questions/types/questionCollections";
import {
  addQuestionToCollection,
  clearQuestionCollection,
  isQuestionInCollection,
  loadQuestionCollections,
  removeQuestionFromCollection,
  saveQuestionCollections,
} from "@/features/questions/utils/questionCollectionStorage";

export function useQuestionCollections() {
  const [state, setState] = useState<QuestionCollectionsState>(() => loadQuestionCollections());

  useEffect(() => {
    saveQuestionCollections(state);
  }, [state]);

  const addToCollection = useCallback(
    (kind: QuestionCollectionKind, item: StoredQuestionItem) => {
      setState((prev) => addQuestionToCollection(prev, kind, item));
    },
    []
  );

  const removeFromCollection = useCallback(
    (
      kind: QuestionCollectionKind,
      item: Pick<StoredQuestionItem, "uid" | "scope" | "surveyUid">
    ) => {
      setState((prev) => removeQuestionFromCollection(prev, kind, item));
    },
    []
  );

  const clearCollection = useCallback((kind: QuestionCollectionKind) => {
    setState((prev) => clearQuestionCollection(prev, kind));
  }, []);

  const helpers = useMemo(
    () => ({
      isFavorite: (item: Pick<StoredQuestionItem, "uid" | "scope" | "surveyUid">) =>
        isQuestionInCollection(state, "favorites", item),
      isSaved: (item: Pick<StoredQuestionItem, "uid" | "scope" | "surveyUid">) =>
        isQuestionInCollection(state, "saved", item),
    }),
    [state]
  );

  return {
    favorites: state.favorites,
    saved: state.saved,
    addToCollection,
    removeFromCollection,
    clearCollection,
    ...helpers,
  };
}

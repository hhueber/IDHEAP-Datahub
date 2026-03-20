import QuestionDropZone from "@/features/questions/components/QuestionDropZone";
import type {
  QuestionCollectionKind,
  StoredQuestionItem,
} from "@/features/questions/types/questionCollections";
import { useTranslation } from "react-i18next";

type Props = {
  favorites: StoredQuestionItem[];
  saved: StoredQuestionItem[];
  onDropQuestion: (kind: QuestionCollectionKind, item: StoredQuestionItem) => void;
  onRemoveQuestion: (kind: QuestionCollectionKind, item: StoredQuestionItem) => void;
  onSelectQuestion: (uid: number) => void;
  selectedQuestionUid: number | null;
};

export default function QuestionCollectionsPanel({
  favorites,
  saved,
  onDropQuestion,
  onRemoveQuestion,
  onSelectQuestion,
  selectedQuestionUid,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {/* FAVORITES */}
      <QuestionDropZone
        kind="favorites"
        title={t("home.question_collections.favorites.title")}
        description={t("home.question_collections.favorites.description")}
        items={favorites}
        onDropQuestion={onDropQuestion}
        onRemoveQuestion={onRemoveQuestion}
        onSelectQuestion={onSelectQuestion}
        selectedQuestionUid={selectedQuestionUid}
      />

      {/* SAVED */}
      <QuestionDropZone
        kind="saved"
        title={t("home.question_collections.saved.title")}
        description={t("home.question_collections.saved.description")}
        items={saved}
        onDropQuestion={onDropQuestion}
        onRemoveQuestion={onRemoveQuestion}
        onSelectQuestion={onSelectQuestion}
        selectedQuestionUid={selectedQuestionUid}
      />
    </div>
  );
}

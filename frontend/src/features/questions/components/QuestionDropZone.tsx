import type React from "react";
import { useMemo, useState } from "react";
import { useTheme } from "@/theme/useTheme";
import DraggableQuestionCard, {
  QUESTION_DRAG_MIME_TYPE,
} from "@/features/questions/components/DraggableQuestionCard";
import type {
  DragQuestionPayload,
  QuestionCollectionKind,
  StoredQuestionItem,
} from "@/features/questions/types/questionCollections";
import { useTranslation } from "react-i18next";

type Props = {
  kind: QuestionCollectionKind;
  title: string;
  description: string;
  items: StoredQuestionItem[];
  onDropQuestion: (kind: QuestionCollectionKind, item: StoredQuestionItem) => void;
  onRemoveQuestion: (kind: QuestionCollectionKind, item: StoredQuestionItem) => void;
  onSelectQuestion?: (uid: number) => void;
  selectedQuestionUid?: number | null;
};

function parseDraggedQuestion(
  e: React.DragEvent<HTMLDivElement>
): DragQuestionPayload | null {
  const raw = e.dataTransfer.getData(QUESTION_DRAG_MIME_TYPE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DragQuestionPayload;

    if (
      typeof parsed.uid !== "number" ||
      typeof parsed.label !== "string" ||
      typeof parsed.text !== "string" ||
      typeof parsed.primary !== "string" ||
      (parsed.scope !== "global" && parsed.scope !== "per_survey") ||
      (typeof parsed.surveyUid !== "number" && parsed.surveyUid !== null)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export default function QuestionDropZone({
  kind,
  title,
  description,
  items,
  onDropQuestion,
  onRemoveQuestion,
  onSelectQuestion,
  selectedQuestionUid,
}: Props) {
  const { textColor, background, borderColor, hoverPrimary04, hoverText07 } = useTheme();
  const [isOver, setIsOver] = useState<boolean>(false);
  const { t } = useTranslation();

  const empty = items.length === 0;

  const zoneStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: isOver ? hoverPrimary04 : background,
      borderColor: isOver ? hoverPrimary04 : borderColor,
      color: textColor,
    }),
    [isOver, hoverPrimary04, background, borderColor, textColor]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    const hasData = Array.from(e.dataTransfer.types).includes(QUESTION_DRAG_MIME_TYPE);
    if (!hasData) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsOver(true);
  };

  const handleDragLeave = (): void => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsOver(false);

    const parsed = parseDraggedQuestion(e);
    if (!parsed) return;

    onDropQuestion(kind, {
      uid: parsed.uid,
      label: parsed.label,
      text: parsed.text,
      primary: parsed.primary,
      scope: parsed.scope,
      surveyUid: parsed.surveyUid,
    });
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        rounded-2xl border transition-all duration-150
        h-[180px] flex flex-col
        ${isOver ? "shadow-lg scale-[1.02]" : "shadow-sm"}
      `}
      style={zoneStyle}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs mt-1" style={{ color: hoverText07 }}>
              {description}
            </p>
          </div>

          <div
            className="rounded-xl border px-2 py-1 text-[11px]"
            style={{
              borderColor,
              backgroundColor: isOver ? background : hoverPrimary04,
              color: textColor,
            }}
          >
            {items.length}
          </div>
        </div>

        <div className="mt-3 max-h-40 overflow-y-auto space-y-2 pr-1">
          {empty ? (
            <div
              className="rounded-xl border border-dashed px-3 py-4 text-sm text-center transition-all duration-150"
              style={{
                borderColor,
                backgroundColor: isOver ? background : "transparent",
                color: hoverText07,
              }}
            >
              {isOver ? t("home.question_drop_zone.release_to_add") : t("home.question_drop_zone.drag_question")}
            </div>
          ) : (
            items.map((item) => (
              <DraggableQuestionCard
                key={`${item.scope}:${item.surveyUid ?? "none"}:${item.uid}`}
                uid={item.uid}
                label={item.label}
                text={item.text}
                primary={item.primary}
                selected={selectedQuestionUid === item.uid}
                onClick={() => onSelectQuestion?.(item.uid)}
                scope={item.scope}
                surveyUid={item.surveyUid}
                compact
                removable
                onRemove={() => onRemoveQuestion(kind, item)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

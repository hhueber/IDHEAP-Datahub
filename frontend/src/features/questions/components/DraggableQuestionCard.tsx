import type React from "react";
import { useMemo, useState } from "react";
import { useTheme } from "@/theme/useTheme";
import type {
  DragQuestionPayload,
  QuestionOriginScope,
} from "@/features/questions/types/questionCollections";
import { useTranslation } from "react-i18next";

type Props = {
  uid: number;
  label: string;
  text: string;
  primary: string;
  selected: boolean;
  onClick: () => void;
  scope: QuestionOriginScope;
  surveyUid: number | null;
  isFavorite?: boolean;
  isSaved?: boolean;
  compact?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onQuickFavoriteToggle?: () => void;
  onQuickSavedToggle?: () => void;
};

const DRAG_MIME_TYPE = "application/x-question-item";

export const QUESTION_DRAG_MIME_TYPE = DRAG_MIME_TYPE;

export default function DraggableQuestionCard({
  uid,
  label,
  text,
  primary,
  selected,
  onClick,
  scope,
  surveyUid,
  isFavorite = false,
  isSaved = false,
  compact = false,
  removable = false,
  onRemove,
  onQuickFavoriteToggle,
  onQuickSavedToggle,
}: Props) {
  const {
    textColor,
    background,
    borderColor,
    hoverPrimary06,
    hoverPrimary04,
    hoverText07,
  } = useTheme();

  const { t } = useTranslation();
  const [dragging, setDragging] = useState<boolean>(false);

  const payload: DragQuestionPayload = useMemo(
    () => ({
      uid,
      label,
      text,
      primary,
      scope,
      surveyUid,
    }),
    [uid, label, text, primary, scope, surveyUid]
  );

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify(payload));
    e.dataTransfer.setData("text/plain", primary);
    setDragging(true);
  };

  const handleDragEnd = (): void => {
    setDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = hoverPrimary06;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = background;
        }
      }}
      className={`
        group w-full rounded-xl border shadow-sm
        transition-all duration-150
        hover:shadow-md hover:-translate-y-[1px]
        ${dragging ? "opacity-60 scale-[0.99]" : "opacity-100"}
        ${compact ? "p-2" : "p-3"}
      `}
      style={{
        backgroundColor: selected ? hoverPrimary06 : background,
        borderColor: selected ? hoverPrimary06 : borderColor,
        color: textColor,
        boxShadow: selected ? "0 0 0 2px rgba(0,0,0,0.06)" : undefined,
      }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>
                {primary}
              </div>

              <div
                className={`mt-1 flex flex-wrap gap-1 ${compact ? "text-[10px]" : "text-[11px]"}`}
                style={{ color: hoverText07 }}
              >
                {isFavorite && (
                  <span
                    className="rounded-full px-2 py-0.5 border"
                    style={{ borderColor, backgroundColor: hoverPrimary04 }}
                  >
                    {t("home.question_card.favorite")}
                  </span>
                )}
                {isSaved && (
                  <span
                    className="rounded-full px-2 py-0.5 border"
                    style={{ borderColor, backgroundColor: hoverPrimary04 }}
                  >
                    {t("home.question_card.saved")}
                  </span>
                )}
              </div>
            </div>

            <div
              className="shrink-0 rounded-lg px-2 py-1 border text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                borderColor,
                backgroundColor: hoverPrimary04,
                color: textColor,
              }}
              aria-hidden="true"
            >
              {t("home.question_card.drag")}
            </div>
          </div>
        </button>

        <div className="flex flex-col gap-1 shrink-0">
          {onQuickFavoriteToggle && (
            <button
              type="button"
              onClick={onQuickFavoriteToggle}
              className="rounded-lg border px-2 py-1 text-[11px] transition-all duration-150 hover:scale-105 hover:shadow-sm active:scale-95"
              style={{
                borderColor,
                backgroundColor: isFavorite ? hoverPrimary04 : background,
                color: textColor,
              }}
              title={isFavorite ? t("home.question_card.removeFavorite") : t("home.question_card.addFavorite")}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverPrimary04;
                }}
                onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isFavorite
                    ? hoverPrimary04
                    : background;
                }}
            >
              {"\u2605"}
            </button>
          )}

          {onQuickSavedToggle && (
            <button
              type="button"
              onClick={onQuickSavedToggle}
              className="rounded-lg border px-2 py-1 text-[11px] transition-all duration-150 hover:scale-105 hover:shadow-sm active:scale-95"
              style={{
                borderColor,
                backgroundColor: isSaved ? hoverPrimary04 : background,
                color: textColor,
              }}
              title={isSaved ? t("home.question_card.removeSaved") : t("home.question_card.addSaved")}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverPrimary04;
                }}
                onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSaved
                    ? hoverPrimary04
                    : background;
                }}
            >
              {"\u2398"}
            </button>
          )}

          {removable && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg border px-2 py-1 text-[11px] transition-all duration-150 hover:scale-105 hover:shadow-sm active:scale-95"
              style={{
                borderColor,
                backgroundColor: background,
                color: textColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverPrimary04;
              }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = background;
              }}
              title={t("home.question_card.remove")}
            >
              {"\u2715"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

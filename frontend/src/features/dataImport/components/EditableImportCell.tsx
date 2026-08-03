import React from "react";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "react-i18next";
import { patchDataImportCell } from "@/features/dataImport/dataImportApi";
import type { DataImportAnalyzeResponse } from "@/features/dataImport/dataImportTypes";

type EditableImportCellProps = {
  importId: string;
  rowIndex: number;
  columnIndex: number;
  value: string;
  hasIssue: boolean;
  issueMessage: string | null;
  onSaved: () => Promise<void>;
  onAnalysisUpdated: (analysis: DataImportAnalyzeResponse["data"]) => void;
};

export const EditableImportCell = React.memo(function EditableImportCell({
  importId,
  rowIndex,
  columnIndex,
  value,
  hasIssue,
  issueMessage,
  onSaved,
  onAnalysisUpdated,
}: EditableImportCellProps) {
  const { borderColor, background, textColor, hoverPrimary04, primary } = useTheme();
  const { t } = useTranslation();

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const save = async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }

    setSaving(true);

    try {
      const json = await patchDataImportCell({
        importId,
        rowIndex,
        columnIndex,
        value: draft,
      });

      if (json.success) {
        onAnalysisUpdated(json.data);
      }

      setEditing(false);
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <td
      className="max-w-72 border-r border-b p-0 align-top"
      style={{
        borderColor,
        backgroundColor: hasIssue ? "#fee2e2" : background,
        color: hasIssue ? "#991b1b" : textColor,
      }}
      title={issueMessage ?? undefined}
    >
      {editing ? (
        <div className="flex min-w-44 items-center gap-1 p-1">
          <input
            autoFocus
            value={draft}
            disabled={saving}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={(event) => {
              if (event.key === "Enter") void save();

              if (event.key === "Escape") {
                setDraft(value);
                setEditing(false);
              }
            }}
            className="min-h-9 w-full rounded-lg border bg-transparent px-2 py-1 text-sm outline-none"
            style={{
              borderColor: hasIssue ? "#ef4444" : primary,
              backgroundColor: background,
              color: textColor,
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="group/cell flex min-h-10 w-full min-w-44 items-center justify-between gap-2 px-3 py-2 text-left transition hover:opacity-90"
          style={{
            backgroundColor: hasIssue ? "#fee2e2" : "transparent",
          }}
        >
          <span className="truncate">
            {value || <span className="opacity-40">{"\u2014"}</span>} {/* Unicode pour ce symbole - */}
          </span>

          <span
            className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] opacity-0 transition-opacity group-hover/cell:opacity-70"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
          >
            {t("dataImport.edit")}
          </span>
        </button>
      )}
    </td>
  );
});

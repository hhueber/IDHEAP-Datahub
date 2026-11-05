import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import { patchDataImportDisplayName } from "@/features/dataImport/dataImportApi";

type DataImportDisplayNameEditorProps = {
  importId: string;
  filename: string;
  displayName: string | null;
  disabled?: boolean;
  onSaved: (displayName: string | null) => void;
};

export function DataImportDisplayNameEditor({
  importId,
  filename,
  displayName,
  disabled = false,
  onSaved,
}: DataImportDisplayNameEditorProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(displayName ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(displayName ?? "");
  }, [displayName]);

  const visibleName = displayName?.trim() || filename;

  const save = async () => {
    const cleanValue = draft.trim();
    const nextDisplayName = cleanValue.length > 0 ? cleanValue : null;

    if ((displayName ?? null) === nextDisplayName) {
      setEditing(false);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const json = await patchDataImportDisplayName({
        importId,
        displayName: nextDisplayName,
      });

      if (!json.success) {
        throw new Error(json.detail || t("common.error"));
      }

      onSaved(json.data.display_name);
      setEditing(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(displayName ?? "");
    setEditing(false);
    setError(null);
  };

  if (editing) {
    return (
      <div className="min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            autoFocus
            value={draft}
            disabled={disabled || saving}
            maxLength={120}
            placeholder={filename}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void save();
              if (event.key === "Escape") cancel();
            }}
            className="min-h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: primary,
              backgroundColor: background,
              color: textColor,
            }}
          />

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={disabled || saving}
              onClick={() => void save()}
              className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
              style={{ borderColor: primary, color: primary }}
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>

            <button
              type="button"
              disabled={disabled || saving}
              onClick={cancel}
              className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
              style={{ borderColor }}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>

        <div className="mt-1 text-xs opacity-60">
          {filename}
        </div>

        {error && (
          <div className="mt-2 text-xs text-red-600">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold">
            {visibleName}
          </div>

          {displayName && (
            <div className="mt-1 truncate text-xs opacity-60">
              {filename}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-40"
          style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
          {t("dataImport.displayName.edit")}
        </button>
      </div>
    </div>
  );
}

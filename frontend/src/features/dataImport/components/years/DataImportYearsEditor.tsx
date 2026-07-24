import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import { patchDataImportYears } from "@/features/dataImport/dataImportApi";
import { DataImportYearsInput } from "@/features/dataImport/components/years/DataImportYearsInput";

type DataImportYearsEditorProps = {
  importId: string;
  years: number[];
  disabled?: boolean;
  onSaved: (years: number[]) => void;
};

export function DataImportYearsEditor({
  importId,
  years,
  disabled = false,
  onSaved,
}: DataImportYearsEditorProps) {
  const { t } = useTranslation();
  const {textColor, background, borderColor, hoverPrimary04, primary} = useTheme();
  const [editing, setEditing] = React.useState(false);
  const [draftYears, setDraftYears] = React.useState<number[]>(years);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraftYears(years);
  }, [years]);

  const cancel = () => {
    setDraftYears(years);
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    if (draftYears.length === 0) {
      setError(
        t("dataImport.years.required")
      );

      return;
    }

    setSaving(true);
    setError(null);

    try {
      const json =
        await patchDataImportYears({
          importId,
          years: draftYears,
        });

      if (!json.success) {
        throw new Error(
          json.detail ||
            t("common.error")
        );
      }

      onSaved(json.data.years);
      setEditing(false);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          t("common.error")
      );
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium opacity-60">
          {t("dataImport.years.label")}
        </span>

        {years.map((year) => (
          <span
            key={year}
            className="rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{
              borderColor,
              backgroundColor:
                hoverPrimary04,
            }}
          >
            {year}
          </span>
        ))}

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            setEditing(true)
          }
          className="rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-40"
          style={{
            borderColor,
            backgroundColor: background,
            color: textColor,
          }}
        >
          {t("dataImport.years.edit")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="mt-3 rounded-2xl border p-4"
      style={{
        borderColor,
        backgroundColor:
          hoverPrimary04,
      }}
    >
      <div className="mb-3 text-sm font-semibold">
        {t("dataImport.years.editTitle")}
      </div>

      <DataImportYearsInput
        years={draftYears}
        disabled={disabled || saving}
        error={error}
        onChange={(nextYears) => {
          setDraftYears(nextYears);

          if (nextYears.length > 0) {
            setError(null);
          }
        }}
      />

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={
            disabled ||
            saving
          }
          onClick={cancel}
          className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
          style={{
            borderColor,
            backgroundColor: background,
          }}
        >
          {t("common.cancel")}
        </button>

        <button
          type="button"
          disabled={
            disabled ||
            saving ||
            draftYears.length === 0
          }
          onClick={() => void save()}
          className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-85 disabled:opacity-40"
          style={{
            borderColor: primary,
            backgroundColor: primary,
            color: "#ffffff",
          }}
        >
          {saving
            ? t("common.saving")
            : t("common.save")}
        </button>
      </div>
    </div>
  );
}

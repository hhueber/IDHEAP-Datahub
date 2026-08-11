import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import { useQuestionCollections } from "@/features/questions/hooks/useQuestionCollections";
import type { StoredQuestionItem } from "@/features/questions/types/questionCollections";
import { exportCsv } from "@/features/export/exportApi";

export default function ExportDataPage() {
  const { t, i18n } = useTranslation();
  const { background, borderColor, textColor, primary, hoverPrimary04, hoverPrimary06, hoverText07, adaptiveTextColorPrimary} = useTheme();

  const { saved } = useQuestionCollections();

  const [selected, setSelected] = useState<StoredQuestionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isSelected = (q: StoredQuestionItem) =>
    selected.some(
      (s) =>
        s.uid === q.uid &&
        s.scope === q.scope &&
        s.surveyUid === q.surveyUid
    );

  const toggle = (q: StoredQuestionItem) => {
    setSelected((prev) =>
      isSelected(q)
        ? prev.filter(
            (s) =>
              !(
                s.uid === q.uid &&
                s.scope === q.scope &&
                s.surveyUid === q.surveyUid
              )
          )
        : [...prev, q]
    );
  };

  const handleExport = async () => {
    if (selected.length === 0) return;

    setLoading(true);

    try {
      const payload = selected.map((q) => ({
        uid: q.uid,
        scope: q.scope,
        survey_uid: q.surveyUid,
      }));

      const blob = await exportCsv(payload, i18n.language);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.csv";

      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold" style={{ color: textColor }}>
          {t("export.data.title")}
        </h1>
        <p className="text-sm" style={{ color: hoverText07 }}>
          {t("export.data.description")}
        </p>
      </div>

      {/* Action bar */}
      <div
        className="flex flex-wrap gap-3 items-center justify-between rounded-xl border p-3"
        style={{ backgroundColor: background, borderColor }}
      >
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelected(saved)}
            className="px-3 py-1 rounded-lg text-sm border"
            style={{ borderColor, color: textColor }}
          >
            {t("export.data.selectAll")}
          </button>

          <button
            onClick={() => setSelected([])}
            className="px-3 py-1 rounded-lg text-sm border"
            style={{ borderColor, color: textColor }}
          >
            {t("export.data.clear")}
          </button>
        </div>

        <div className="text-sm" style={{ color: hoverText07 }}>
          {selected.length} {t("export.data.selected")}
        </div>
      </div>

      {/* Questions grid */}
      <div
        className="rounded-2xl border p-4"
        style={{ backgroundColor: background, borderColor }}
      >
        {saved.length === 0 ? (
          <div
            className="text-center py-10 rounded-xl border border-dashed"
            style={{
              borderColor,
              color: hoverText07,
            }}
          >
            {t("export.data.noSavedQuestions")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {saved.map((q) => {
              const active = isSelected(q);

              return (
                <div
                  key={`${q.scope}-${q.surveyUid}-${q.uid}`}
                  onClick={() => toggle(q)}
                  className="cursor-pointer rounded-xl border p-3 transition-all duration-150 hover:shadow-md hover:-translate-y-[1px]"
                  style={{
                    backgroundColor: active
                      ? hoverPrimary06
                      : background,
                    borderColor: active
                      ? hoverPrimary06
                      : borderColor,
                    color: textColor,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">
                        {q.primary}
                      </div>

                      <div
                        className="text-xs mt-1"
                        style={{ color: hoverText07 }}
                      >
                        {q.scope === "global"
                          ? `${t("export.data.global")}` 
                          : `${t("export.data.survey")} ${q.year ?? "..."}`
                        }
                      </div>
                    </div>

                    <div
                      className="w-5 h-5 rounded border flex items-center justify-center text-xs"
                      style={{
                        borderColor,
                        backgroundColor: active
                          ? hoverPrimary04
                          : "transparent",
                      }}
                    >
                      {active && "\u2713"} {/* Checkmark */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={selected.length === 0 || loading}
          className="px-5 py-2 rounded-xl font-medium transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{ backgroundColor: primary,
            color: adaptiveTextColorPrimary,
           }}
        >
          {loading
            ? t("export.data.loading")
            : t("export.data.download")}
        </button>
      </div>
    </div>
  );
}

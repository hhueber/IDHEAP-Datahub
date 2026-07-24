import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type { DataImportAnalyzeResponse, ImportSection } from "@/features/dataImport/dataImportTypes";

type DataImportAnalysisPanelProps = {
  analysis: DataImportAnalyzeResponse["data"];
  selectedSection: ImportSection;
  loading: boolean;
  onSectionChange: (section: ImportSection) => Promise<void>;
};

export function DataImportAnalysisPanel({
  analysis,
  selectedSection,
  loading,
  onSectionChange,
}: DataImportAnalysisPanelProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  return (
    <section
      className="rounded-3xl border p-4 sm:p-5"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {t("dataImport.analysis.title")}
          </h2>

          <p className="mt-1 text-sm opacity-70">
            {t(`dataImport.sectionDescriptions.${selectedSection}`)}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label={t("dataImport.summary.rows")} value={analysis.rows} />
        <SummaryCard label={t("dataImport.summary.columns")} value={analysis.columns} />
        <SummaryCard label={t("dataImport.summary.cells")} value={analysis.cells} />
        <SummaryCard
          label={t("dataImport.summary.issues")}
          value={analysis.total_issues}
          danger={analysis.total_issues > 0}
        />
        <SummaryCard
          label={t("dataImport.summary.survey")}
          value={
            analysis.detected_survey.name && analysis.detected_survey.year
              ? `${analysis.detected_survey.name} ${analysis.detected_survey.year}`
              : t("dataImport.summary.unknown")
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {analysis.sections.map((section) => {
          const active = selectedSection === section.key;
          const hasIssues = section.issues > 0;

          return (
            <button
              key={section.key}
              type="button"
              title={t(`dataImport.sectionDescriptions.${section.key}`)}
              disabled={loading}
              onClick={() => void onSectionChange(section.key)}
              className="rounded-2xl border p-4 text-left transition hover:-translate-y-[1px] hover:shadow-sm disabled:opacity-50"
              style={{
                borderColor: active ? primary : borderColor,
                backgroundColor: active ? hoverPrimary04 : background,
                color: textColor,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {t(section.label_key)}
                  </div>

                  <div className="mt-1 text-xs opacity-70">
                    ({section.columns} {t("dataImport.summary.columns")},{" "}
                    {section.issues} {t("dataImport.summary.issues")})
                  </div>
                </div>

                {hasIssues && (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                    {section.issues}
                  </span>
                )}
              </div>

              <p className="mt-3 line-clamp-2 text-xs leading-5 opacity-65">
                {t(`dataImport.sectionDescriptions.${section.key}`)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: React.ReactNode;
  danger?: boolean;
}) {
  const { background, borderColor, hoverPrimary04 } = useTheme();

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        backgroundColor: danger ? "#fee2e2" : hoverPrimary04 || background,
        borderColor: danger ? "#ef4444" : borderColor,
      }}
    >
      <div
        className={[
          "text-xs uppercase tracking-wide",
          danger ? "text-red-700" : "opacity-60",
        ].join(" ")}
      >
        {label}
      </div>

      <div
        className={[
          "mt-1 text-xl font-bold",
          danger ? "text-red-700" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

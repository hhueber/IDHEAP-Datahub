import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type {
  DataImportAnalyzeResponse,
  DataImportJobSummary,
} from "@/features/dataImport/dataImportTypes";

type DataImportWorkflowHeaderProps = {
  currentJob: DataImportJobSummary | null;
  analysis: DataImportAnalyzeResponse["data"] | null;
  showJobs: boolean;
  onToggleJobs: () => void;
  onChangeFile: () => void;
};

export function DataImportWorkflowHeader({
  currentJob,
  analysis,
  showJobs,
  onToggleJobs,
  onChangeFile,
}: DataImportWorkflowHeaderProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  return (
    <header
      className="overflow-hidden rounded-3xl border p-5 sm:p-6"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div
            className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor, backgroundColor: hoverPrimary04, color: primary }}
          >
            {t("dataImport.title")}
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("dataImport.title")}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 opacity-75">
            {t("dataImport.description")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleJobs}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
          >
            {showJobs
              ? t("dataImport.jobs.hide")
              : t("dataImport.jobs.show")}
          </button>

          {analysis && (
            <button
              type="button"
              onClick={onChangeFile}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80"
              style={{ borderColor, backgroundColor: hoverPrimary04 }}
            >
              {t("dataImport.actions.changeFile")}
            </button>
          )}
        </div>
      </div>

      {currentJob && analysis && (
        <div
          className="mt-5 flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
          <div className="min-w-0">
            <div className="truncate font-semibold">
              {currentJob.filename}
            </div>

            <div className="mt-1 text-xs opacity-70">
              {analysis.rows} {t("dataImport.summary.rows")} ·{" "}
              {analysis.columns} {t("dataImport.summary.columns")} ·{" "}
              {analysis.total_issues} {t("dataImport.summary.issues")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={t("dataImport.workflow.status.analyzed")}
              color={primary}
              borderColor={borderColor}
            />

            {analysis.detected_survey.name && analysis.detected_survey.year && (
              <div
                className="w-fit rounded-full border px-3 py-1 text-xs font-medium"
                style={{ borderColor }}
              >
                {analysis.detected_survey.name} {analysis.detected_survey.year}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function StatusBadge({
  label,
  color,
  borderColor,
}: {
  label: string;
  color: string;
  borderColor: string;
}) {
  return (
    <span
      className="w-fit rounded-full border px-3 py-1 text-xs font-medium"
      style={{ borderColor, color }}
    >
      {label}
    </span>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type { DataImportJobSummary } from "@/features/dataImport/dataImportTypes";

type DataImportJobsPanelProps = {
  jobs: DataImportJobSummary[];
  currentImportId: string | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onResume: (job: DataImportJobSummary) => Promise<void>;
  onDelete: (job: DataImportJobSummary) => Promise<void>;
};

export function DataImportJobsPanel({
  jobs,
  currentImportId,
  loading,
  onRefresh,
  onResume,
  onDelete,
}: DataImportJobsPanelProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  if (jobs.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-3xl border p-4 sm:p-5"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">{t("dataImport.jobs.title")}</h2>
          <p className="mt-1 text-sm opacity-70">
            {jobs.length} {t("dataImport.jobs.available")}
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void onRefresh()}
          className="w-fit rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
          style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
          {t("common.refresh")}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {jobs.map((job) => {
          const active = job.import_id === currentImportId;

          return (
            <article
              key={job.import_id}
              className="rounded-2xl border p-4 transition hover:-translate-y-[1px] hover:shadow-sm"
              style={{
                borderColor: active ? primary : borderColor,
                backgroundColor: active ? hoverPrimary04 : background,
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">
                      {job.filename}
                    </h3>

                    {active && (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                        style={{ borderColor: primary, color: primary }}
                      >
                        {t("dataImport.jobs.current")}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs opacity-75">
                    {job.analyzed ? (
                      <>
                        <span>{job.rows ?? "-"} {t("dataImport.summary.rows")}</span>
                        <span>·</span>
                        <span>{job.columns ?? "-"} {t("dataImport.summary.columns")}</span>
                        <span>·</span>
                        <span>{job.total_issues ?? 0} {t("dataImport.summary.issues")}</span>
                      </>
                    ) : (
                      <span>{t("dataImport.jobs.notAnalyzed")}</span>
                    )}
                  </div>

                  {job.detected_survey_name && job.detected_survey_year && (
                    <div className="mt-2 text-xs opacity-70">
                      {job.detected_survey_name} {job.detected_survey_year}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void onResume(job)}
                    className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
                    style={{ borderColor }}
                  >
                    {t("dataImport.jobs.resume")}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void onDelete(job)}
                    className="rounded-xl border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition hover:opacity-80 disabled:opacity-40"
                  >
                    {t("dataImport.jobs.delete")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

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
  const { t, i18n } = useTranslation();

  const {
    textColor,
    background,
    borderColor,
    hoverPrimary04,
    primary,
  } = useTheme();

  if (jobs.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-3xl border p-4 sm:p-5"
      style={{
        backgroundColor: background,
        borderColor,
        color: textColor,
      }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">
            {t("dataImport.jobs.title")}
          </h2>

          <p className="mt-1 text-sm opacity-70">
            {jobs.length}{" "}
            {t(
              jobs.length === 1
                ? "dataImport.jobs.availableSingle"
                : "dataImport.jobs.available"
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void onRefresh()}
          className="w-fit rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor,
            backgroundColor: hoverPrimary04,
          }}
        >
          {t("common.refresh")}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {jobs.map((job) => {
          const active = job.import_id === currentImportId;

          const filesCount = job.files_count ?? 1;
          const resourcesCount = job.resources_count ?? 1;

          /*
           * Le display_name représente maintenant le nom du dossier.
           *
           * filename reste uniquement un fallback pour les anciens imports
           * qui auraient été créés avant l'ajout du nom de dossier.
           */
          const folderName =
            job.display_name?.trim() ||
            job.filename?.trim() ||
            t("dataImport.jobs.unnamed");

          return (
            <article
              key={job.import_id}
              className="rounded-2xl border p-4 transition hover:-translate-y-[1px] hover:shadow-sm"
              style={{
                borderColor: active ? primary : borderColor,
                backgroundColor: active
                  ? hoverPrimary04
                  : background,
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="shrink-0 text-lg"
                      aria-hidden
                    >
                      {"\uD83D\uDCC1"} {/* code unicode pour ce symbole 📂 */}
                    </span>

                    <h3
                      className="min-w-0 truncate font-semibold"
                      title={folderName}
                    >
                      {folderName}
                    </h3>

                    {active && (
                      <span
                        className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          borderColor: primary,
                          color: primary,
                        }}
                      >
                        {t("dataImport.jobs.current")}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <JobBadge
                      label={`${filesCount} ${t(
                        filesCount === 1
                          ? "dataImport.jobs.file"
                          : "dataImport.jobs.files"
                      )}`}
                      borderColor={borderColor}
                    />

                    <JobBadge
                      label={`${resourcesCount} ${t(
                        resourcesCount === 1
                          ? "dataImport.jobs.resource"
                          : "dataImport.jobs.resources"
                      )}`}
                      borderColor={borderColor}
                    />
                  </div>

                  {job.years.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium opacity-60">
                        {t("dataImport.years.label")}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {job.years.map((year) => (
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
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="text-xs font-medium opacity-60">
                      {t("dataImport.jobs.folderSummary")}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs opacity-75">
                      {job.analyzed ? (
                        <>
                          <span>
                            {job.rows ?? "-"}{" "}
                            {t("dataImport.summary.rows")}
                          </span>

                          <span aria-hidden>
                            ·
                          </span>

                          <span>
                            {job.columns ?? "-"}{" "}
                            {t("dataImport.summary.columns")}
                          </span>

                          <span aria-hidden>
                            ·
                          </span>

                          <span>
                            {job.total_issues ?? 0}{" "}
                            {t("dataImport.summary.issues")}
                          </span>
                        </>
                      ) : (
                        <span>
                          {t("dataImport.jobs.notAnalyzed")}
                        </span>
                      )}
                    </div>
                  </div>

                  {job.detected_survey_name &&
                    job.detected_survey_year && (
                      <div className="mt-2 text-xs opacity-70">
                        {job.detected_survey_name}{" "}
                        {job.detected_survey_year}
                      </div>
                    )}

                  {job.created_at && (
                    <div className="mt-2 text-xs opacity-55">
                      {t("dataImport.jobs.createdAt", {
                        date: formatCreatedAt(
                          job.created_at,
                          i18n.language
                        ),
                      })}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={loading || active}
                    onClick={() => void onResume(job)}
                    className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor }}
                  >
                    {active
                      ? t("dataImport.jobs.opened")
                      : t("dataImport.jobs.resume")}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void onDelete(job)}
                    className="rounded-xl border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
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

function JobBadge({
  label,
  borderColor,
}: {
  label: string;
  borderColor: string;
}) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-xs"
      style={{ borderColor }}
    >
      {label}
    </span>
  );
}

function formatCreatedAt(
  createdAt: string,
  language: string
): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

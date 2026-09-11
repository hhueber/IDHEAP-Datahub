import React from "react";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { useTheme } from "@/theme/useTheme";
import { analyzeDataImportFile, deleteDataImportJob, fetchDataImportJobs, fetchDataImportPreview, fetchDataImportSummary, uploadDataImportFile } from "@/features/dataImport/dataImportApi";
import type { DataImportAnalyzeResponse, DataImportJobSummary, DataImportPreviewResponse, ImportSection } from "@/features/dataImport/dataImportTypes";
import { DataImportDropzone } from "@/features/dataImport/components/DataImportDropzone";
import { DataImportPreviewTable } from "@/features/dataImport/components/DataImportPreviewTable";
import { DataImportJobsPanel } from "@/features/dataImport/components/DataImportJobsPanel";
import { DataImportAnalysisPanel } from "@/features/dataImport/components/DataImportAnalysisPanel";
import { ConfirmModal } from "@/utils/ConfirmModal";

type LoadingStep = "idle" | "upload" | "analyze" | "preview";

export default function DataImportPage() {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  const [jobToDelete, setJobToDelete] = React.useState<DataImportJobSummary | null>(null);
  const [jobs, setJobs] = React.useState<DataImportJobSummary[]>([]);
  const [showJobs, setShowJobs] = React.useState(true);
  const [showDropzone, setShowDropzone] = React.useState(true);

  const [importId, setImportId] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<DataImportAnalyzeResponse["data"] | null>(null);
  const [preview, setPreview] = React.useState<DataImportPreviewResponse["data"] | null>(null);

  const [selectedSection, setSelectedSection] = React.useState<ImportSection>("responses");
  const [page, setPage] = React.useState(1);
  const [issuesOnly, setIssuesOnly] = React.useState(false);

  const [loadingStep, setLoadingStep] = React.useState<LoadingStep>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const perPage = 50;
  const loading = loadingStep !== "idle";

  const currentJob = React.useMemo(() => {
    if (!importId) return null;
    return jobs.find((job) => job.import_id === importId) ?? null;
  }, [jobs, importId]);

  const loadJobs = React.useCallback(async () => {
    try {
      const json = await fetchDataImportJobs();

      if (json.success) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadPreview = React.useCallback(
    async (
      nextImportId: string,
      section: ImportSection,
      nextPage: number,
      onlyIssues: boolean
    ) => {
      setLoadingStep("preview");
      setError(null);

      try {
        const json = await fetchDataImportPreview({
          importId: nextImportId,
          section,
          page: nextPage,
          perPage,
          issuesOnly: onlyIssues,
        });

        if (!json.success) {
          throw new Error(json.detail || t("common.unknown"));
        }

        setPreview(json.data);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || t("common.error"));
      } finally {
        setLoadingStep("idle");
      }
    },
    [t]
  );

  React.useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const getDefaultSection = (
    nextAnalysis: DataImportAnalyzeResponse["data"]
  ): ImportSection => {
    return (
      nextAnalysis.sections.find((section) => section.key === "responses")?.key ??
      nextAnalysis.sections.find((section) => section.columns > 0)?.key ??
      nextAnalysis.sections[0]?.key ??
      "unclassified"
    );
  };

  const openImport = async (nextImportId: string, alreadyAnalyzed: boolean) => {
    setError(null);
    setLoadingStep("analyze");

    try {
      setImportId(nextImportId);

      const summaryJson = alreadyAnalyzed
        ? await fetchDataImportSummary(nextImportId)
        : await analyzeDataImportFile(nextImportId);

      if (!summaryJson.success) {
        throw new Error(summaryJson.detail || t("common.unknown"));
      }

      const nextAnalysis = summaryJson.data;
      const firstSection = getDefaultSection(nextAnalysis);

      setAnalysis(nextAnalysis);
      setSelectedSection(firstSection);
      setPage(1);
      setIssuesOnly(false);
      setShowDropzone(false);
      setShowJobs(false);

      await loadPreview(nextImportId, firstSection, 1, false);
      await loadJobs();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || t("common.error"));
    } finally {
      setLoadingStep("idle");
    }
  };

  const handleResumeJob = async (job: DataImportJobSummary) => {
    await openImport(job.import_id, job.analyzed);
  };

  const handleDeleteJob = async (job: DataImportJobSummary) => {
        setJobToDelete(job);
    };

    const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
        const json = await deleteDataImportJob(jobToDelete.import_id);

        if (!json.success) {
          throw new Error(json.detail || t("common.error"));
        }

        if (importId === jobToDelete.import_id) {
          setImportId(null);
          setAnalysis(null);
          setPreview(null);
          setShowDropzone(true);
          setShowJobs(true);
        }

        setJobToDelete(null);
        await loadJobs();
    } catch (err: any) {
        console.error(err);
        setError(err?.message || t("common.error"));
    }
  };

  const cancelDeleteJob = () => {
    setJobToDelete(null);
  };

  const handleFileSelected = async (file: File) => {
    setLoadingStep("upload");
    setError(null);
    setAnalysis(null);
    setPreview(null);

    try {
      const uploadJson = await uploadDataImportFile(file);

      if (!uploadJson.success) {
        throw new Error(uploadJson.detail || t("common.unknown"));
      }

      await openImport(uploadJson.data.import_id, false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || t("common.error"));
    } finally {
      setLoadingStep("idle");
    }
  };

  const handleSectionChange = async (section: ImportSection) => {
    if (!importId || loading) return;

    setSelectedSection(section);
    setPage(1);
    await loadPreview(importId, section, 1, issuesOnly);
  };

  const handlePageChange = async (nextPage: number) => {
    if (!importId || nextPage < 1 || loading) return;

    setPage(nextPage);
    await loadPreview(importId, selectedSection, nextPage, issuesOnly);
  };

  const handleIssuesOnlyChange = async () => {
    if (!importId || loading) return;

    const nextValue = !issuesOnly;
    setIssuesOnly(nextValue);
    setPage(1);
    await loadPreview(importId, selectedSection, 1, nextValue);
  };

  const resetCurrentImportView = () => {
    setImportId(null);
    setAnalysis(null);
    setPreview(null);
    setSelectedSection("responses");
    setPage(1);
    setIssuesOnly(false);
    setShowDropzone(true);
    setShowJobs(true);
  };

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6"
      style={{ color: textColor }}
    >
      <header
        className="overflow-hidden rounded-3xl border p-5 sm:p-6"
        style={{ backgroundColor: background, borderColor }}
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
              onClick={() => setShowJobs((value) => !value)}
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
                onClick={resetCurrentImportView}
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
            className="mt-5 flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
          >
            <div className="min-w-0">
              <div className="truncate font-semibold">
                {currentJob.filename}
              </div>
              <div className="text-xs opacity-70">
                {analysis.rows} {t("dataImport.summary.rows")} ·{" "}
                {analysis.columns} {t("dataImport.summary.columns")} ·{" "}
                {analysis.total_issues} {t("dataImport.summary.issues")}
              </div>
            </div>

            {analysis.detected_survey.name && analysis.detected_survey.year && (
              <div
                className="w-fit rounded-full border px-3 py-1 text-xs font-medium"
                style={{ borderColor }}
              >
                {analysis.detected_survey.name} {analysis.detected_survey.year}
              </div>
            )}
          </div>
        )}
      </header>

      {loading && (
        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: background, borderColor }}
        >
          <div className="flex items-center gap-3 text-sm">
            <LoadingDots />
            <span>{t(`dataImport.loading.${loadingStep}`)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showDropzone && (
        <section
          className="rounded-3xl border p-4 sm:p-6"
          style={{ backgroundColor: background, borderColor }}
        >
          <DataImportDropzone disabled={loading} onFileSelected={handleFileSelected} />
        </section>
      )}

      {showJobs && (
        <DataImportJobsPanel
          jobs={jobs}
          currentImportId={importId}
          loading={loading}
          onRefresh={loadJobs}
          onResume={handleResumeJob}
          onDelete={handleDeleteJob}
        />
      )}

      {analysis && (
        <DataImportAnalysisPanel
          analysis={analysis}
          selectedSection={selectedSection}
          issuesOnly={issuesOnly}
          loading={loading}
          onSectionChange={handleSectionChange}
          onToggleIssuesOnly={handleIssuesOnlyChange}
        />
      )}

      {preview && importId && (
        <DataImportPreviewTable
          importId={importId}
          data={preview}
          page={page}
          perPage={perPage}
          onPageChange={handlePageChange}
          onReload={() => loadPreview(importId, selectedSection, page, issuesOnly)}
          onAnalysisUpdated={setAnalysis}
        />
      )}
      <ConfirmModal
        open={!!jobToDelete}
        title={t("dataImport.jobs.deleteTitle")}
        message={
            jobToDelete
            ? t("dataImport.jobs.confirmDelete", { filename: jobToDelete.filename })
            : ""
        }
        confirmLabel={t("dataImport.jobs.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void confirmDeleteJob()}
        onCancel={cancelDeleteJob}
      />
    </main>
  );
}

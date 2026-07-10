import React from "react";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { useTheme } from "@/theme/useTheme";
import { analyzeDataImportFile, confirmDataImportColumns, deleteDataImportJob, fetchDataImportJobs, fetchDataImportPreview, fetchDataImportSummary, patchDataImportColumn, uploadDataImportFile } from "@/features/dataImport/dataImportApi";
import type { DataImportAnalyzeResponse, DataImportJobSummary, DataImportPreviewFilters, DataImportPreviewResponse, ImportIssueGroup, ImportSection } from "@/features/dataImport/dataImportTypes";
import type { DataImportWorkflowStep } from "@/features/dataImport/dataImportWorkflowTypes";
import { DataImportDropzone } from "@/features/dataImport/components/DataImportDropzone";
import { DataImportJobsPanel } from "@/features/dataImport/components/DataImportJobsPanel";
import { DataImportWorkflowHeader } from "@/features/dataImport/components/DataImportWorkflowHeader";
import { DataImportStepTabs } from "@/features/dataImport/components/DataImportStepTabs";
import { DataImportStepPlaceholder } from "@/features/dataImport/components/DataImportStepPlaceholder";
import { DataImportExploreStep } from "@/features/dataImport/components/explore/DataImportExploreStep";
import { ConfirmModal } from "@/utils/ConfirmModal";
import { DataImportImproveStep } from "@/features/dataImport/components/improve/DataImportImproveStep";

type LoadingStep = "idle" | "upload" | "analyze" | "preview";

const DEFAULT_PREVIEW_FILTERS: DataImportPreviewFilters = {
  search: "",
  detectedType: "all",
  columnIndex: null,
  sortColumnIndex: null,
  sortDirection: "asc",
};

export default function DataImportPage() {
  const { t } = useTranslation();
  const { textColor, background, borderColor } = useTheme();

  const [jobToDelete, setJobToDelete] =
    React.useState<DataImportJobSummary | null>(null);

  const [jobs, setJobs] = React.useState<DataImportJobSummary[]>([]);
  const [showJobs, setShowJobs] = React.useState(true);
  const [showDropzone, setShowDropzone] = React.useState(true);

  const [importId, setImportId] = React.useState<string | null>(null);
  const [analysis, setAnalysis] =
    React.useState<DataImportAnalyzeResponse["data"] | null>(null);
  const [preview, setPreview] =
    React.useState<DataImportPreviewResponse["data"] | null>(null);

  const [activeStep, setActiveStep] =
    React.useState<DataImportWorkflowStep>("explore");

  const [selectedSection, setSelectedSection] =
    React.useState<ImportSection>("responses");
  const [page, setPage] = React.useState(1);
  const [issuesOnly, setIssuesOnly] = React.useState(false);

  const [loadingStep, setLoadingStep] = React.useState<LoadingStep>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const [previewFilters, setPreviewFilters] =
    React.useState<DataImportPreviewFilters>(DEFAULT_PREVIEW_FILTERS);

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
        onlyIssues: boolean,
        filters: DataImportPreviewFilters
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
            search: filters.search,
            detectedType: filters.detectedType,
            columnIndex: filters.columnIndex,
            sortColumnIndex: filters.sortColumnIndex,
            sortDirection: filters.sortDirection,
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
      setPreviewFilters(DEFAULT_PREVIEW_FILTERS);
      setActiveStep("explore");
      setShowDropzone(false);
      setShowJobs(false);

      await loadPreview(nextImportId, firstSection, 1, false, DEFAULT_PREVIEW_FILTERS);
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

  const handleOpenIssueGroup = async (group: ImportIssueGroup) => {
    if (!importId || loading) return;

    const nextFilters: DataImportPreviewFilters = {
        search: "",
        detectedType: "all",
        columnIndex: group.column_index,
        sortColumnIndex: null,
        sortDirection: "asc",
    };

    setSelectedSection(group.section);
    setIssuesOnly(true);
    setPreviewFilters(nextFilters);
    setPage(1);
    setActiveStep("explore");

    await loadPreview(
        importId,
        group.section,
        1,
        true,
        nextFilters
    );
  };

  const handleConfirmColumnIssue = async (group: ImportIssueGroup) => {
    if (!importId || loading) return;

    try {
        const json = await patchDataImportColumn({
        importId,
        columnIndex: group.column_index,
        section: group.section,
        });

        if (!json.success) {
        throw new Error(json.detail || t("common.error"));
        }

        setAnalysis(json.data);

        await loadPreview(
        importId,
        selectedSection,
        page,
        issuesOnly,
        previewFilters
        );

        await loadJobs();
    } catch (err: any) {
        console.error(err);
        setError(err?.message || t("common.error"));
    }
  };

  const handleConfirmColumnIssues = async (groups: ImportIssueGroup[]) => {
    if (!importId || loading || groups.length === 0) return;

    try {
        const columnIndexes = Array.from(
            new Set(
                groups
                .filter((group) => group.code === "SECTION_NEEDS_CONFIRMATION")
                .map((group) => group.column_index)
            )
        );

        if (columnIndexes.length === 0) return;

        const json = await confirmDataImportColumns({
            importId,
            columnIndexes,
        });

        if (!json.success) {
            throw new Error(json.detail || t("common.error"));
        }

        setAnalysis(json.data);

        await loadPreview(
            importId,
            selectedSection,
            page,
            issuesOnly,
            previewFilters
        );

        await loadJobs();
    } catch (err: any) {
        console.error(err);
        setError(err?.message || t("common.error"));
    }
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
        setActiveStep("explore");
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
    setActiveStep("explore");

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

    const nextFilters: DataImportPreviewFilters = {
      ...previewFilters,
      columnIndex: null,
      sortColumnIndex: null,
    };

    setPreviewFilters(nextFilters);
    await loadPreview(importId, section, 1, issuesOnly, nextFilters);
  };

  const handlePageChange = async (nextPage: number) => {
    if (!importId || nextPage < 1 || loading) return;

    setPage(nextPage);
    await loadPreview(importId, selectedSection, nextPage, issuesOnly, previewFilters);
  };

  const handleIssuesOnlyChange = async () => {
    if (!importId || loading) return;

    const nextValue = !issuesOnly;
    setIssuesOnly(nextValue);
    setPage(1);
    await loadPreview(importId, selectedSection, 1, nextValue, previewFilters);
  };

  const handlePreviewFiltersChange = async (
    filters: DataImportPreviewFilters
    ) => {
    if (!importId || loading) return;

    setPreviewFilters(filters);
    setPage(1);
    await loadPreview(importId, selectedSection, 1, issuesOnly, filters);
  };

  const handlePreviewFiltersReset = async () => {
    if (!importId || loading) return;

    setPreviewFilters(DEFAULT_PREVIEW_FILTERS);
    setIssuesOnly(false);
    setPage(1);

    await loadPreview(
        importId,
        selectedSection,
        1,
        false,
        DEFAULT_PREVIEW_FILTERS
    );
  };

  const reloadCurrentPreview = async () => {
    if (!importId) return;

    await loadPreview(importId, selectedSection, page, issuesOnly, previewFilters);
  };

  const resetCurrentImportView = () => {
    setImportId(null);
    setAnalysis(null);
    setPreview(null);
    setActiveStep("explore");
    setSelectedSection("responses");
    setPage(1);
    setIssuesOnly(false);
    setPreviewFilters(DEFAULT_PREVIEW_FILTERS);
    setShowDropzone(true);
    setShowJobs(true);
  };

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6"
      style={{ color: textColor }}
    >
      <DataImportWorkflowHeader
        currentJob={currentJob}
        analysis={analysis}
        showJobs={showJobs}
        loading={loading}
        onToggleJobs={() => setShowJobs((value) => !value)}
        onChangeFile={resetCurrentImportView}
        onDisplayNameSaved={(displayName) => {
            if (!importId) return;

            setJobs((previousJobs) =>
            previousJobs.map((job) =>
                job.import_id === importId
                ? {
                    ...job,
                    display_name: displayName,
                    }
                : job
            )
            );
        }}
      />

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
          <DataImportDropzone
            disabled={loading}
            onFileSelected={handleFileSelected}
          />
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

      {analysis && importId && (
        <>
          <DataImportStepTabs
            activeStep={activeStep}
            disabled={loading}
            onChange={setActiveStep}
          />

          {activeStep === "explore" && (
            <DataImportExploreStep
              importId={importId}
              analysis={analysis}
              preview={preview}
              selectedSection={selectedSection}
              page={page}
              perPage={perPage}
              issuesOnly={issuesOnly}
              filters={previewFilters}
              loading={loading}
              onSectionChange={handleSectionChange}
              onToggleIssuesOnly={handleIssuesOnlyChange}
              onFiltersChange={handlePreviewFiltersChange}
              onResetFilters={handlePreviewFiltersReset}
              onPageChange={handlePageChange}
              onReloadPreview={reloadCurrentPreview}
              onAnalysisUpdated={setAnalysis}
            />
          )}

          {activeStep === "improve" && (
            <DataImportImproveStep
                importId={importId}
                loading={loading}
                onOpenIssueGroup={handleOpenIssueGroup}
                onConfirmColumnIssue={handleConfirmColumnIssue}
                onConfirmColumnIssues={handleConfirmColumnIssues}
            />
          )}

          {activeStep === "validate" && (
            <DataImportStepPlaceholder step="validate" />
          )}
        </>
      )}

      <ConfirmModal
        open={!!jobToDelete}
        title={t("dataImport.jobs.deleteTitle")}
        message={
          jobToDelete
            ? t("dataImport.jobs.confirmDelete", {
                filename: jobToDelete.display_name || jobToDelete.filename,
              })
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

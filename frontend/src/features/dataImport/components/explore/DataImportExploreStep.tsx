import type {
  DataImportAnalyzeResponse,
  DataImportPreviewFilters,
  DataImportPreviewResponse,
  ImportSection,
} from "@/features/dataImport/dataImportTypes";
import { DataImportAnalysisPanel } from "@/features/dataImport/components/DataImportAnalysisPanel";
import { DataImportPreviewTable } from "@/features/dataImport/components/DataImportPreviewTable";
import { DataImportPreviewToolbar } from "@/features/dataImport/components/explore/DataImportPreviewToolbar";

type DataImportExploreStepProps = {
  importId: string;
  analysis: DataImportAnalyzeResponse["data"];
  preview: DataImportPreviewResponse["data"] | null;
  selectedSection: ImportSection;
  page: number;
  perPage: number;
  issuesOnly: boolean;
  filters: DataImportPreviewFilters;
  loading: boolean;
  onSectionChange: (section: ImportSection) => Promise<void>;
  onToggleIssuesOnly: () => Promise<void>;
  onFiltersChange: (filters: DataImportPreviewFilters) => Promise<void>;
  onResetFilters: () => Promise<void>;
  onPageChange: (page: number) => Promise<void>;
  onReloadPreview: () => Promise<void>;
  onAnalysisUpdated: (analysis: DataImportAnalyzeResponse["data"]) => void;
};

export function DataImportExploreStep({
  importId,
  analysis,
  preview,
  selectedSection,
  page,
  perPage,
  issuesOnly,
  filters,
  loading,
  onSectionChange,
  onToggleIssuesOnly,
  onFiltersChange,
  onResetFilters,
  onPageChange,
  onReloadPreview,
  onAnalysisUpdated,
}: DataImportExploreStepProps) {
  return (
    <>
      <DataImportAnalysisPanel
        analysis={analysis}
        selectedSection={selectedSection}
        loading={loading}
        onSectionChange={onSectionChange}
      />

      {preview && (
        <DataImportPreviewTable
          importId={importId}
          data={preview}
          columnsSummary={analysis.columns_summary}
          page={page}
          perPage={perPage}
          toolbar={
            <DataImportPreviewToolbar
              section={selectedSection}
              columns={analysis.columns_summary}
              filters={filters}
              issuesOnly={issuesOnly}
              loading={loading}
              onFiltersChange={onFiltersChange}
              onToggleIssuesOnly={onToggleIssuesOnly}
              onResetFilters={onResetFilters}
            />
          }
          onPageChange={onPageChange}
          onReload={onReloadPreview}
          onAnalysisUpdated={onAnalysisUpdated}
        />
      )}
    </>
  );
}

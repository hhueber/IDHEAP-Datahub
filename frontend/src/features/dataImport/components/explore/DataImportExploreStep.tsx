import type {
  DataImportAnalyzeResponse,
  DataImportPreviewResponse,
  ImportSection,
} from "@/features/dataImport/dataImportTypes";
import { DataImportAnalysisPanel } from "@/features/dataImport/components/DataImportAnalysisPanel";
import { DataImportPreviewTable } from "@/features/dataImport/components/DataImportPreviewTable";

type DataImportExploreStepProps = {
  importId: string;
  analysis: DataImportAnalyzeResponse["data"];
  preview: DataImportPreviewResponse["data"] | null;
  selectedSection: ImportSection;
  page: number;
  perPage: number;
  issuesOnly: boolean;
  loading: boolean;
  onSectionChange: (section: ImportSection) => Promise<void>;
  onToggleIssuesOnly: () => Promise<void>;
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
  loading,
  onSectionChange,
  onToggleIssuesOnly,
  onPageChange,
  onReloadPreview,
  onAnalysisUpdated,
}: DataImportExploreStepProps) {
  return (
    <>
      <DataImportAnalysisPanel
        analysis={analysis}
        selectedSection={selectedSection}
        issuesOnly={issuesOnly}
        loading={loading}
        onSectionChange={onSectionChange}
        onToggleIssuesOnly={onToggleIssuesOnly}
      />

      {preview && (
        <DataImportPreviewTable
          importId={importId}
          data={preview}
          page={page}
          perPage={perPage}
          onPageChange={onPageChange}
          onReload={onReloadPreview}
          onAnalysisUpdated={onAnalysisUpdated}
        />
      )}
    </>
  );
}

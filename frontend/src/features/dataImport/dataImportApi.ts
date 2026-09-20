import { apiFetch } from "@/shared/apiFetch";
import type {
  DataImportAnalyzeResponse,
  ColumnTransformAction,
  DataImportPreviewResponse,
  DataImportUploadResponse,
  DetectedType,
  ImportSection,
  DataImportPatchWithAnalysisResponse,
  DataImportDeleteResponse,
  DataImportListResponse,
} from "@/features/dataImport/dataImportTypes";

export async function uploadDataImportFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<DataImportUploadResponse>("/data-import/upload", {
    method: "POST",
    auth: true,
    body: formData,
  });
}

export async function analyzeDataImportFile(importId: string) {
  return apiFetch<DataImportAnalyzeResponse>(`/data-import/${importId}/analyze`, {
    method: "POST",
    auth: true,
  });
}

export async function fetchDataImportPreview(params: {
  importId: string;
  section: ImportSection;
  page: number;
  perPage: number;
  issuesOnly: boolean;
}) {
  return apiFetch<DataImportPreviewResponse>(`/data-import/${params.importId}/preview`, {
    method: "GET",
    auth: true,
    query: {
      section: params.section,
      page: params.page,
      per_page: params.perPage,
      issues_only: params.issuesOnly,
    },
  });
}

export async function patchDataImportCell(params: {
  importId: string;
  rowIndex: number;
  columnIndex: number;
  value: string | null;
}) {
  return apiFetch<DataImportPatchWithAnalysisResponse>(
    `/data-import/${params.importId}/cell`,
    {
      method: "PATCH",
      auth: true,
      body: {
        row_index: params.rowIndex,
        column_index: params.columnIndex,
        value: params.value,
      },
    }
  );
}

export async function patchDataImportColumn(params: {
  importId: string;
  columnIndex: number;
  section?: ImportSection;
  detectedType?: DetectedType;
  ignored?: boolean;
}) {
  return apiFetch<DataImportPatchWithAnalysisResponse>(
    `/data-import/${params.importId}/column`,
    {
      method: "PATCH",
      auth: true,
      body: {
        column_index: params.columnIndex,
        section: params.section,
        detected_type: params.detectedType,
        ignored: params.ignored,
      },
    }
  );
}

export async function patchDataImportColumnTransform(params: {
  importId: string;
  columnIndex: number;
  action: ColumnTransformAction;
  search?: string;
  replacement?: string;
}) {
  return apiFetch<DataImportPatchWithAnalysisResponse>(
    `/data-import/${params.importId}/column-transform`,
    {
      method: "PATCH",
      auth: true,
      body: {
        column_index: params.columnIndex,
        action: params.action,
        search: params.search,
        replacement: params.replacement,
      },
    }
  );
}

export async function fetchDataImportJobs() {
  return apiFetch<DataImportListResponse>("/data-import", {
    method: "GET",
    auth: true,
  });
}

export async function fetchDataImportSummary(importId: string) {
  return apiFetch<DataImportAnalyzeResponse>(`/data-import/${importId}/summary`, {
    method: "GET",
    auth: true,
  });
}

export async function deleteDataImportJob(importId: string) {
  return apiFetch<DataImportDeleteResponse>(`/data-import/${importId}`, {
    method: "DELETE",
    auth: true,
  });
}

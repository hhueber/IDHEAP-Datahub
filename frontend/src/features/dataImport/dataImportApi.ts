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
  DataImportNamePatchResponse,
  DataImportIssuesResponse,
  DataImportActiveResourceResponse,
  DataImportResourcesResponse,
  DataImportWorkspaceUploadResponse,
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

export async function analyzeDataImportFile(
  importId: string
) {
  return apiFetch<DataImportAnalyzeResponse>(
    `/data-import/${importId}/analyze`,
    {
      method: "POST",
      auth: true,
    }
  );
}

export async function fetchDataImportPreview(params: {
  importId: string;
  section: ImportSection;
  page: number;
  perPage: number;
  issuesOnly: boolean;
  search?: string;
  detectedType?: DetectedType | "all";
  columnIndex?: number | null;
  sortColumnIndex?: number | null;
  sortDirection?: "asc" | "desc";
}) {
  return apiFetch<DataImportPreviewResponse>(
    `/data-import/${params.importId}/preview`,
    {
      method: "GET",
      auth: true,
      query: {
        section: params.section,
        page: params.page,
        per_page: params.perPage,
        issues_only: params.issuesOnly,
        search: params.search?.trim() || undefined,
        detected_type:
          params.detectedType &&
          params.detectedType !== "all"
            ? params.detectedType
            : undefined,
        column_index: params.columnIndex ?? undefined,
        sort_column_index:
          params.sortColumnIndex ?? undefined,
        sort_direction: params.sortDirection ?? "asc",
      },
    }
  );
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

export async function fetchDataImportSummary(
  importId: string
) {
  return apiFetch<DataImportAnalyzeResponse>(
    `/data-import/${importId}/summary`,
    {
      method: "GET",
      auth: true,
    }
  );
}

export async function deleteDataImportJob(importId: string) {
  return apiFetch<DataImportDeleteResponse>(`/data-import/${importId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function patchDataImportDisplayName(params: {
  importId: string;
  displayName: string | null;
}) {
  return apiFetch<DataImportNamePatchResponse>(
    `/data-import/${params.importId}/name`,
    {
      method: "PATCH",
      auth: true,
      body: {
        display_name: params.displayName,
      },
    }
  );
}

export async function fetchDataImportIssues(
  importId: string,
) {
  return apiFetch<DataImportIssuesResponse>(
    `/data-import/${importId}/issues`,
    {
      method: "GET",
      auth: true,
    }
  );
}

export async function confirmDataImportColumns(params: {
  importId: string;
  columnIndexes: number[];
}) {
  return apiFetch<DataImportPatchWithAnalysisResponse>(
    `/data-import/${params.importId}/columns/confirm`,
    {
      method: "PATCH",
      auth: true,
      body: {
        column_indexes: params.columnIndexes,
      },
    }
  );
}

export async function uploadDataImportFiles(params: {
  files: File[];
  displayName: string | null;
}) {
  const formData = new FormData();

  for (const file of params.files) {
    formData.append("files", file);
  }

  if (params.displayName?.trim()) {
    formData.append(
      "display_name",
      params.displayName.trim()
    );
  }

  return apiFetch<DataImportWorkspaceUploadResponse>(
    "/data-import/upload/batch",
    {
      method: "POST",
      auth: true,
      body: formData,
    }
  );
}

export async function addDataImportFiles(params: {
  importId: string;
  files: File[];
}) {
  const formData = new FormData();

  for (const file of params.files) {
    formData.append("files", file);
  }

  return apiFetch<DataImportWorkspaceUploadResponse>(
    `/data-import/${params.importId}/files`,
    {
      method: "POST",
      auth: true,
      body: formData,
    }
  );
}

export async function fetchDataImportResources(
  importId: string
) {
  return apiFetch<DataImportResourcesResponse>(
    `/data-import/${importId}/files`,
    {
      method: "GET",
      auth: true,
    }
  );
}

export async function selectDataImportResource(params: {
  importId: string;
  resourceId: string;
}) {
  return apiFetch<DataImportActiveResourceResponse>(
    `/data-import/${params.importId}/active-resource`,
    {
      method: "PATCH",
      auth: true,
      body: {
        resource_id: params.resourceId,
      },
    }
  );
}

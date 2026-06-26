export type ImportOrientation = "normal" | "transposed" | "unknown";

export type ImportSection =
  | "dataset"
  | "questions"
  | "responses"
  | "choices"
  | "municipalities"
  | "metadata"
  | "unclassified"
  | "ignored";

export type DetectedType =
  | "integer"
  | "float"
  | "boolean"
  | "date"
  | "datetime"
  | "text"
  | "empty"
  | "mixed";

export type DataImportUploadResponse = {
  success: boolean;
  detail: string;
  data: {
    import_id: string;
    filename: string;
    display_name: string | null;
    size: number;
  };
};

export type ImportSectionSummary = {
  key: ImportSection;
  label_key: string;
  rows: number;
  columns: number;
  issues: number;
};

export type ImportColumnSummary = {
  index: number;
  original_name: string;
  normalized_name: string;
  section: ImportSection;
  detected_type: DetectedType;
  confidence: number;
  issue_count: number;
};

export type DataImportAnalyzeResponse = {
  success: boolean;
  detail: string;
  data: {
    import_id: string;
    rows: number;
    columns: number;
    cells: number;
    orientation: ImportOrientation;
    detected_survey: {
      name: string | null;
      year: number | null;
      confidence: number;
      existing_survey_uid: number | null;
      needs_user_confirmation: boolean;
    };
    sections: ImportSectionSummary[];
    columns_summary: ImportColumnSummary[];
    total_issues: number;
  };
};

export type ImportCellIssue = {
  row_index: number;
  column_index: number;
  code: string;
  severity: "warning" | "error";
  message_key: string;
  expected_type?: DetectedType | null;
  actual_value?: string | null;
};

export type ImportPreviewColumn = {
  index: number;
  name: string;
  section: ImportSection;
  detected_type: DetectedType;
  issue_count: number;
};

export type ImportPreviewRow = {
  row_index: number;
  cells: Record<
    string,
    {
      value: string | null;
      issue: ImportCellIssue | null;
    }
  >;
};

export type DataImportPreviewResponse = {
  success: boolean;
  detail: string;
  data: {
    import_id: string;
    section: ImportSection;
    page: number;
    per_page: number;
    total_rows: number;
    columns: ImportPreviewColumn[];
    rows: ImportPreviewRow[];
    issues_count: number;
  };
};

export type ColumnTransformAction =
  | "trim"
  | "replace"
  | "comma_to_dot"
  | "dot_to_comma"
  | "empty_to_null"
  | "normalize_datetime"
  | "datetime_to_date";

export type DataImportPatchWithAnalysisResponse = {
  success: boolean;
  detail: string;
  data: DataImportAnalyzeResponse["data"];
};

export type DataImportJobSummary = {
  import_id: string;
  filename: string;
  display_name: string | null;
  size: number;
  created_at: string | null;
  analyzed: boolean;
  rows: number | null;
  columns: number | null;
  total_issues: number | null;
  detected_survey_name: string | null;
  detected_survey_year: number | null;
};

export type DataImportListResponse = {
  success: boolean;
  detail: string;
  data: DataImportJobSummary[];
};

export type DataImportDeleteResponse = {
  success: boolean;
  detail: string;
};

export type DataImportNamePatchResponse = {
  success: boolean;
  detail: string;
  data: {
    import_id: string;
    filename: string;
    display_name: string | null;
  };
};

export type DataImportPreviewDetectedTypeFilter = DetectedType | "all";

export type DataImportPreviewSortDirection = "asc" | "desc";

export type DataImportPreviewFilters = {
  search: string;
  detectedType: DataImportPreviewDetectedTypeFilter;
  columnIndex: number | null;
  sortColumnIndex: number | null;
  sortDirection: DataImportPreviewSortDirection;
};

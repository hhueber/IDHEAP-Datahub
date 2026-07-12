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

export type ImportMostCommonValue = {
  value: string | null;
  count: number;
};

export type ImportColumnSummary = {
  index: number;
  original_name: string;
  normalized_name: string;
  section: ImportSection;
  detected_type: DetectedType;
  confidence: number;
  issue_count: number;

  empty_count?: number | null;
  non_empty_count?: number | null;
  unique_count?: number | null;
  sample_values?: string[] | null;
  most_common_values?: ImportMostCommonValue[] | null;
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
    files_count?: number;
    resources_count?: number;
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

  empty_count?: number | null;
  non_empty_count?: number | null;
  unique_count?: number | null;
  sample_values?: string[] | null;
  most_common_values?: ImportMostCommonValue[] | null;
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
    resource_id?: string | null;
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
  files_count: number;
  resources_count: number;
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

export type ImportIssueGroupSample = {
  value: string | null;
  count: number;
};

export type ImportIssueGroup = {
  id: string;
  code: string;
  severity: "warning" | "error";
  message_key: string;
  section: ImportSection;
  column_index: number;
  column_name: string;
  detected_type: DetectedType;
  expected_type: DetectedType | null;
  count: number;
  affected_rows: number;
  sample_values: ImportIssueGroupSample[];
};

export type DataImportIssuesResponse = {
  success: boolean;
  detail: string;
  data: {
    import_id: string;
    resource_id?: string | null;
    total_groups: number;
    total_issues: number;
    blocking_issues: number;
    warning_issues: number;
    groups: ImportIssueGroup[];
  };
};

export type DataImportResourceSummary = {
  resource_id: string;
  source_id: string;
  filename: string;
  sheet_name: string | null;
  display_name: string;
  raw_path: string;
  created_at: string | null;
  analyzed?: boolean;
  rows?: number | null;
  columns?: number | null;
  readable?: boolean | null;
};

export type DataImportWorkspaceUploadData = {
  import_id: string;
  display_name: string | null;
  size: number;
  files_count: number;
  resources_count: number;
  active_resource_id: string;
  resources: DataImportResourceSummary[];
  added_resources: DataImportResourceSummary[];
};

export type DataImportWorkspaceUploadResponse = {
  success: boolean;
  detail: string;
  data: DataImportWorkspaceUploadData;
};

export type DataImportResourcesData = {
  import_id: string;
  resources: DataImportResourceSummary[];
};

export type DataImportResourcesResponse = {
  success: boolean;
  detail: string;
  data: DataImportResourcesData;
};

export type DataImportActiveResourceResponse = {
  success: boolean;
  detail: string;
  data: {
    import_id: string;
    active_resource_id: string;
    resource: DataImportResourceSummary;
  };
};

export type DataImportCommitResponse = {
  success: boolean;
  detail: string;
  data: {
    import_id: string;
    status: "not_implemented";
  };
};

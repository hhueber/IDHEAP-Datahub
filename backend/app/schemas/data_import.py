from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel


class ImportOrientationEnum(str, Enum):
    normal = "normal"
    transposed = "transposed"
    unknown = "unknown"


class ImportSectionEnum(str, Enum):
    dataset = "dataset"
    questions = "questions"
    responses = "responses"
    choices = "choices"
    municipalities = "municipalities"
    metadata = "metadata"
    unclassified = "unclassified"
    ignored = "ignored"


class DetectedTypeEnum(str, Enum):
    integer = "integer"
    float = "float"
    boolean = "boolean"
    date = "date"
    datetime = "datetime"
    text = "text"
    empty = "empty"
    mixed = "mixed"


class DataImportUploadData(BaseModel):
    import_id: str
    filename: str
    size: int


class DataImportUploadResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportUploadData


class DetectedSurvey(BaseModel):
    name: str | None = None
    year: int | None = None
    confidence: float = 0.0
    existing_survey_uid: int | None = None
    needs_user_confirmation: bool = True


class ImportSectionSummary(BaseModel):
    key: ImportSectionEnum
    label_key: str
    rows: int
    columns: int
    issues: int


class ImportColumnSummary(BaseModel):
    index: int
    original_name: str
    normalized_name: str
    section: ImportSectionEnum
    detected_type: DetectedTypeEnum
    confidence: float
    issue_count: int


class DataImportAnalyzeData(BaseModel):
    import_id: str
    rows: int
    columns: int
    cells: int
    orientation: ImportOrientationEnum
    detected_survey: DetectedSurvey
    sections: list[ImportSectionSummary]
    columns_summary: list[ImportColumnSummary]
    total_issues: int


class DataImportAnalyzeResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportAnalyzeData


class ImportCellIssue(BaseModel):
    row_index: int
    column_index: int
    code: str
    severity: Literal["warning", "error"]
    message_key: str
    expected_type: DetectedTypeEnum | None = None
    actual_value: str | None = None


class ImportPreviewColumn(BaseModel):
    index: int
    name: str
    section: ImportSectionEnum
    detected_type: DetectedTypeEnum
    issue_count: int


class ImportPreviewRow(BaseModel):
    row_index: int
    cells: dict[str, dict[str, Any]]


class DataImportPreviewData(BaseModel):
    import_id: str
    section: ImportSectionEnum
    page: int
    per_page: int
    total_rows: int
    columns: list[ImportPreviewColumn]
    rows: list[ImportPreviewRow]
    issues_count: int


class DataImportPreviewResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportPreviewData


class DataImportCellPatch(BaseModel):
    row_index: int
    column_index: int
    value: str | None


class DataImportColumnPatch(BaseModel):
    column_index: int
    section: ImportSectionEnum | None = None
    detected_type: DetectedTypeEnum | None = None
    ignored: bool | None = None


class DataImportPatchResponse(BaseModel):
    success: bool
    detail: str


class ColumnTransformActionEnum(str, Enum):
    trim = "trim"
    replace = "replace"
    comma_to_dot = "comma_to_dot"
    dot_to_comma = "dot_to_comma"
    empty_to_null = "empty_to_null"
    normalize_datetime = "normalize_datetime"
    datetime_to_date = "datetime_to_date"


class DataImportColumnTransformPatch(BaseModel):
    column_index: int
    action: ColumnTransformActionEnum
    search: str | None = None
    replacement: str | None = None


class DataImportPatchWithAnalysisResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportAnalyzeData


class DataImportJobSummary(BaseModel):
    import_id: str
    filename: str
    size: int
    created_at: str | None = None
    analyzed: bool
    rows: int | None = None
    columns: int | None = None
    total_issues: int | None = None
    detected_survey_name: str | None = None
    detected_survey_year: int | None = None


class DataImportListResponse(BaseModel):
    success: bool
    detail: str
    data: list[DataImportJobSummary]


class DataImportDeleteResponse(BaseModel):
    success: bool
    detail: str

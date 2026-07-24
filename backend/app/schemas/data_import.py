from enum import Enum
from typing import Any, Literal, Optional


from pydantic import BaseModel, Field, field_validator


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
    display_name: str | None = None
    size: int
    years: list[int] = Field(default_factory=list)


class DataImportUploadResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportUploadData


class DetectedSurvey(BaseModel):
    name: Optional[str] = None
    year: Optional[int] = None
    confidence: float = 0.0
    existing_survey_uid: Optional[int] = None
    needs_user_confirmation: bool = True


class ImportSectionSummary(BaseModel):
    key: ImportSectionEnum
    label_key: str
    rows: int
    columns: int
    issues: int


class ImportMostCommonValue(BaseModel):
    value: str | None = None
    count: int


class ImportColumnSummary(BaseModel):
    index: int
    original_name: str
    normalized_name: str
    section: ImportSectionEnum
    detected_type: DetectedTypeEnum
    confidence: float
    issue_count: int
    empty_count: int = 0
    non_empty_count: int = 0
    unique_count: int = 0
    sample_values: list[str] = Field(default_factory=list)
    most_common_values: list[ImportMostCommonValue] = Field(default_factory=list)


class DataImportAnalyzeData(BaseModel):
    import_id: str
    rows: int
    columns: int
    cells: int
    orientation: ImportOrientationEnum
    years: list[int] = Field(default_factory=list)
    detected_survey: DetectedSurvey
    sections: list[ImportSectionSummary] = Field(default_factory=list)
    columns_summary: list[ImportColumnSummary] = Field(default_factory=list)
    total_issues: int
    files_count: int = 0
    resources_count: int = 0


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
    expected_type: Optional[DetectedTypeEnum] = None
    actual_value: Optional[str] = None


class ImportPreviewColumn(BaseModel):
    index: int
    name: str
    section: ImportSectionEnum
    detected_type: DetectedTypeEnum
    issue_count: int

    empty_count: int = 0
    non_empty_count: int = 0
    unique_count: int = 0
    sample_values: list[str] = Field(default_factory=list)
    most_common_values: list[ImportMostCommonValue] = Field(default_factory=list)


class ImportPreviewRow(BaseModel):
    row_index: int
    cells: dict[str, dict[str, Any]]


class DataImportPreviewData(BaseModel):
    import_id: str
    section: ImportSectionEnum
    page: int
    per_page: int
    total_rows: int
    columns: list[ImportPreviewColumn] = Field(default_factory=list)
    rows: list[ImportPreviewRow] = Field(default_factory=list)
    issues_count: int


class DataImportPreviewResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportPreviewData


class DataImportCellPatch(BaseModel):
    row_index: int
    column_index: int
    value: Optional[str]


class DataImportColumnPatch(BaseModel):
    column_index: int
    section: Optional[ImportSectionEnum] = None
    detected_type: Optional[DetectedTypeEnum] = None
    ignored: Optional[bool] = None


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
    search: Optional[str] = None
    replacement: Optional[str] = None


class DataImportPatchWithAnalysisResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportAnalyzeData


class DataImportColumnsConfirmPatch(BaseModel):
    column_indexes: list[int] = Field(default_factory=list)


class DataImportJobSummary(BaseModel):
    import_id: str
    filename: str
    display_name: str | None = None
    size: int
    created_at: Optional[str] = None
    analyzed: bool
    rows: Optional[int] = None
    columns: Optional[int] = None
    total_issues: Optional[int] = None
    detected_survey_name: Optional[str] = None
    detected_survey_year: Optional[int] = None
    files_count: int = 0
    resources_count: int = 0
    years: list[int] = Field(default_factory=list)


class DataImportListResponse(BaseModel):
    success: bool
    detail: str
    data: list[DataImportJobSummary] = Field(default_factory=list)


class DataImportDeleteResponse(BaseModel):
    success: bool
    detail: str


class DataImportNamePatch(BaseModel):
    display_name: str | None = Field(
        default=None,
        max_length=120,
    )


class DataImportNameResponseData(BaseModel):
    import_id: str
    display_name: str | None = None
    filename: str | None = None


class DataImportNameResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportNameResponseData


class ImportIssueGroupSample(BaseModel):
    value: str | None = None
    count: int


class ImportIssueGroup(BaseModel):
    id: str
    code: str
    severity: Literal["warning", "error"]
    message_key: str
    section: ImportSectionEnum
    column_index: int
    column_name: str
    detected_type: DetectedTypeEnum
    expected_type: Optional[DetectedTypeEnum] = None
    count: int
    affected_rows: int
    sample_values: list[ImportIssueGroupSample] = Field(default_factory=list)


class DataImportIssuesData(BaseModel):
    import_id: str
    total_groups: int
    total_issues: int
    blocking_issues: int
    warning_issues: int
    groups: list[ImportIssueGroup] = Field(default_factory=list)


class DataImportIssuesResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportIssuesData


class DataImportResourceSummary(BaseModel):
    resource_id: str
    source_id: str
    filename: str
    sheet_name: str | None = None
    display_name: str
    raw_path: str
    created_at: str | None = None
    rows: int | None = None
    columns: int | None = None
    readable: bool | None = None
    analyzed: bool = False


class DataImportWorkspaceUploadData(BaseModel):
    import_id: str
    display_name: str | None = None

    size: int
    files_count: int
    resources_count: int
    years: list[int] = Field(default_factory=list)

    resources: list[DataImportResourceSummary] = Field(default_factory=list)

    added_resources: list[DataImportResourceSummary] = Field(default_factory=list)


class DataImportWorkspaceUploadResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportWorkspaceUploadData


class DataImportResourcesData(BaseModel):
    import_id: str
    resources: list[DataImportResourceSummary] = Field(default_factory=list)


class DataImportResourcesResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportResourcesData


class DataImportYearsPatch(BaseModel):
    years: list[int] = Field(min_length=1)

    @field_validator("years")
    @classmethod
    def validate_years(
        cls,
        years: list[int],
    ) -> list[int]:
        normalized_years = sorted(set(years))

        for year in normalized_years:
            if not 1000 <= year <= 9999:
                raise ValueError("Each year must contain exactly four digits")

        return normalized_years


class DataImportYearsResponseData(BaseModel):
    import_id: str
    years: list[int] = Field(default_factory=list)


class DataImportYearsResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportYearsResponseData


class DataImportCommitData(BaseModel):
    import_id: str
    status: Literal["not_implemented"]


class DataImportCommitResponse(BaseModel):
    success: bool
    detail: str
    data: DataImportCommitData

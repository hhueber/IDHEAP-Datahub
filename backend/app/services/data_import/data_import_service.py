# Sert a gerer le processus d'importation de données.
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import uuid


from app.schemas.data_import import ImportOrientationEnum, ImportSectionEnum
from app.services.data_import.data_import_detection_service import (
    analyze_columns,
    build_analysis_payload,
    detect_orientation,
    transpose_with_first_row_as_header,
)
from app.services.data_import.data_import_issue_service import detect_issues_vectorized
from app.services.data_import.data_import_normalizer_service import normalize_dataframe_values
from app.services.data_import.data_import_preview_service import build_preview_payload
from app.services.data_import.data_import_reader_service import read_import_file
from app.services.data_import.data_import_storage_service import (
    delete_import_dir,
    get_import_dir,
    read_analysis,
    read_frame,
    read_issues,
    read_json,
    read_metadata,
    UPLOAD_DIR,
    write_analysis,
    write_frame,
    write_issues,
    write_metadata,
)
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession


async def save_import_upload(file: UploadFile) -> dict[str, Any]:
    import_id = str(uuid.uuid4())
    filename = file.filename or "import"
    suffix = Path(filename).suffix.lower()

    if suffix not in {".csv", ".xlsx", ".xls"}:
        raise ValueError("Unsupported file format")

    import_dir = UPLOAD_DIR / import_id
    import_dir.mkdir(parents=True, exist_ok=True)

    raw_path = import_dir / f"raw{suffix}"

    content = await file.read()
    raw_path.write_bytes(content)

    metadata = {
        "import_id": import_id,
        "filename": filename,
        "size": len(content),
        "raw_path": str(raw_path),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    write_metadata(import_dir, metadata)

    return {
        "import_id": import_id,
        "filename": filename,
        "size": len(content),
    }


async def list_import_jobs() -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []

    for import_dir in sorted(UPLOAD_DIR.iterdir(), reverse=True):
        if not import_dir.is_dir():
            continue

        metadata_path = import_dir / "metadata.json"
        if not metadata_path.exists():
            continue

        metadata = read_json(metadata_path)
        analysis_path = import_dir / "analysis.json"

        analysis = read_json(analysis_path) if analysis_path.exists() else None
        detected_survey = analysis.get("detected_survey") if analysis else {}

        jobs.append(
            {
                "import_id": metadata.get("import_id"),
                "filename": metadata.get("filename"),
                "size": int(metadata.get("size") or 0),
                "created_at": metadata.get("created_at"),
                "analyzed": analysis is not None,
                "rows": analysis.get("rows") if analysis else None,
                "columns": analysis.get("columns") if analysis else None,
                "total_issues": analysis.get("total_issues") if analysis else None,
                "detected_survey_name": detected_survey.get("name"),
                "detected_survey_year": detected_survey.get("year"),
            }
        )

    return jobs


async def get_import_summary(import_id: str) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    analysis_path = import_dir / "analysis.json"

    if not analysis_path.exists():
        raise ValueError("Import has not been analyzed yet")

    return read_analysis(import_dir)


async def delete_import_job(import_id: str) -> None:
    delete_import_dir(import_id)


async def analyze_import_file(
    db: AsyncSession,
    *,
    import_id: str,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    metadata = read_metadata(import_dir)

    df = read_import_file(Path(metadata["raw_path"]))

    orientation = detect_orientation(df)

    if orientation == ImportOrientationEnum.transposed:
        df = transpose_with_first_row_as_header(df)

    df = normalize_dataframe_values(df)

    columns_summary = analyze_columns(df)
    issues_by_column = detect_issues_vectorized(df, columns_summary)

    analysis = build_analysis_payload(
        import_id=import_id,
        df=df,
        orientation=orientation.value,
        columns_summary=columns_summary,
        issues_by_column=issues_by_column,
    )

    write_frame(import_dir, df)
    write_analysis(import_dir, analysis)
    write_issues(import_dir, issues_by_column)

    return analysis


async def preview_import_section(
    *,
    import_id: str,
    section: ImportSectionEnum,
    page: int,
    per_page: int,
    issues_only: bool,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)

    return build_preview_payload(
        import_id=import_id,
        section=section,
        page=page,
        per_page=per_page,
        issues_only=issues_only,
        df=read_frame(import_dir),
        analysis=read_analysis(import_dir),
        issues_by_column=read_issues(import_dir),
    )

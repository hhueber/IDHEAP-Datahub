# Sert a gerer le processus d'importation de données.
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import uuid


from app.schemas.data_import import ImportOrientationEnum, ImportSectionEnum
from app.services.data_import.data_import_column_profile_service import (
    columns_have_valid_profiles,
    enrich_columns_with_profiles,
)
from app.services.data_import.data_import_detection_service import (
    analyze_columns,
    build_analysis_payload,
    detect_orientation,
    transpose_with_first_row_as_header,
)
from app.services.data_import.data_import_issue_group_service import build_issue_groups
from app.services.data_import.data_import_issue_service import detect_issues_vectorized
from app.services.data_import.data_import_normalizer_service import normalize_dataframe_values
from app.services.data_import.data_import_preview_service import build_preview_payload
from app.services.data_import.data_import_reader_service import read_import_file
from app.services.data_import.data_import_resource_service import add_upload_to_import
from app.services.data_import.data_import_storage_service import (
    delete_import_dir,
    extract_sheet_convert_to_csv,
    get_import_dir,
    invalidate_import_workspace,
    read_analysis,
    read_frame,
    read_issues,
    read_json,
    read_metadata,
    UPLOAD_DIR,
    write_analysis,
    write_frame,
    write_issues,
    write_json,
    write_metadata,
)
from app.services.data_import.data_import_workspace_service import build_import_workspace, get_workspace_dir
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession


async def save_import_upload(file: UploadFile) -> dict[str, Any]:
    result = await create_import_workspace(files=[file])

    first_resource = result["resources"][0]

    return {
        "import_id": result["import_id"],
        "filename": first_resource["filename"],
        "display_name": result["display_name"],
        "size": result["size"],
    }


async def list_import_jobs() -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []

    for import_dir in sorted(
        UPLOAD_DIR.iterdir(),
        reverse=True,
    ):
        if not import_dir.is_dir():
            continue

        metadata_path = import_dir / "metadata.json"

        if not metadata_path.exists():
            continue

        metadata = read_json(metadata_path)

        sources = metadata.get("sources") or []
        resources = metadata.get("resources") or []

        workspace_dir = import_dir / "workspace"

        analysis_path = workspace_dir / "analysis.json"
        frame_path = workspace_dir / "frame.pkl"
        issues_path = workspace_dir / "issues.json"

        analyzed = analysis_path.exists() and frame_path.exists() and issues_path.exists()

        analysis = read_json(analysis_path) if analyzed else None

        detected_survey = analysis.get("detected_survey") or {} if analysis else {}

        fallback_filename = sources[0].get("filename") if sources else "Import"

        jobs.append(
            {
                "import_id": metadata.get("import_id"),
                "filename": fallback_filename,
                "display_name": metadata.get("display_name"),
                "size": sum(int(source.get("size") or 0) for source in sources),
                "created_at": metadata.get("created_at"),
                "analyzed": analyzed,
                "rows": analysis.get("rows") if analysis else None,
                "columns": (analysis.get("columns") if analysis else None),
                "total_issues": (analysis.get("total_issues") if analysis else None),
                "detected_survey_name": detected_survey.get("name"),
                "detected_survey_year": detected_survey.get("year"),
                "files_count": len(sources),
                "resources_count": len(resources),
            }
        )

    return jobs


async def update_import_display_name(
    import_id: str,
    display_name: str | None,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    metadata = read_metadata(import_dir)

    clean_display_name = display_name.strip() if display_name else None

    if clean_display_name == "":
        clean_display_name = None

    if clean_display_name and len(clean_display_name) > 120:
        raise ValueError("Dataset name is too long")

    metadata["display_name"] = clean_display_name
    write_metadata(import_dir, metadata)

    return {
        "import_id": metadata.get("import_id"),
        "filename": metadata.get("filename"),
        "display_name": metadata.get("display_name"),
    }


async def get_import_summary(
    import_id: str,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    workspace_dir = get_workspace_dir(import_dir)

    analysis_path = workspace_dir / "analysis.json"

    if not analysis_path.exists():
        raise ValueError("Import has not been analyzed yet")

    return ensure_analysis_has_column_profiles(import_id)


async def delete_import_job(import_id: str) -> None:
    delete_import_dir(import_id)


async def analyze_import_file(
    db: AsyncSession,
    *,
    import_id: str,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)

    df, row_origins = build_import_workspace(import_dir)

    orientation = detect_orientation(df)

    if len(read_metadata(import_dir).get("resources") or []) == 1:
        if orientation == ImportOrientationEnum.transposed:
            df = transpose_with_first_row_as_header(df)
    else:
        orientation = ImportOrientationEnum.normal

    df = normalize_dataframe_values(df)

    columns_summary = analyze_columns(df)

    issues_by_column = detect_issues_vectorized(
        df,
        columns_summary,
    )

    analysis = build_analysis_payload(
        import_id=import_id,
        df=df,
        orientation=orientation.value,
        columns_summary=columns_summary,
        issues_by_column=issues_by_column,
    )

    analysis["columns_summary"] = enrich_columns_with_profiles(
        df,
        analysis.get("columns_summary") or [],
    )

    metadata = read_metadata(import_dir)

    analysis["files_count"] = len(metadata.get("sources") or [])
    analysis["resources_count"] = len(metadata.get("resources") or [])

    write_frame(import_dir, df)
    write_analysis(import_dir, analysis)
    write_issues(import_dir, issues_by_column)

    workspace_dir = get_workspace_dir(import_dir)

    write_json(
        workspace_dir / "row_origins.json",
        row_origins,
    )

    metadata["analyzed"] = True
    metadata["updated_at"] = datetime.now(timezone.utc).isoformat()

    write_metadata(import_dir, metadata)

    return analysis


def mark_resource_as_analyzed(
    *,
    import_dir: Path,
    resource_id: str,
    analyzed: bool,
) -> None:
    metadata = read_metadata(import_dir)

    resource = next(
        (item for item in metadata.get("resources") or [] if item.get("resource_id") == resource_id),
        None,
    )

    if resource is None:
        raise ValueError("Import resource not found")

    resource["analyzed"] = analyzed
    metadata["updated_at"] = datetime.now(timezone.utc).isoformat()

    write_metadata(import_dir, metadata)


async def analyze_all_import_resources(
    db: AsyncSession,
    *,
    import_id: str,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    metadata = read_metadata(import_dir)

    results: list[dict[str, Any]] = []

    for resource in metadata.get("resources") or []:
        resource_id = str(resource["resource_id"])

        analysis = await analyze_import_file(
            db,
            import_id=import_id,
            resource_id=resource_id,
        )

        results.append(
            {
                "resource_id": resource_id,
                "display_name": resource.get("display_name"),
                "filename": resource.get("filename"),
                "sheet_name": resource.get("sheet_name"),
                "rows": analysis["rows"],
                "columns": analysis["columns"],
                "total_issues": analysis["total_issues"],
            }
        )

    return {
        "import_id": import_id,
        "resources_count": len(results),
        "rows": sum(item["rows"] for item in results),
        "cells": sum(item["rows"] * item["columns"] for item in results),
        "total_issues": sum(item["total_issues"] for item in results),
        "resources": results,
    }


def ensure_analysis_has_column_profiles(
    import_id: str,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)

    df = read_frame(import_dir)
    analysis = read_analysis(import_dir)

    columns_summary = analysis.get("columns_summary") or []

    if columns_have_valid_profiles(
        df=df,
        columns_summary=columns_summary,
    ):
        return analysis

    analysis["columns_summary"] = enrich_columns_with_profiles(
        df,
        columns_summary,
    )

    write_analysis(import_dir, analysis)

    return analysis


async def preview_import_section(
    *,
    import_id: str,
    section: ImportSectionEnum,
    page: int,
    per_page: int,
    issues_only: bool,
    search: str | None = None,
    detected_type: str | None = None,
    column_index: int | None = None,
    sort_column_index: int | None = None,
    sort_direction: str = "asc",
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)

    return build_preview_payload(
        import_id=import_id,
        section=section,
        page=page,
        per_page=per_page,
        issues_only=issues_only,
        search=search,
        detected_type=detected_type,
        column_index=column_index,
        sort_column_index=sort_column_index,
        sort_direction=sort_direction,
        df=read_frame(import_dir),
        analysis=ensure_analysis_has_column_profiles(import_id),
        issues_by_column=read_issues(import_dir),
    )


async def get_import_issue_groups(
    import_id: str,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)

    analysis = ensure_analysis_has_column_profiles(import_id)
    issues_by_column = read_issues(import_dir)

    return build_issue_groups(
        import_id=import_id,
        analysis=analysis,
        issues_by_column=issues_by_column,
    )


async def create_import_workspace(
    *,
    files: list[UploadFile],
    display_name: str | None = None,
) -> dict[str, Any]:
    if not files:
        raise ValueError("At least one file is required")

    import_id = str(uuid.uuid4())
    import_dir = UPLOAD_DIR / import_id

    import_dir.mkdir(
        parents=True,
        exist_ok=False,
    )

    now = datetime.now(timezone.utc).isoformat()

    clean_display_name = display_name.strip() if display_name else None

    if clean_display_name == "":
        clean_display_name = None

    metadata: dict[str, Any] = {
        "import_id": import_id,
        "display_name": clean_display_name,
        "created_at": now,
        "updated_at": now,
        "analyzed": False,
        "sources": [],
        "resources": [],
    }

    write_metadata(import_dir, metadata)

    try:
        for file in files:
            source, resources = await add_upload_to_import(
                import_dir=import_dir,
                file=file,
            )

            metadata["sources"].append(source)
            metadata["resources"].extend(resources)

        metadata["updated_at"] = datetime.now(timezone.utc).isoformat()

        write_metadata(import_dir, metadata)

    except Exception:
        delete_import_dir(import_id)
        raise

    return build_workspace_upload_payload(metadata)


async def add_files_to_import_workspace(
    *,
    import_id: str,
    files: list[UploadFile],
) -> dict[str, Any]:
    if not files:
        raise ValueError("At least one file is required")

    import_dir = get_import_dir(import_id)
    metadata = read_metadata(import_dir)

    new_resources: list[dict[str, Any]] = []

    for file in files:
        source, resources = await add_upload_to_import(
            import_dir=import_dir,
            file=file,
        )

        metadata.setdefault("sources", []).append(source)
        metadata.setdefault("resources", []).extend(resources)
        new_resources.extend(resources)

    if not metadata.get("active_resource_id") and new_resources:
        metadata["active_resource_id"] = new_resources[0]["resource_id"]

    metadata["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_metadata(import_dir, metadata)
    invalidate_import_workspace(import_dir)

    return build_workspace_upload_payload(
        metadata,
        added_resources=new_resources,
    )


def build_workspace_upload_payload(
    metadata: dict[str, Any],
    *,
    added_resources: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    sources = metadata.get("sources") or []
    resources = metadata.get("resources") or []

    return {
        "import_id": metadata["import_id"],
        "display_name": metadata.get("display_name"),
        "size": sum(int(source.get("size") or 0) for source in sources),
        "files_count": len(sources),
        "resources_count": len(resources),
        "resources": resources,
        "added_resources": added_resources or resources,
    }


def clean_display_name(display_name: str | None) -> str | None:
    if not display_name:
        return None

    clean_value = display_name.strip()

    return clean_value or None


async def list_import_resources(
    import_id: str,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    metadata = read_metadata(import_dir)

    resources: list[dict[str, Any]] = []

    for resource in metadata.get("resources") or []:
        resource_id = str(resource["resource_id"])
        raw_path = import_dir / str(resource["raw_path"])

        rows: int | None = None
        columns: int | None = None
        readable = False

        if raw_path.exists():
            try:
                df = read_import_file(raw_path)

                rows = int(df.shape[0])
                columns = int(df.shape[1])
                readable = True
            except Exception:
                readable = False

        resources.append(
            {
                **resource,
                "resource_id": resource_id,
                "rows": rows,
                "columns": columns,
                "readable": readable,
            }
        )

    return {
        "import_id": import_id,
        "resources": metadata.get("resources") or [],
    }


async def set_active_import_resource(
    *,
    import_id: str,
    resource_id: str,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    metadata = read_metadata(import_dir)

    resource = next(
        (item for item in metadata.get("resources") or [] if item.get("resource_id") == resource_id),
        None,
    )

    if resource is None:
        raise ValueError("Import resource not found")

    metadata["active_resource_id"] = resource_id
    metadata["updated_at"] = datetime.now(timezone.utc).isoformat()

    write_metadata(import_dir, metadata)

    return {
        "import_id": import_id,
        "active_resource_id": resource_id,
        "resource": resource,
    }

# Sert a appliquer les modifications sur les données importées et recalculer les analyses et issues associées.
from pathlib import Path
from typing import Any


from app.schemas.data_import import (
    DataImportCellPatch,
    DataImportColumnPatch,
    DataImportColumnTransformPatch,
    ImportSectionEnum,
)
from app.services.data_import.data_import_column_profile_service import enrich_columns_with_profiles
from app.services.data_import.data_import_detection_service import build_sections_summary, detect_column_type
from app.services.data_import.data_import_issue_service import (
    detect_issues_vectorized,
    detect_single_column_issues_vectorized,
)
from app.services.data_import.data_import_storage_service import (
    get_import_dir,
    read_analysis,
    read_frame,
    read_issues,
    write_analysis,
    write_frame,
    write_issues,
)
from app.services.data_import.data_import_transform_service import apply_column_transform
import pandas as pd


async def patch_import_cell(
    *,
    import_id: str,
    payload: DataImportCellPatch,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    df = read_frame(import_dir)

    df.iat[payload.row_index, payload.column_index] = payload.value

    return recalculate_after_column_change(
        import_dir=import_dir,
        df=df,
        column_index=payload.column_index,
        redetect_type=False,
    )


async def patch_import_column(
    *,
    import_id: str,
    payload: DataImportColumnPatch,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    df = read_frame(import_dir)

    analysis = read_analysis(import_dir)

    target_column = get_column_summary(
        analysis["columns_summary"],
        payload.column_index,
    )

    if payload.ignored is True:
        target_column["section"] = ImportSectionEnum.ignored.value

    if payload.section is not None:
        target_column["section"] = payload.section.value
        target_column["section_source"] = "user_override"
        target_column["section_confidence"] = 1.0
        target_column["section_needs_user_confirmation"] = False

    if payload.detected_type is not None:
        target_column["detected_type"] = payload.detected_type.value
        target_column["confidence"] = 1.0

    write_analysis(import_dir, analysis)

    return recalculate_after_column_change(
        import_dir=import_dir,
        df=df,
        column_index=payload.column_index,
        redetect_type=False,
        analysis=analysis,
    )


async def patch_import_column_transform(
    *,
    import_id: str,
    payload: DataImportColumnTransformPatch,
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    df = read_frame(import_dir)

    column_name = df.columns[payload.column_index]

    df[column_name] = apply_column_transform(
        series=df[column_name],
        action=payload.action,
        search=payload.search,
        replacement=payload.replacement,
    )

    return recalculate_after_column_change(
        import_dir=import_dir,
        df=df,
        column_index=payload.column_index,
        redetect_type=True,
    )


def recalculate_after_column_change(
    *,
    import_dir: Path,
    df: pd.DataFrame,
    column_index: int,
    redetect_type: bool,
    analysis: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if analysis is None:
        analysis = read_analysis(import_dir)
    issues_by_column = read_issues(import_dir)

    target_column = get_column_summary(
        analysis["columns_summary"],
        column_index,
    )

    if redetect_type:
        series = df.iloc[:, column_index].astype("string")
        detected_type, confidence = detect_column_type(series)

        target_column["detected_type"] = detected_type.value
        target_column["confidence"] = confidence

    analysis["columns_summary"] = enrich_columns_with_profiles(
        df,
        analysis["columns_summary"],
    )

    target_column = get_column_summary(
        analysis["columns_summary"],
        column_index,
    )

    column_issues = detect_single_column_issues_vectorized(
        df=df,
        column_summary=target_column,
    )

    issues_by_column[str(column_index)] = column_issues
    target_column["issue_count"] = len(column_issues)

    analysis["total_issues"] = sum(len(items) for items in issues_by_column.values())
    analysis["sections"] = build_sections_summary(
        df=df,
        columns_summary=analysis["columns_summary"],
        issues_by_column=issues_by_column,
    )

    write_frame(import_dir, df)
    write_analysis(import_dir, analysis)
    write_issues(import_dir, issues_by_column)

    return analysis


def get_column_summary(
    columns_summary: list[dict[str, Any]],
    column_index: int,
) -> dict[str, Any]:
    return next(column for column in columns_summary if int(column["index"]) == column_index)


async def confirm_import_columns(
    *,
    import_id: str,
    column_indexes: list[int],
) -> dict[str, Any]:
    import_dir = get_import_dir(import_id)
    df = read_frame(import_dir)
    analysis = read_analysis(import_dir)

    selected_indexes = {int(index) for index in column_indexes}

    if not selected_indexes:
        return analysis

    for column in analysis.get("columns_summary") or []:
        column_index = int(column.get("index"))

        if column_index not in selected_indexes:
            continue

        column["section_source"] = "user_confirmed"
        column["section_confidence"] = 1.0
        column["section_needs_user_confirmation"] = False

    analysis["columns_summary"] = enrich_columns_with_profiles(
        df,
        analysis["columns_summary"],
    )

    issues_by_column = detect_issues_vectorized(
        df,
        analysis["columns_summary"],
    )

    for column in analysis["columns_summary"]:
        column["issue_count"] = len(issues_by_column.get(str(column["index"]), []))

    analysis["total_issues"] = sum(len(issues) for issues in issues_by_column.values())

    analysis["sections"] = build_sections_summary(
        df=df,
        columns_summary=analysis["columns_summary"],
        issues_by_column=issues_by_column,
    )

    write_frame(import_dir, df)
    write_analysis(import_dir, analysis)
    write_issues(import_dir, issues_by_column)

    return analysis

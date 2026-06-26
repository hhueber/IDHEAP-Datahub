#  Sert a construire la prévisualisation des données importées.
from typing import Any


from app.schemas.data_import import ImportSectionEnum
import pandas as pd


def build_preview_payload(
    *,
    import_id: str,
    section: ImportSectionEnum,
    page: int,
    per_page: int,
    issues_only: bool,
    df: pd.DataFrame,
    analysis: dict[str, Any],
    issues_by_column: dict[str, list[dict[str, Any]]],
    search: str | None = None,
    detected_type: str | None = None,
    column_index: int | None = None,
    sort_column_index: int | None = None,
    sort_direction: str = "asc",
) -> dict[str, Any]:
    clean_search = search.strip().lower() if search else ""
    clean_detected_type = detected_type if detected_type and detected_type != "all" else None
    clean_sort_direction = "desc" if sort_direction == "desc" else "asc"

    columns_summary = _filter_columns(
        analysis=analysis,
        section=section.value,
        detected_type=clean_detected_type,
        column_index=column_index,
    )

    column_indices = [int(column["index"]) for column in columns_summary]
    issue_lookup = _build_issue_lookup(issues_by_column)

    row_indices = _filter_row_indices(
        df=df,
        column_indices=column_indices,
        issue_lookup=issue_lookup,
        issues_only=issues_only,
        search=clean_search,
    )

    row_indices = _sort_row_indices(
        df=df,
        analysis=analysis,
        row_indices=row_indices,
        sort_column_index=sort_column_index,
        sort_direction=clean_sort_direction,
    )

    total_rows = len(row_indices)
    start = (page - 1) * per_page
    end = start + per_page
    page_row_indices = row_indices[start:end]

    return {
        "import_id": import_id,
        "section": section.value,
        "page": page,
        "per_page": per_page,
        "total_rows": total_rows,
        "columns": [_build_preview_column(column) for column in columns_summary],
        "rows": [
            _build_preview_row(
                df=df,
                row_index=row_index,
                column_indices=column_indices,
                issue_lookup=issue_lookup,
            )
            for row_index in page_row_indices
        ],
        "issues_count": _count_issues_for_rows(
            row_indices=row_indices,
            column_indices=column_indices,
            issue_lookup=issue_lookup,
        ),
    }


def _filter_columns(
    *,
    analysis: dict[str, Any],
    section: str,
    detected_type: str | None,
    column_index: int | None,
) -> list[dict[str, Any]]:
    columns_summary = analysis.get("columns_summary") or []

    columns = [column for column in columns_summary if column.get("section") == section]

    if detected_type:
        columns = [column for column in columns if column.get("detected_type") == detected_type]

    if column_index is not None:
        columns = [column for column in columns if int(column.get("index")) == column_index]

    return columns


def _build_preview_column(column: dict[str, Any]) -> dict[str, Any]:
    return {
        "index": int(column.get("index")),
        "name": column.get("original_name") or column.get("normalized_name") or "",
        "section": column.get("section"),
        "detected_type": column.get("detected_type"),
        "issue_count": int(column.get("issue_count") or 0),
    }


def _build_issue_lookup(
    issues_by_column: dict[str, list[dict[str, Any]]],
) -> dict[tuple[int, int], dict[str, Any]]:
    lookup: dict[tuple[int, int], dict[str, Any]] = {}

    for raw_column_index, issues in issues_by_column.items():
        try:
            fallback_column_index = int(raw_column_index)
        except (TypeError, ValueError):
            fallback_column_index = -1

        for issue in issues:
            row_index = int(issue.get("row_index"))
            column_index = int(issue.get("column_index", fallback_column_index))
            lookup[(row_index, column_index)] = issue

    return lookup


def _filter_row_indices(
    *,
    df: pd.DataFrame,
    column_indices: list[int],
    issue_lookup: dict[tuple[int, int], dict[str, Any]],
    issues_only: bool,
    search: str,
) -> list[int]:
    if not column_indices:
        return []

    row_indices = list(range(len(df)))

    if issues_only:
        row_indices = [
            row_index
            for row_index in row_indices
            if _row_has_issue(
                row_index=row_index,
                column_indices=column_indices,
                issue_lookup=issue_lookup,
            )
        ]

    if search:
        row_indices = [
            row_index
            for row_index in row_indices
            if _row_matches_search(
                df=df,
                row_index=row_index,
                column_indices=column_indices,
                search=search,
            )
        ]

    return row_indices


def _row_has_issue(
    *,
    row_index: int,
    column_indices: list[int],
    issue_lookup: dict[tuple[int, int], dict[str, Any]],
) -> bool:
    return any((row_index, column_index) in issue_lookup for column_index in column_indices)


def _row_matches_search(
    *,
    df: pd.DataFrame,
    row_index: int,
    column_indices: list[int],
    search: str,
) -> bool:
    for column_index in column_indices:
        value = df.iat[row_index, column_index]

        if search in _stringify_value(value).lower():
            return True

    return False


def _sort_row_indices(
    *,
    df: pd.DataFrame,
    analysis: dict[str, Any],
    row_indices: list[int],
    sort_column_index: int | None,
    sort_direction: str,
) -> list[int]:
    if sort_column_index is None:
        return row_indices

    if sort_column_index < 0 or sort_column_index >= len(df.columns):
        return row_indices

    detected_type = _get_detected_type_for_column(
        analysis=analysis,
        column_index=sort_column_index,
    )

    reverse = sort_direction == "desc"

    return sorted(
        row_indices,
        key=lambda row_index: _get_sort_key(
            df=df,
            row_index=row_index,
            column_index=sort_column_index,
            detected_type=detected_type,
        ),
        reverse=reverse,
    )


def _get_detected_type_for_column(
    *,
    analysis: dict[str, Any],
    column_index: int,
) -> str | None:
    for column in analysis.get("columns_summary") or []:
        if int(column.get("index")) == column_index:
            return column.get("detected_type")

    return None


def _get_sort_key(
    *,
    df: pd.DataFrame,
    row_index: int,
    column_index: int,
    detected_type: str | None,
) -> tuple[int, float | str]:
    value = df.iat[row_index, column_index]

    if _is_empty(value):
        return (1, "")

    if detected_type in {"integer", "float"}:
        numeric_value = pd.to_numeric(value, errors="coerce")

        if pd.isna(numeric_value):
            return (1, "")

        return (0, float(numeric_value))

    if detected_type in {"date", "datetime"}:
        datetime_value = pd.to_datetime(value, errors="coerce")

        if pd.isna(datetime_value):
            return (1, "")

        return (0, float(datetime_value.timestamp()))

    return (0, _stringify_value(value).lower())


def _count_issues_for_rows(
    *,
    row_indices: list[int],
    column_indices: list[int],
    issue_lookup: dict[tuple[int, int], dict[str, Any]],
) -> int:
    return sum(
        1 for row_index in row_indices for column_index in column_indices if (row_index, column_index) in issue_lookup
    )


def _build_preview_row(
    *,
    df: pd.DataFrame,
    row_index: int,
    column_indices: list[int],
    issue_lookup: dict[tuple[int, int], dict[str, Any]],
) -> dict[str, Any]:
    cells: dict[str, dict[str, Any]] = {}

    for column_index in column_indices:
        value = df.iat[row_index, column_index]
        issue = issue_lookup.get((row_index, column_index))

        cells[str(column_index)] = {
            "value": None if _is_empty(value) else _stringify_value(value),
            "issue": issue,
        }

    return {
        "row_index": row_index,
        "cells": cells,
    }


def _is_empty(value: Any) -> bool:
    if value is None:
        return True

    try:
        if pd.isna(value):
            return True
    except TypeError:
        return False

    return str(value).strip() == ""


def _stringify_value(value: Any) -> str:
    if _is_empty(value):
        return ""

    return str(value)

#  Sert a construire la prévisualisation des données importées.
from typing import Any


from app.schemas.data_import import ImportSectionEnum
from app.services.data_import.data_import_normalizer_service import TEXT_EMPTY_VALUES
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
) -> dict[str, Any]:
    selected_columns = [column for column in analysis["columns_summary"] if column["section"] == section.value]

    if not selected_columns:
        selected_columns = [
            column
            for column in analysis["columns_summary"]
            if column["section"] == ImportSectionEnum.unclassified.value
        ]

    selected_indexes = [int(column["index"]) for column in selected_columns]

    if issues_only:
        row_indexes = get_issue_row_indexes(
            issues_by_column=issues_by_column,
            selected_indexes=selected_indexes,
        )

        total_rows = len(row_indexes)
        start = (page - 1) * per_page
        visible_indexes = row_indexes[start : start + per_page]

        page_df = df.iloc[visible_indexes, selected_indexes]
        real_row_indexes = visible_indexes
    else:
        total_rows = int(df.shape[0])
        start = (page - 1) * per_page
        end = start + per_page

        page_df = df.iloc[start:end, selected_indexes]
        real_row_indexes = list(range(start, min(end, total_rows)))

    preview_columns = [
        {
            "index": column["index"],
            "name": column["original_name"],
            "section": column["section"],
            "detected_type": column["detected_type"],
            "issue_count": column["issue_count"],
        }
        for column in selected_columns
    ]

    issue_lookup = build_issue_lookup(
        issues_by_column=issues_by_column,
        selected_indexes=selected_indexes,
        row_indexes=real_row_indexes,
    )

    rows = build_preview_rows(
        page_df=page_df,
        selected_indexes=selected_indexes,
        real_row_indexes=real_row_indexes,
        issue_lookup=issue_lookup,
    )

    return {
        "import_id": import_id,
        "section": section.value,
        "page": page,
        "per_page": per_page,
        "total_rows": total_rows,
        "columns": preview_columns,
        "rows": rows,
        "issues_count": sum(int(column["issue_count"]) for column in selected_columns),
    }


def get_issue_row_indexes(
    *,
    issues_by_column: dict[str, list[dict[str, Any]]],
    selected_indexes: list[int],
) -> list[int]:
    issue_frames = []

    for column_index in selected_indexes:
        issues = issues_by_column.get(str(column_index), [])
        if issues:
            issue_frames.append(pd.DataFrame(issues)["row_index"])

    if not issue_frames:
        return []

    unique_rows = pd.concat(issue_frames).drop_duplicates().sort_values()

    return unique_rows.astype(int).tolist()


def build_issue_lookup(
    *,
    issues_by_column: dict[str, list[dict[str, Any]]],
    selected_indexes: list[int],
    row_indexes: list[int],
) -> dict[tuple[int, int], dict[str, Any]]:
    if not row_indexes:
        return {}

    visible_rows = set(row_indexes)
    lookup: dict[tuple[int, int], dict[str, Any]] = {}

    for column_index in selected_indexes:
        issues = issues_by_column.get(str(column_index), [])

        for issue in issues:
            row_index = int(issue["row_index"])
            if row_index in visible_rows:
                lookup[(row_index, column_index)] = issue

    return lookup


def build_preview_rows(
    *,
    page_df: pd.DataFrame,
    selected_indexes: list[int],
    real_row_indexes: list[int],
    issue_lookup: dict[tuple[int, int], dict[str, Any]],
) -> list[dict[str, Any]]:
    values = page_df.astype("string").fillna("").to_numpy(dtype=object)

    rows: list[dict[str, Any]] = []

    for local_row_index, real_row_index in enumerate(real_row_indexes):
        cells = {}

        for local_col_index, column_index in enumerate(selected_indexes):
            value = values[local_row_index, local_col_index]

            cells[str(column_index)] = {
                "value": None if str(value).lower() in TEXT_EMPTY_VALUES else str(value),
                "issue": issue_lookup.get((real_row_index, column_index)),
            }

        rows.append(
            {
                "row_index": int(real_row_index),
                "cells": cells,
            }
        )

    return rows

# Sert a detecter les problemes dans les données importées, actuellement on ce concentre sur les type principalement.
from typing import Any


from app.schemas.data_import import DetectedTypeEnum
from app.services.data_import.data_import_detection_service import build_valid_type_mask
from app.services.data_import.data_import_normalizer_service import TEXT_EMPTY_VALUES
import pandas as pd


def detect_issues_vectorized(
    df: pd.DataFrame,
    columns_summary: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    issues_by_column: dict[str, list[dict[str, Any]]] = {}

    for column_summary in columns_summary:
        column_issues = detect_single_column_issues_vectorized(
            df=df,
            column_summary=column_summary,
        )

        issues_by_column[str(column_summary["index"])] = column_issues

    return issues_by_column


def detect_single_column_issues_vectorized(
    *,
    df: pd.DataFrame,
    column_summary: dict[str, Any],
) -> list[dict[str, Any]]:
    column_index = int(column_summary["index"])
    column_name = df.columns[column_index]
    detected_type = DetectedTypeEnum(column_summary["detected_type"])
    confidence = float(column_summary["confidence"])

    if confidence < 0.99:
        return []

    if detected_type in {
        DetectedTypeEnum.text,
        DetectedTypeEnum.empty,
        DetectedTypeEnum.mixed,
    }:
        return []

    series = df[column_name].astype("string")
    clean = series.fillna("").str.strip()

    non_empty_mask = ~clean.str.lower().isin(TEXT_EMPTY_VALUES)
    valid_mask = build_valid_type_mask(clean, detected_type)

    invalid_mask = non_empty_mask & ~valid_mask

    if not invalid_mask.any():
        return []

    invalid_values = clean[invalid_mask]

    return [
        {
            "row_index": int(row_index),
            "column_index": column_index,
            "code": "TYPE_MISMATCH",
            "severity": "error",
            "message_key": "dataImport.issues.typeMismatch",
            "expected_type": detected_type.value,
            "actual_value": str(value),
        }
        for row_index, value in invalid_values.items()
    ]

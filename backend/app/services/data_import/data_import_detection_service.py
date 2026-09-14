# Sert a detecter les caracteristiques des données importées
from dataclasses import dataclass
from typing import Any
import re


from app.schemas.data_import import DetectedSurvey, DetectedTypeEnum, ImportOrientationEnum, ImportSectionEnum
from app.services.data_import.data_import_normalizer_service import clean_series, normalize_name, TEXT_EMPTY_VALUES
import numpy as np
import pandas as pd


# TODO: modification de la logique de detection par la suite actuellement trop rigide sur les data existantes.


QUESTION_RE = re.compile(
    r"^([A-Za-z]+)?(\d{2,4})?[_-]?Q\d+[A-Za-z0-9_]*$",
    re.IGNORECASE,
)

SURVEY_RE = re.compile(
    r"^([A-Za-z]+)(\d{2,4})[_-]?Q",
    re.IGNORECASE,
)

COMMUNE_HINTS = {
    "bfs",
    "ofs",
    "commune",
    "gemeinde",
    "municipality",
    "gemid",
    "gemidname",
    "gemeinde_2023",
    "bfs_2023",
}

METADATA_HINTS = {
    "startdate",
    "enddate",
    "recordeddate",
    "duration",
    "duration_in_seconds",
    "progress",
    "finished",
    "userlanguage",
    "mode",
    "participation",
    "teilnahme",
}

QUESTION_LABEL_NAMES = {
    "label",
    "question",
    "question_label",
    "text_fr",
    "text_de",
    "text_it",
    "text_ro",
    "text_en",
}

BOOLEAN_VALUES = {
    "true",
    "false",
    "yes",
    "no",
    "oui",
    "non",
    "ja",
    "nein",
    "1",
    "0",
}


@dataclass
class SectionDetectionResult:
    section: ImportSectionEnum
    confidence: float
    source: str
    reason: str
    needs_user_confirmation: bool


def detect_orientation(df: pd.DataFrame) -> ImportOrientationEnum:
    column_score = score_header_list([str(column) for column in df.columns])

    if df.shape[1] == 0:
        return ImportOrientationEnum.unknown

    first_col_values = df.iloc[: min(200, len(df)), 0].astype("string").dropna().tolist()

    first_col_score = score_header_list(first_col_values)

    if first_col_score > column_score * 1.5 and first_col_score > 5:
        return ImportOrientationEnum.transposed

    return ImportOrientationEnum.normal


def transpose_with_first_row_as_header(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    transposed = df.transpose()
    transposed.columns = transposed.iloc[0].astype(str).tolist()
    transposed = transposed.iloc[1:].reset_index(drop=True)

    return transposed


def score_header_list(values: list[str]) -> int:
    score = 0

    for value in values:
        normalized = normalize_name(value)

        if QUESTION_RE.match(value):
            score += 3

        if any(hint in normalized for hint in COMMUNE_HINTS):
            score += 2

        if any(hint in normalized for hint in METADATA_HINTS):
            score += 1

    return score


def detect_survey(columns: list[str]) -> DetectedSurvey:
    matches = pd.Series(columns, dtype="string").str.extract(SURVEY_RE)

    if matches.empty:
        return DetectedSurvey()

    matches = matches.dropna()

    if matches.empty:
        return DetectedSurvey()

    matches.columns = ["prefix", "year"]
    matches["prefix"] = matches["prefix"].str.upper()

    years = matches["year"].astype(str)

    matches["year"] = np.where(
        years.str.len() == 2,
        2000 + years.astype(int),
        years.astype(int),
    )

    grouped = matches.groupby(["prefix", "year"]).size().reset_index(name="count").sort_values("count", ascending=False)

    if grouped.empty:
        return DetectedSurvey()

    best = grouped.iloc[0]
    confidence = min(float(best["count"]) / max(len(columns), 1) * 2, 1.0)

    return DetectedSurvey(
        name=str(best["prefix"]),
        year=int(best["year"]),
        confidence=round(confidence, 2),
        needs_user_confirmation=confidence < 0.95,
    )


def analyze_columns(df: pd.DataFrame) -> list[dict[str, Any]]:
    columns_summary: list[dict[str, Any]] = []

    for index, column_name in enumerate(df.columns):
        series = df[column_name].astype("string")
        detected_type, type_confidence = detect_column_type(series)

        section_result = detect_column_section(
            column_name=str(column_name),
            series=series,
        )

        columns_summary.append(
            {
                "index": index,
                "original_name": str(column_name),
                "normalized_name": normalize_name(str(column_name)),
                "section": section_result.section.value,
                "section_confidence": section_result.confidence,
                "section_source": section_result.source,
                "section_reason": section_result.reason,
                "section_needs_user_confirmation": section_result.needs_user_confirmation,
                "detected_type": detected_type.value,
                "confidence": type_confidence,
                "issue_count": 0,
            }
        )

    return columns_summary


def detect_column_section(
    *,
    column_name: str,
    series: pd.Series,
) -> SectionDetectionResult:
    normalized = normalize_name(column_name)
    clean = clean_series(series)

    if not normalized and clean.empty:
        return SectionDetectionResult(
            section=ImportSectionEnum.unclassified,
            confidence=0.0,
            source="empty_column",
            reason="Column name and values are empty.",
            needs_user_confirmation=True,
        )

    if any(hint in normalized for hint in COMMUNE_HINTS):
        return SectionDetectionResult(
            section=ImportSectionEnum.municipalities,
            confidence=0.85,
            source="name_hint",
            reason="Column name matches municipality hints.",
            needs_user_confirmation=True,
        )

    if any(hint in normalized for hint in METADATA_HINTS):
        return SectionDetectionResult(
            section=ImportSectionEnum.metadata,
            confidence=0.85,
            source="name_hint",
            reason="Column name matches metadata hints.",
            needs_user_confirmation=True,
        )

    if QUESTION_RE.match(column_name):
        return SectionDetectionResult(
            section=ImportSectionEnum.responses,
            confidence=0.80,
            source="question_regex",
            reason="Column name matches question pattern.",
            needs_user_confirmation=True,
        )

    if normalized in QUESTION_LABEL_NAMES:
        return SectionDetectionResult(
            section=ImportSectionEnum.questions,
            confidence=0.75,
            source="question_label_name",
            reason="Column name looks like a question label.",
            needs_user_confirmation=True,
        )

    if looks_like_choice_column(clean):
        return SectionDetectionResult(
            section=ImportSectionEnum.choices,
            confidence=0.55,
            source="low_cardinality",
            reason="Column has few distinct values.",
            needs_user_confirmation=True,
        )

    return SectionDetectionResult(
        section=ImportSectionEnum.unclassified,
        confidence=0.0,
        source="fallback",
        reason="No reliable section detected.",
        needs_user_confirmation=True,
    )


def looks_like_choice_column(clean: pd.Series) -> bool:
    if clean.empty:
        return False

    total = max(len(clean), 1)
    unique_count = int(clean.nunique(dropna=True))

    return unique_count <= 20 and unique_count / total < 0.05


def detect_column_type(series: pd.Series) -> tuple[DetectedTypeEnum, float]:
    clean = clean_series(series)

    if clean.empty:
        return DetectedTypeEnum.empty, 1.0

    int_mask = clean.str.fullmatch(r"[-+]?\d+", na=False)

    float_mask = clean.str.fullmatch(
        r"[-+]?\d+([.,]\d+)?",
        na=False,
    )

    bool_mask = clean.str.lower().isin(BOOLEAN_VALUES)

    date_mask = build_date_mask(clean)
    datetime_mask = build_datetime_mask(clean)

    scores = {
        DetectedTypeEnum.integer: float(int_mask.mean()),
        DetectedTypeEnum.float: float(float_mask.mean()),
        DetectedTypeEnum.boolean: float(bool_mask.mean()),
        DetectedTypeEnum.date: float(date_mask.mean()),
        DetectedTypeEnum.datetime: float(datetime_mask.mean()),
    }

    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]

    if best_score >= 0.80:
        return best_type, round(best_score, 4)

    return DetectedTypeEnum.text, 1.0


def build_date_mask(series: pd.Series) -> pd.Series:
    return (
        series.str.fullmatch(r"\d{4}-\d{2}-\d{2}", na=False)
        | series.str.fullmatch(r"\d{2}\.\d{2}\.\d{4}", na=False)
        | series.str.fullmatch(r"\d{2}/\d{2}/\d{4}", na=False)
    )


def build_datetime_mask(series: pd.Series) -> pd.Series:
    return (
        series.str.fullmatch(
            r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?",
            na=False,
        )
        | series.str.fullmatch(
            r"\d{2}\.\d{2}\.\d{4}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?",
            na=False,
        )
        | series.str.fullmatch(
            r"\d{2}/\d{2}/\d{4}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?",
            na=False,
        )
    )


def build_valid_type_mask(
    series: pd.Series,
    detected_type: DetectedTypeEnum,
) -> pd.Series:
    if detected_type == DetectedTypeEnum.integer:
        return series.str.fullmatch(r"[-+]?\d+", na=False)

    if detected_type == DetectedTypeEnum.float:
        return series.str.fullmatch(r"[-+]?\d+([.,]\d+)?", na=False)

    if detected_type == DetectedTypeEnum.boolean:
        return series.str.lower().isin(BOOLEAN_VALUES)

    if detected_type == DetectedTypeEnum.date:
        return build_date_mask(series)

    if detected_type == DetectedTypeEnum.datetime:
        return build_datetime_mask(series)

    return pd.Series(True, index=series.index)


def build_sections_summary(
    *,
    df: pd.DataFrame,
    columns_summary: list[dict[str, Any]],
    issues_by_column: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    summary_df = pd.DataFrame(columns_summary)

    result: list[dict[str, Any]] = []

    for section in ImportSectionEnum:
        if summary_df.empty:
            section_columns = pd.DataFrame()
        else:
            section_columns = summary_df[summary_df["section"] == section.value]

        issue_count = 0

        if not section_columns.empty:
            column_indexes = section_columns["index"].astype(str).tolist()
            issue_count = sum(len(issues_by_column.get(column_index, [])) for column_index in column_indexes)

        result.append(
            {
                "key": section.value,
                "label_key": f"dataImport.sections.{section.value}",
                "rows": int(df.shape[0]),
                "columns": int(len(section_columns)),
                "issues": int(issue_count),
            }
        )

    return result


def build_analysis_payload(
    *,
    import_id: str,
    df: pd.DataFrame,
    orientation: str,
    columns_summary: list[dict[str, Any]],
    issues_by_column: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    detected_survey = detect_survey(list(df.columns))

    for column in columns_summary:
        column["issue_count"] = len(issues_by_column.get(str(column["index"]), []))

    sections = build_sections_summary(
        df=df,
        columns_summary=columns_summary,
        issues_by_column=issues_by_column,
    )

    total_issues = sum(len(items) for items in issues_by_column.values())

    return {
        "import_id": import_id,
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "cells": int(df.shape[0] * df.shape[1]),
        "orientation": orientation,
        "detected_survey": detected_survey.model_dump(),
        "sections": sections,
        "columns_summary": columns_summary,
        "total_issues": total_issues,
    }

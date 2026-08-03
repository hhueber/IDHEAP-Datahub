# Sert a appliquer les transformations sur les colonnes des données importées.
from app.schemas.data_import import ColumnTransformActionEnum
from app.services.data_import.data_import_normalizer_service import TEXT_EMPTY_VALUES
import pandas as pd


def apply_column_transform(
    *,
    series: pd.Series,
    action: ColumnTransformActionEnum,
    search: str | None = None,
    replacement: str | None = None,
) -> pd.Series:
    clean_series = series.astype("string").fillna("")

    if action == ColumnTransformActionEnum.trim:
        return clean_series.str.strip()

    if action == ColumnTransformActionEnum.replace:
        if search is None:
            raise ValueError("search is required for replace action")

        return clean_series.str.replace(
            search,
            replacement or "",
            regex=False,
        )

    if action == ColumnTransformActionEnum.comma_to_dot:
        return clean_series.str.replace(",", ".", regex=False)

    if action == ColumnTransformActionEnum.dot_to_comma:
        return clean_series.str.replace(".", ",", regex=False)

    if action == ColumnTransformActionEnum.empty_to_null:
        stripped = clean_series.str.strip()
        return stripped.mask(stripped.str.lower().isin(TEXT_EMPTY_VALUES), "")

    if action == ColumnTransformActionEnum.normalize_datetime:
        return normalize_datetime_column(clean_series)

    if action == ColumnTransformActionEnum.datetime_to_date:
        return normalize_date_column(clean_series)

    raise ValueError(f"Unsupported transform action: {action}")


def normalize_date_column(series: pd.Series) -> pd.Series:
    clean = series.astype("string").fillna("").str.strip()

    parsed = pd.to_datetime(
        clean,
        errors="coerce",
        dayfirst=True,
    )

    normalized = parsed.dt.strftime("%Y-%m-%d")

    return normalized.fillna(clean)


def normalize_datetime_column(series: pd.Series) -> pd.Series:
    clean = series.astype("string").fillna("").str.strip()

    parsed = pd.to_datetime(
        clean,
        errors="coerce",
        dayfirst=True,
    )

    normalized = parsed.dt.strftime("%Y-%m-%d %H:%M:%S")

    return normalized.fillna(clean)

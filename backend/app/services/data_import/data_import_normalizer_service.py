import re


import pandas as pd


TEXT_EMPTY_VALUES = {"", "nan", "none", "null", "nat"}


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def clean_series(series: pd.Series) -> pd.Series:
    clean = series.astype("string").fillna("").str.strip()
    return clean[~clean.str.lower().isin(TEXT_EMPTY_VALUES)]


def normalize_dataframe_values(df: pd.DataFrame) -> pd.DataFrame:
    normalized = df.copy()
    normalized.columns = [str(column).strip() for column in normalized.columns]

    string_columns = normalized.select_dtypes(include=["object", "string"]).columns

    normalized[string_columns] = normalized[string_columns].apply(lambda series: series.astype("string").str.strip())

    return normalized

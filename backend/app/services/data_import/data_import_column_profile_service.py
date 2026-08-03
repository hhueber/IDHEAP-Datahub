from typing import Any


import pandas as pd


MAX_SAMPLE_VALUES = 5
MAX_MOST_COMMON_VALUES = 5

PROFILE_KEYS = {
    "empty_count",
    "non_empty_count",
    "unique_count",
    "sample_values",
    "most_common_values",
}


def columns_have_valid_profiles(
    *,
    df: pd.DataFrame,
    columns_summary: list[dict[str, Any]],
) -> bool:
    """
    Vérifie que les profils existent ET qu'ils correspondent au nombre de lignes.

    Important :
    un ancien analysis.json peut déjà contenir les clés de profil, mais avec
    toutes les valeurs à 0. Dans ce cas, il ne faut pas considérer le profil
    comme valide.
    """
    if not columns_summary:
        return True

    row_count = len(df)

    for column in columns_summary:
        if not PROFILE_KEYS.issubset(set(column.keys())):
            return False

        column_index = _safe_int(column.get("index"), default=-1)

        if column_index < 0 or column_index >= len(df.columns):
            continue

        empty_count = _safe_int(column.get("empty_count"), default=0)
        non_empty_count = _safe_int(column.get("non_empty_count"), default=0)

        if empty_count + non_empty_count != row_count:
            return False

        if not isinstance(column.get("sample_values"), list):
            return False

        if not isinstance(column.get("most_common_values"), list):
            return False

    return True


def enrich_columns_with_profiles(
    df: pd.DataFrame,
    columns_summary: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    enriched_columns: list[dict[str, Any]] = []

    for column in columns_summary:
        column_index = _safe_int(column.get("index"), default=-1)

        if column_index < 0 or column_index >= len(df.columns):
            enriched_columns.append(
                {
                    **column,
                    **_empty_profile(),
                }
            )
            continue

        series = df.iloc[:, column_index]
        profile = build_column_profile(series)

        enriched_columns.append(
            {
                **column,
                **profile,
            }
        )

    return enriched_columns


def build_column_profile(series: pd.Series) -> dict[str, Any]:
    normalized = series.map(_normalize_value_for_profile)

    empty_mask = normalized.eq("")
    non_empty_values = normalized[~empty_mask]

    empty_count = int(empty_mask.sum())
    non_empty_count = int(non_empty_values.shape[0])
    unique_count = int(non_empty_values.nunique(dropna=True))

    return {
        "empty_count": empty_count,
        "non_empty_count": non_empty_count,
        "unique_count": unique_count,
        "sample_values": _build_sample_values(non_empty_values),
        "most_common_values": _build_most_common_values(non_empty_values),
    }


def _build_sample_values(series: pd.Series) -> list[str]:
    if series.empty:
        return []

    unique_values = series.drop_duplicates().head(MAX_SAMPLE_VALUES)

    return [str(value) for value in unique_values.tolist() if str(value).strip() != ""]


def _build_most_common_values(series: pd.Series) -> list[dict[str, Any]]:
    if series.empty:
        return []

    counts = series.value_counts(dropna=True).head(MAX_MOST_COMMON_VALUES)

    return [
        {
            "value": str(value),
            "count": int(count),
        }
        for value, count in counts.items()
        if str(value).strip() != ""
    ]


def _normalize_value_for_profile(value: Any) -> str:
    if value is None:
        return ""

    try:
        if pd.isna(value):
            return ""
    except TypeError:
        pass

    return str(value).strip()


def _empty_profile() -> dict[str, Any]:
    return {
        "empty_count": 0,
        "non_empty_count": 0,
        "unique_count": 0,
        "sample_values": [],
        "most_common_values": [],
    }


def _safe_int(value: Any, *, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

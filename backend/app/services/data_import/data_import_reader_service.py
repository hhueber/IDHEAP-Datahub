# Sert a lire les fichier importés en fonction du format.
from pathlib import Path
import csv


import pandas as pd


def read_import_file(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()

    if suffix == ".csv":
        separator = detect_csv_separator(path)

        return pd.read_csv(
            path,
            sep=separator,
            dtype="string",
            keep_default_na=False,
            na_values=[],
            engine="c",
            low_memory=False,
        )

    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(
            path,
            dtype="string",
            keep_default_na=False,
            engine="openpyxl" if suffix == ".xlsx" else None,
        )

    raise ValueError("Unsupported file format")


def detect_csv_separator(path: Path) -> str:
    sample = path.read_text(errors="ignore")[:65536]

    if not sample.strip():
        return ";"

    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=";,|\t")
        return dialect.delimiter
    except csv.Error:
        return detect_csv_separator_fallback(sample)


def detect_csv_separator_fallback(sample: str) -> str:
    candidates = [";", ",", "\t", "|"]

    lines = [line for line in sample.splitlines() if line.strip()][:50]

    if not lines:
        return ";"

    scores: dict[str, int] = {}

    for separator in candidates:
        counts = [line.count(separator) for line in lines]
        non_zero_counts = [count for count in counts if count > 0]

        if not non_zero_counts:
            scores[separator] = 0
            continue

        average = sum(non_zero_counts) / len(non_zero_counts)
        stability_penalty = max(non_zero_counts) - min(non_zero_counts)

        scores[separator] = int(average * 100) - stability_penalty

    best_separator = max(scores, key=scores.get)

    if scores[best_separator] <= 0:
        return ";"

    return best_separator

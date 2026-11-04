# Sert a detecter les problemes dans les données importées, actuellement on ce concentre sur les type principalement.
from typing import Any

import pandas as pd

from app.schemas.data_import import DetectedTypeEnum
from app.services.data_import.data_import_detection_service import build_valid_type_mask
from app.services.data_import.data_import_normalizer_service import TEXT_EMPTY_VALUES


def detect_issues_vectorized(
    df: pd.DataFrame,
    columns_summary: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    """
    Analyse les colonnes du fichier importé pour détecter les erreurs de type.

    Chaque colonne est vérifiée individuellement et les erreurs sont
    regroupées dans un dictionnaire utilisant l'index de colonne comme clé.

    Args:
        df: Données importées.
        columns_summary: Informations sur les colonnes et leurs types détectés.

    Returns:
        Dictionnaire contenant la liste des erreurs pour chaque colonne.
    """
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
    """
    Détecte les valeurs incompatibles avec le type attendu d'une colonne.

    La vérification est effectuée uniquement si le type possède une
    confiance d'au moins 99 % et n'est pas text, empty ou mixed.

    Les valeurs sont converties en chaînes et nettoyées avant de créer
    deux masques :
    - non_empty_mask : identifie les valeurs considérées comme non vides.
    - valid_mask : identifie les valeurs conformes au type attendu.

    Une erreur est détectée lorsqu'une valeur est non vide mais ne
    correspond pas au type attendu.

    Args:
        df: Données importées.
        column_summary: Informations sur la colonne à vérifier.

    Returns:
        Liste des erreurs avec leur position, type attendu et valeur réelle.
        Une liste vide est retournée si aucune erreur n'est détectée.
    """
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

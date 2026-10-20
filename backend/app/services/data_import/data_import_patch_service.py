# Sert a appliquer les modifications sur les données importées et recalculer les analyses et issues associées.
from pathlib import Path
from typing import Any


from app.schemas.data_import import (
    DataImportCellPatch,
    DataImportColumnPatch,
    DataImportColumnTransformPatch,
    ImportSectionEnum,
)
from app.services.data_import.data_import_detection_service import build_sections_summary, detect_column_type
from app.services.data_import.data_import_issue_service import detect_single_column_issues_vectorized
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
    """
    Modifie une cellule du fichier importé et sauvegarde les données.

    Après modification, les erreurs de la colonne concernée sont
    recalculées sans relancer la détection automatique de son type.

    Args:
        import_id: Identifiant de l'importation.
        payload: Position de la cellule et nouvelle valeur.

    Returns:
        Analyse actualisée après la modification.
    """
    import_dir = get_import_dir(import_id)
    df = read_frame(import_dir)

    df.iat[payload.row_index, payload.column_index] = payload.value

    write_frame(import_dir, df)

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
    """
    Applique les modifications manuelles aux propriétés d'une colonne.

    Permet de :
    - Marquer une colonne comme ignorée.
    - Modifier sa section (communes, réponses, métadonnées, etc.).
    - Définir manuellement son type de données.

    Lorsqu'une section ou un type est défini manuellement, les
    informations correspondantes sont mises à jour dans l'analyse.

    Les erreurs de la colonne sont ensuite recalculées sans effectuer
    de nouvelle détection automatique du type.

    Args:
        import_id: Identifiant de l'importation.
        payload: Index de la colonne et propriétés à modifier.

    Returns:
        Analyse actualisée après les modifications.
    """
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
    )


async def patch_import_column_transform(
    *,
    import_id: str,
    payload: DataImportColumnTransformPatch,
) -> dict[str, Any]:
    """
    Applique une transformation aux valeurs d'une colonne importée.

    La transformation est réalisée par apply_column_transform selon
    l'action demandée et ses éventuels paramètres.

    Après sauvegarde, le type de la colonne est automatiquement
    redétecté et les erreurs associées sont recalculées.

    Args:
        import_id: Identifiant de l'importation.
        payload: Colonne, transformation et paramètres à appliquer.

    Returns:
        Analyse actualisée après la transformation.
    """
    import_dir = get_import_dir(import_id)
    df = read_frame(import_dir)

    column_name = df.columns[payload.column_index]

    df[column_name] = apply_column_transform(
        series=df[column_name],
        action=payload.action,
        search=payload.search,
        replacement=payload.replacement,
    )

    write_frame(import_dir, df)

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
) -> dict[str, Any]:
    """
    Met à jour les analyses et les erreurs après modification d'une colonne.

    Le recalcul est limité à la colonne modifiée afin d'éviter
    de réanalyser l'ensemble des données importées.

    Si redetect_type est activé, le type de la colonne est redétecté
    à partir de ses valeurs actuelles.

    La fonction effectue ensuite les opérations suivantes :
    - Recalcule les erreurs de la colonne concernée.
    - Met à jour son nombre d'erreurs.
    - Recalcule le nombre total d'erreurs du fichier.
    - Actualise les statistiques des différentes sections.
    - Sauvegarde les analyses et les erreurs actualisées.

    Args:
        import_dir: Répertoire contenant les données de l'importation.
        df: Données importées après modification.
        column_index: Index de la colonne modifiée.
        redetect_type: Indique si le type doit être détecté à nouveau.

    Returns:
        Analyse actualisée de l'importation.
    """
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

    write_analysis(import_dir, analysis)
    write_issues(import_dir, issues_by_column)

    return analysis


def get_column_summary(
    columns_summary: list[dict[str, Any]],
    column_index: int,
) -> dict[str, Any]:
    """
    Recherche les informations d'analyse correspondant à une colonne.
    """
    return next(column for column in columns_summary if int(column["index"]) == column_index)

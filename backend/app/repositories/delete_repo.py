from typing import List


from app.repositories.pageAll_repo import ENTITY_CONFIG  # on réutilise le mapping
from app.schemas.pageAll import EntityEnum
from sqlalchemy import and_, delete, update
from sqlalchemy.ext.asyncio import AsyncSession


async def delete_rows(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    filters: List[tuple[str, object]],
) -> int:
    """
    Supprime des lignes dans la table de l'entité donnée,
    en appliquant les filtres fournis.
    Retourne le nombre de lignes supprimées.
    """
    cfg = ENTITY_CONFIG.get(entity)
    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    conditions = []
    for field, value in filters:
        col = getattr(model, field, None)
        if col is None:
            # Champ inconnu -> on ignore ce filtre
            continue
        conditions.append(col == value)

    if not conditions:
        raise ValueError("No valid filters provided")

    stmt = delete(model).where(and_(*conditions))
    result = await db.execute(stmt)
    await db.commit()

    return result.rowcount or 0


async def clear_fields(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    filters: List[tuple[str, object]],
    clear_fields: List[str],
) -> int:
    """
    Met à NULL une ou plusieurs colonnes sur les lignes ciblées par les filtres.
    Exemple:
      clear_fields = ["name_en", "text_fr"]
    -> UPDATE ... SET name_en = NULL, text_fr = NULL WHERE ...
    """
    cfg = ENTITY_CONFIG.get(entity)
    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    if not clear_fields:
        raise ValueError("No fields to clear provided")

    # Construire le dict des colonnes à mettre à NULL
    values_dict: dict[str, None] = {}

    for field in clear_fields:
        col = getattr(model, field, None)
        if col is None:
            # Champ inconnu -> on ignore
            continue

        # Sécurité : on évite de "vider" la clé primaire
        if field == "uid":
            continue

        # col.key = nom de la colonne dans la table
        values_dict[col.key] = None

    if not values_dict:
        raise ValueError("No valid fields to clear")

    conditions = []
    for field, value in filters:
        col = getattr(model, field, None)
        if col is None:
            continue
        conditions.append(col == value)

    if not conditions:
        raise ValueError("No valid filters provided")

    stmt = update(model).where(and_(*conditions)).values(**values_dict)

    result = await db.execute(stmt)
    await db.commit()

    return result.rowcount or 0

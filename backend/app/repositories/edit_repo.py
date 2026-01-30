from typing import Dict, List


from app.repositories.pageAll_repo import ENTITY_CONFIG
from app.schemas.pageAll import EntityEnum
from sqlalchemy import and_, update
from sqlalchemy.ext.asyncio import AsyncSession


FORBIDDEN_UPDATE_FIELDS = {"uid", "id"}  # protège PK/identifiants a updater


async def update_rows(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    filters: List[tuple[str, object]],
    updates: Dict[str, object],
) -> int:
    """
    Update des lignes ciblées par filters avec updates (field -> value).
    - Refuse uid/id
    - Ignore champs inconnus
    - Refuse strings vides (déjà validées pydantic, mais on recheck en sécurité)
    Retourne le nombre de lignes modifiées.
    """
    cfg = ENTITY_CONFIG.get(entity)
    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    # Construire dict de colonnes à updater de manière sûre
    values_dict: dict[str, object] = {}

    for field, value in updates.items():
        if field in FORBIDDEN_UPDATE_FIELDS:
            continue

        col = getattr(model, field, None)
        if col is None:
            continue

        if isinstance(value, str) and value.strip() == "":
            raise ValueError(f"Empty string is not allowed for field: {field}")

        values_dict[col.key] = value

    if not values_dict:
        raise ValueError("No valid fields to update")

    # Conditions WHERE
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

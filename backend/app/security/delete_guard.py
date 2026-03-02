from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Set


from app.schemas.pageAll import EntityEnum


class DeleteAction(str, Enum):
    DELETE_ROWS = "delete_rows"
    CLEAR_FIELDS = "clear_fields"


@dataclass(frozen=True)
class DeletePolicy:
    deny_delete_entities: Set[EntityEnum]
    deny_clear_entities: Set[EntityEnum]


# actuellement /delete ne peut déjà pas toucher Lake, Country, CantonMap car pas dans EntityEnum
DEFAULT_DELETE_POLICY = DeletePolicy(
    # tables 100% protégées (aucune suppression)
    deny_delete_entities={
        EntityEnum.canton,
        EntityEnum.district,
        EntityEnum.commune,
    },
    # protége aussi le "clear"
    deny_clear_entities={
        EntityEnum.canton,
        EntityEnum.district,
        EntityEnum.commune,
    },
)


def assert_delete_allowed(*, entity: EntityEnum, action: DeleteAction) -> None:
    policy = DEFAULT_DELETE_POLICY

    if action == DeleteAction.DELETE_ROWS and entity in policy.deny_delete_entities:
        raise ValueError(f"Deletion is not allowed for entity: {entity}")

    if action == DeleteAction.CLEAR_FIELDS and entity in policy.deny_clear_entities:
        raise ValueError(f"Clearing fields is not allowed for entity: {entity}")

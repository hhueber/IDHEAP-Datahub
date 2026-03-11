from dataclasses import dataclass
from enum import Enum
from typing import Set


from app.schemas.pageAll import EntityEnum


class EditAction(str, Enum):
    UPDATE_ROWS = "update_rows"


@dataclass(frozen=True)
class EditPolicy:
    deny_update_entities: Set[EntityEnum]


DEFAULT_EDIT_POLICY = EditPolicy(
    deny_update_entities={
        EntityEnum.canton,
        EntityEnum.district,
        EntityEnum.commune,
    }
)


def assert_edit_allowed(*, entity: EntityEnum, action: EditAction) -> None:
    policy = DEFAULT_EDIT_POLICY

    if action == EditAction.UPDATE_ROWS and entity in policy.deny_update_entities:
        raise ValueError(f"Editing is not allowed for entity: {entity}")

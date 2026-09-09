from enum import Enum


class PermissionScope(str, Enum):
    INSTANCE = "INSTANCE"
    PROJECT = "PROJECT"
    DATASET = "DATASET"


class PermissionLevel(str, Enum):
    READ = "READ"
    WRITE = "WRITE"
    MANAGE = "MANAGE"


class PermissionRole(str, Enum):
    INSTANCE_VIEWER = "INSTANCE_VIEWER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"

    PROJECT_VIEWER = "PROJECT_VIEWER"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    PROJECT_OWNER = "PROJECT_OWNER"

    DATASET_VIEWER = "DATASET_VIEWER"
    DATASET_EDITOR = "DATASET_EDITOR"
    DATASET_OWNER = "DATASET_OWNER"


# Liste (tuple) des valeurs
ROLE_VALUES: tuple[str, ...] = tuple(role.value for role in PermissionRole)


ROLE_TO_PERMISSION: dict[PermissionRole, tuple[PermissionScope, PermissionLevel]] = {
    PermissionRole.INSTANCE_VIEWER: (
        PermissionScope.INSTANCE,
        PermissionLevel.READ,
    ),
    PermissionRole.ADMIN: (
        PermissionScope.INSTANCE,
        PermissionLevel.WRITE,
    ),
    PermissionRole.SUPER_ADMIN: (
        PermissionScope.INSTANCE,
        PermissionLevel.MANAGE,
    ),
    PermissionRole.PROJECT_VIEWER: (
        PermissionScope.PROJECT,
        PermissionLevel.READ,
    ),
    PermissionRole.PROJECT_MANAGER: (
        PermissionScope.PROJECT,
        PermissionLevel.WRITE,
    ),
    PermissionRole.PROJECT_OWNER: (
        PermissionScope.PROJECT,
        PermissionLevel.MANAGE,
    ),
    PermissionRole.DATASET_VIEWER: (
        PermissionScope.DATASET,
        PermissionLevel.READ,
    ),
    PermissionRole.DATASET_EDITOR: (
        PermissionScope.DATASET,
        PermissionLevel.WRITE,
    ),
    PermissionRole.DATASET_OWNER: (
        PermissionScope.DATASET,
        PermissionLevel.MANAGE,
    ),
}

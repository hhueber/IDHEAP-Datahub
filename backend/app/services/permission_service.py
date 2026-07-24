from app.config.roles import PermissionLevel, PermissionRole, PermissionScope, ROLE_TO_PERMISSION


PermissionKey = tuple[PermissionScope, PermissionLevel]


GRANTED_PERMISSIONS: dict[PermissionKey, set[PermissionKey]] = {
    # SUPER_ADMIN = INSTANCE MANAGE = rwm rwm rwm
    (PermissionScope.INSTANCE, PermissionLevel.MANAGE): {
        (PermissionScope.INSTANCE, PermissionLevel.READ),
        (PermissionScope.INSTANCE, PermissionLevel.WRITE),
        (PermissionScope.INSTANCE, PermissionLevel.MANAGE),
        (PermissionScope.PROJECT, PermissionLevel.READ),
        (PermissionScope.PROJECT, PermissionLevel.WRITE),
        (PermissionScope.PROJECT, PermissionLevel.MANAGE),
        (PermissionScope.DATASET, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.WRITE),
        (PermissionScope.DATASET, PermissionLevel.MANAGE),
    },
    # ADMIN = INSTANCE WRITE = rw- rwm rwm
    (PermissionScope.INSTANCE, PermissionLevel.WRITE): {
        (PermissionScope.INSTANCE, PermissionLevel.READ),
        (PermissionScope.INSTANCE, PermissionLevel.WRITE),
        (PermissionScope.PROJECT, PermissionLevel.READ),
        (PermissionScope.PROJECT, PermissionLevel.WRITE),
        (PermissionScope.PROJECT, PermissionLevel.MANAGE),
        (PermissionScope.DATASET, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.WRITE),
        (PermissionScope.DATASET, PermissionLevel.MANAGE),
    },
    # INSTANCE_VIEWER = INSTANCE READ = r-- rwm rwm
    (PermissionScope.INSTANCE, PermissionLevel.READ): {
        (PermissionScope.INSTANCE, PermissionLevel.READ),
        (PermissionScope.PROJECT, PermissionLevel.READ),
        (PermissionScope.PROJECT, PermissionLevel.WRITE),
        (PermissionScope.PROJECT, PermissionLevel.MANAGE),
        (PermissionScope.DATASET, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.WRITE),
        (PermissionScope.DATASET, PermissionLevel.MANAGE),
    },
    # PROJECT_OWNER = PROJECT MANAGE = --- rwm rwm
    (PermissionScope.PROJECT, PermissionLevel.MANAGE): {
        (PermissionScope.PROJECT, PermissionLevel.READ),
        (PermissionScope.PROJECT, PermissionLevel.WRITE),
        (PermissionScope.PROJECT, PermissionLevel.MANAGE),
        (PermissionScope.DATASET, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.WRITE),
        (PermissionScope.DATASET, PermissionLevel.MANAGE),
    },
    # PROJECT_MANAGER = PROJECT WRITE = --- rw- rwm
    (PermissionScope.PROJECT, PermissionLevel.WRITE): {
        (PermissionScope.PROJECT, PermissionLevel.READ),
        (PermissionScope.PROJECT, PermissionLevel.WRITE),
        (PermissionScope.DATASET, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.WRITE),
        (PermissionScope.DATASET, PermissionLevel.MANAGE),
    },
    # PROJECT_VIEWER = PROJECT READ = --- r-- rwm
    (PermissionScope.PROJECT, PermissionLevel.READ): {
        (PermissionScope.PROJECT, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.WRITE),
        (PermissionScope.DATASET, PermissionLevel.MANAGE),
    },
    # DATASET_OWNER = DATASET MANAGE = --- --- rwm
    (PermissionScope.DATASET, PermissionLevel.MANAGE): {
        (PermissionScope.DATASET, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.WRITE),
        (PermissionScope.DATASET, PermissionLevel.MANAGE),
    },
    # DATASET_EDITOR = DATASET WRITE = --- --- rw-
    (PermissionScope.DATASET, PermissionLevel.WRITE): {
        (PermissionScope.DATASET, PermissionLevel.READ),
        (PermissionScope.DATASET, PermissionLevel.WRITE),
    },
    # DATASET_VIEWER = DATASET READ = --- --- r--
    (PermissionScope.DATASET, PermissionLevel.READ): {
        (PermissionScope.DATASET, PermissionLevel.READ),
    },
}


def get_role_permission(role: PermissionRole | str) -> PermissionKey:
    role_enum = PermissionRole(role)
    return ROLE_TO_PERMISSION[role_enum]


def role_has_permission(
    role: PermissionRole | str,
    *,
    scope: PermissionScope,
    level: PermissionLevel,
) -> bool:
    role_permission = get_role_permission(role)
    granted_permissions = GRANTED_PERMISSIONS.get(role_permission, set())
    required_permission = (scope, level)

    return required_permission in granted_permissions


def get_granted_permissions_for_role(role: PermissionRole | str) -> set[PermissionKey]:
    role_permission = get_role_permission(role)
    return GRANTED_PERMISSIONS.get(role_permission, set())


def get_role_scope(role: PermissionRole | str) -> PermissionScope:
    role_permission = get_role_permission(role)
    return role_permission[0]


def role_can_manage_role(
    actor_role: PermissionRole | str,
    target_role: PermissionRole | str,
) -> bool:
    """
    Vérifie si actor_role peut créer / supprimer / gérer un utilisateur
    avec le rôle target_role.

    Règles :
    - Un rôle INSTANCE ne peut être géré que par un utilisateur ayant INSTANCE MANAGE.
      Donc seul SUPER_ADMIN peut créer/supprimer SUPER_ADMIN, ADMIN ou INSTANCE_VIEWER.
    - Sinon, l'utilisateur courant doit posséder toutes les permissions accordées
      par le rôle cible.
    """
    actor_role_enum = PermissionRole(actor_role)
    target_role_enum = PermissionRole(target_role)

    target_scope = get_role_scope(target_role_enum)

    if target_scope == PermissionScope.INSTANCE and not role_has_permission(
        actor_role_enum,
        scope=PermissionScope.INSTANCE,
        level=PermissionLevel.MANAGE,
    ):
        return False

    actor_permissions = get_granted_permissions_for_role(actor_role_enum)
    target_permissions = get_granted_permissions_for_role(target_role_enum)

    return target_permissions.issubset(actor_permissions)

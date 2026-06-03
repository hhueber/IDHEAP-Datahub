export const PERMISSION_ROLES = [
  "INSTANCE_VIEWER",
  "ADMIN",
  "SUPER_ADMIN",
  "PROJECT_VIEWER",
  "PROJECT_MANAGER",
  "PROJECT_OWNER",
  "DATASET_VIEWER",
  "DATASET_EDITOR",
  "DATASET_OWNER",
] as const;

export type PermissionRole = typeof PERMISSION_ROLES[number];

export const INSTANCE_VIEWER = "INSTANCE_VIEWER" as const;
export const ADMIN = "ADMIN" as const;
export const SUPER_ADMIN = "SUPER_ADMIN" as const;

export const PROJECT_VIEWER = "PROJECT_VIEWER" as const;
export const PROJECT_MANAGER = "PROJECT_MANAGER" as const;
export const PROJECT_OWNER = "PROJECT_OWNER" as const;

export const DATASET_VIEWER = "DATASET_VIEWER" as const;
export const DATASET_EDITOR = "DATASET_EDITOR" as const;
export const DATASET_OWNER = "DATASET_OWNER" as const;

export const PERMISSION_SCOPES = ["INSTANCE", "PROJECT", "DATASET"] as const;
export type PermissionScope = typeof PERMISSION_SCOPES[number];

export const PERMISSION_LEVELS = ["READ", "WRITE", "MANAGE"] as const;
export type PermissionLevel = typeof PERMISSION_LEVELS[number];

export type PermissionKey = `${PermissionScope}:${PermissionLevel}`;

const key = (
  scope: PermissionScope,
  level: PermissionLevel
): PermissionKey => {
  return `${scope}:${level}`;
};

const ROLE_TO_PERMISSION: Record<PermissionRole, PermissionKey> = {
  INSTANCE_VIEWER: "INSTANCE:READ",
  ADMIN: "INSTANCE:WRITE",
  SUPER_ADMIN: "INSTANCE:MANAGE",

  PROJECT_VIEWER: "PROJECT:READ",
  PROJECT_MANAGER: "PROJECT:WRITE",
  PROJECT_OWNER: "PROJECT:MANAGE",

  DATASET_VIEWER: "DATASET:READ",
  DATASET_EDITOR: "DATASET:WRITE",
  DATASET_OWNER: "DATASET:MANAGE",
};

const GRANTED_PERMISSIONS: Record<PermissionKey, PermissionKey[]> = {
  // SUPER_ADMIN = rwm rwm rwm
  "INSTANCE:MANAGE": [
    "INSTANCE:READ",
    "INSTANCE:WRITE",
    "INSTANCE:MANAGE",

    "PROJECT:READ",
    "PROJECT:WRITE",
    "PROJECT:MANAGE",

    "DATASET:READ",
    "DATASET:WRITE",
    "DATASET:MANAGE",
  ],

  // ADMIN = rw- rwm rwm
  "INSTANCE:WRITE": [
    "INSTANCE:READ",
    "INSTANCE:WRITE",

    "PROJECT:READ",
    "PROJECT:WRITE",
    "PROJECT:MANAGE",

    "DATASET:READ",
    "DATASET:WRITE",
    "DATASET:MANAGE",
  ],

  // INSTANCE_VIEWER = r-- rwm rwm
  "INSTANCE:READ": [
    "INSTANCE:READ",

    "PROJECT:READ",
    "PROJECT:WRITE",
    "PROJECT:MANAGE",

    "DATASET:READ",
    "DATASET:WRITE",
    "DATASET:MANAGE",
  ],

  // PROJECT_OWNER = --- rwm rwm
  "PROJECT:MANAGE": [
    "PROJECT:READ",
    "PROJECT:WRITE",
    "PROJECT:MANAGE",

    "DATASET:READ",
    "DATASET:WRITE",
    "DATASET:MANAGE",
  ],

  // PROJECT_MANAGER = --- rw- rwm
  "PROJECT:WRITE": [
    "PROJECT:READ",
    "PROJECT:WRITE",

    "DATASET:READ",
    "DATASET:WRITE",
    "DATASET:MANAGE",
  ],

  // PROJECT_VIEWER = --- r-- rwm
  "PROJECT:READ": [
    "PROJECT:READ",

    "DATASET:READ",
    "DATASET:WRITE",
    "DATASET:MANAGE",
  ],

  // DATASET_OWNER = --- --- rwm
  "DATASET:MANAGE": [
    "DATASET:READ",
    "DATASET:WRITE",
    "DATASET:MANAGE",
  ],

  // DATASET_EDITOR = --- --- rw-
  "DATASET:WRITE": [
    "DATASET:READ",
    "DATASET:WRITE",
  ],

  // DATASET_VIEWER = --- --- r--
  "DATASET:READ": [
    "DATASET:READ",
  ],
};

export function roleHasPermission(
  role: PermissionRole | undefined | null,
  required: {
    scope: PermissionScope;
    level: PermissionLevel;
  }
): boolean {
  if (!role) return false;

  const rolePermission = ROLE_TO_PERMISSION[role];
  const requiredPermission = key(required.scope, required.level);

  return GRANTED_PERMISSIONS[rolePermission]?.includes(requiredPermission) ?? false;
}

export const ROLE_LABELS: Record<PermissionRole, string> = {
  INSTANCE_VIEWER: "Instance viewer",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",

  PROJECT_VIEWER: "Project viewer",
  PROJECT_MANAGER: "Project manager",
  PROJECT_OWNER: "Project owner",

  DATASET_VIEWER: "Dataset viewer",
  DATASET_EDITOR: "Dataset editor",
  DATASET_OWNER: "Dataset owner",
};

export function getGrantedPermissionsForRole(
  role: PermissionRole
): PermissionKey[] {
  const rolePermission = ROLE_TO_PERMISSION[role];
  return GRANTED_PERMISSIONS[rolePermission] ?? [];
}

function getRoleScope(role: PermissionRole): PermissionScope {
  return ROLE_TO_PERMISSION[role].split(":")[0] as PermissionScope;
}

export function roleCanGrantRole(
  actorRole: PermissionRole | undefined | null,
  targetRole: PermissionRole
): boolean {
  if (!actorRole) return false;

  const targetScope = getRoleScope(targetRole);

  /*
    Règle importante :
    un utilisateur ne peut attribuer un rôle INSTANCE
    que s’il possède INSTANCE MANAGE.

    Donc :
    - SUPER_ADMIN peut créer SUPER_ADMIN / ADMIN / INSTANCE_VIEWER
    - ADMIN ne peut pas créer de rôle INSTANCE
    - PROJECT_MANAGER ne peut pas créer de rôle INSTANCE
  */
  if (
    targetScope === "INSTANCE" &&
    !roleHasPermission(actorRole, { scope: "INSTANCE", level: "MANAGE" })
  ) {
    return false;
  }

  const actorPermissions = getGrantedPermissionsForRole(actorRole);
  const targetPermissions = getGrantedPermissionsForRole(targetRole);

  /*
    L'utilisateur peut attribuer un rôle seulement si toutes les permissions
    du rôle cible sont incluses dans ses propres permissions.
  */
  return targetPermissions.every((permission) =>
    actorPermissions.includes(permission)
  );
}

export function getAssignableRoles(
  actorRole: PermissionRole | undefined | null
): PermissionRole[] {
  if (!actorRole) return [];

  return PERMISSION_ROLES.filter((targetRole) =>
    roleCanGrantRole(actorRole, targetRole)
  );
}

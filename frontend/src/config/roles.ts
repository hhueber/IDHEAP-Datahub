export const ROLES = ["ADMIN", "MEMBER"] as const;
export type Role = typeof ROLES[number];
export const ADMIN = "ADMIN" as const;
export const MEMBER = "MEMBER" as const;

import type { PermissionRole } from "@/config/roles";

export type AdminUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: PermissionRole;
  created_at: string | null;
};

export type AdminUsersPayload = {
  items: AdminUser[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
};

export type AdminUsersResponse = {
  success: boolean;
  detail: string;
  data: AdminUsersPayload;
};

export type AdminUserUpdatePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: PermissionRole;
};

export type AdminUserActionResponse = {
  success: boolean;
  detail: string;
};

export type AdminUsersSortBy =
  | "first_name"
  | "last_name"
  | "email"
  | "role"
  | "created_at";

export type AdminUsersSortDir = "asc" | "desc";

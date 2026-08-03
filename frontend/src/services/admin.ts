// Services d’administration : création et suppression de membres via l’API
import { apiFetch } from "@/shared/apiFetch";
import { normalizeName, normalizeEmail } from "@/utils/normalize";
import type { AdminUserActionResponse, AdminUsersResponse, AdminUsersSortBy, AdminUsersSortDir, AdminUserUpdatePayload } from "@/features/admin/users/adminUsersTypes";
import type { PermissionRole } from "@/config/roles";

export type CreateMemberPayload = {
  first_name: string;
  last_name: string;
  email: string;
  role: PermissionRole;
  password: string;
};

export async function createMember(form: {
  first_name: string;
  last_name: string;
  email: string;
  role: PermissionRole;
  password: string;
}) {
  const body: CreateMemberPayload = {
    first_name: normalizeName(form.first_name),
    last_name: normalizeName(form.last_name),
    email: normalizeEmail(form.email),
    role: form.role,
    password: form.password,
  };
  return apiFetch<{ success: boolean; detail: string; user?: any }>("/user/addUser", {
    method: "POST",
    auth: true,
    body,
  });
}

export const adminUsersApi = {
  list: (params: {
    page: number;
    perPage: number;
    orderBy: AdminUsersSortBy;
    orderDir: AdminUsersSortDir;
    q?: string;
  }) => {
    return apiFetch<AdminUsersResponse>("/user/admin", {
      method: "GET",
      auth: true,
      query: {
        page: params.page,
        per_page: params.perPage,
        order_by: params.orderBy,
        order_dir: params.orderDir,
        q: params.q || undefined,
      },
    });
  },

  update: (userId: string, body: AdminUserUpdatePayload) => {
    return apiFetch<AdminUserActionResponse>(`/user/admin/${userId}`, {
      method: "PATCH",
      auth: true,
      body,
    });
  },

  remove: (userId: string) => {
    return apiFetch<AdminUserActionResponse>(`/user/admin/${userId}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

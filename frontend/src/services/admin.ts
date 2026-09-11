// Services d’administration : création et suppression de membres via l’API
import { apiFetch } from "@/shared/apiFetch";
import { normalizeName, normalizeEmail } from "@/utils/normalize";

export type CreateMemberPayload = {
  first_name: string;
  last_name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  password: string;
};

export async function createMember(form: {
  first_name: string;
  last_name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
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

export async function deleteMember(form: {
  first_name: string;
  last_name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}) {
  const body = {
    first_name: normalizeName(form.first_name),
    last_name: normalizeName(form.last_name),
    email: normalizeEmail(form.email),
    role: form.role,
  };
  return apiFetch<{ success: boolean; detail: string }>("/user/deleteUser", {
    method: "POST",
    auth: true,
    body,
  });
}

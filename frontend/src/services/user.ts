// Service utilisateur : changement de mot de passe via l’API
import { apiFetch } from "@/shared/apiFetch";

export async function changePassword(body: { old_password: string; new_password: string; confirm?: string }) {
  return apiFetch<{ success: boolean; detail: string }>("/user/changePassword", {
    method: "POST",
    auth: true,
    body,
  });
}

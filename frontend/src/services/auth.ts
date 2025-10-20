// Service d’authentification (client) : login/refresh/logout + cache local
import { apiFetch } from "@/shared/apiFetch";

export type User = { id: string; email: string; full_name: string; role: "ADMIN" | "MEMBER" };

const REFRESH_KEY = "next_refresh_at"; // timestamp en ms

function saveNextRefresh(secondsFromNow: number) {
  const now = Date.now();
  const ts = now + Math.max(0, secondsFromNow) * 1000;
  localStorage.setItem(REFRESH_KEY, String(ts));
}

export function getNextRefreshTs(): number | null {
  const v = localStorage.getItem(REFRESH_KEY);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function clearNextRefresh() {
  localStorage.removeItem(REFRESH_KEY);
}

type LoginResp = { refresh_in: number } & Record<string, any>;
type RefreshResp = { refresh_in: number };

export const authService = {
  async login(email: string, password: string): Promise<{ refresh_in: number }> {
    // le serveur pose le cookie HttpOnly
    const r = await apiFetch<LoginResp>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
      withCredentials: true, // utile si domaine/port différent
    });
    if (typeof r.refresh_in !== "number") throw new Error("Missing refresh_in in /auth/login response");
    saveNextRefresh(r.refresh_in);
    return { refresh_in: r.refresh_in };
  },

  async me(): Promise<User> {
    return apiFetch<User>("/user/me", { method: "GET", auth: true });
  },

  async refresh(): Promise<RefreshResp> {
    const r = await apiFetch<RefreshResp>("/auth/refresh", { method: "POST", auth: true });
    if (typeof r.refresh_in !== "number") throw new Error("Missing refresh_in in /auth/refresh response");
    saveNextRefresh(r.refresh_in);
    return r;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch("/auth/logout", { method: "POST", auth: true });
    } catch (e) {
      console.warn("logout server error (ignored):", e);
    } finally {
      clearNextRefresh();
      localStorage.removeItem("user_data");
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  },

  logoutClientOnly(): void {
    clearNextRefresh();
    localStorage.removeItem("user_data");
    if (typeof window !== "undefined") window.location.href = "/login";
  },

  cacheUser(u: User) { localStorage.setItem("user_data", JSON.stringify(u)); },
  getCachedUser(): User | null {
    const v = localStorage.getItem("user_data"); return v ? JSON.parse(v) : null;
  },
  isAuthenticated(): boolean {
    return !!this.getCachedUser();
  },
};

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService, User, getNextRefreshTs, clearNextRefresh } from "@/services/auth";
import { useLocation } from "react-router-dom";

type Ctx = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: Array<User["role"]>) => boolean;
};

const Ctx = createContext<Ctx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCachedUser());
  const [ready, setReady] = useState(false);
  const refreshTimer = useRef<number | null>(null);
  const refreshPending = useRef(false); // évite les refresh concurrents
  const navigate = useNavigate();
  const location = useLocation();
  const PRIVATE_PREFIXES = ["/dashboard", "/admin"];

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const armRefreshIn = (seconds: number) => {
    clearRefreshTimer();
    const capped = Math.min(seconds, Math.floor(2147483647 / 1000));
    const delayMs = Math.max(0, capped * 1000);
    const dueAt = Date.now() + delayMs;
    refreshTimer.current = window.setTimeout(async () => {
      if (refreshPending.current) {
        return;
      }
      refreshPending.current = true;
      try {
        const { refresh_in } = await authService.refresh();
        await refreshUser();
        armRefreshIn(refresh_in);
      } catch (e) {
        console.warn("[auth] refresh failed", e);
        // 401 -> évènement global déclenché dans apiFetch
      } finally {
        refreshPending.current = false;
      }
    }, delayMs);
  };

  const armFromStoredTsIfAny = () => {
    const ts = getNextRefreshTs();
    if (!ts) return;
    const seconds = Math.max(0, Math.round((ts - Date.now()) / 1000));
    if (seconds > 0) armRefreshIn(seconds);
  };

  // Boot : récupérer le user; si 401 -> /login
  useEffect(() => {
    authService.me()
      .then(u => { setUser(u); authService.cacheUser(u); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [navigate]);

  // (Ré)armer depuis le localStorage dès qu’on a un user
  useEffect(() => {
    if (user) {
      armFromStoredTsIfAny();
    } else {
      clearRefreshTimer();
      clearNextRefresh();
    }
    // pas de cleanup ici : on nettoie au logout / unmount
  }, [user]);

  // Cleanup à l’unmount du provider
  useEffect(() => {
    return () => {
      clearRefreshTimer();
      refreshPending.current = false;
    };
  }, []);

  // Écouter les 401 globaux et rediriger
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      clearRefreshTimer();
      clearNextRefresh();
      if (PRIVATE_PREFIXES.some(p => location.pathname.startsWith(p))) {
        navigate("/login", { replace: true });
      } else {
      }
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [navigate, location.pathname]);

  // Watchdog: toutes les 15s, si on a dépassé l’échéance refresh maintenant
  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      const ts = getNextRefreshTs();
      if (!ts) return;
      const overdue = Date.now() - ts; // ms
      if (overdue >= 0) {
        if (refreshPending.current) return;
        refreshPending.current = true;
        authService.refresh()
          .then(({ refresh_in }) => { refreshUser(); armRefreshIn(refresh_in); })
          .catch((e) => console.warn("[auth] watchdog refresh failed", e))
          .finally(() => { refreshPending.current = false; });
      }
    }, 15000);
    return () => window.clearInterval(id);
  }, [user]);

  // Re-sync quand l’onglet redevient actif
  useEffect(() => {
    const onWake = () => {
      const ts = getNextRefreshTs();
      if (!ts) return;
      const delta = ts - Date.now();
      if (delta <= 0) {
        if (refreshPending.current) return;
        refreshPending.current = true;
        authService.refresh()
          .then(({ refresh_in }) => { refreshUser(); armRefreshIn(refresh_in); })
          .catch(() => {})   // 401 → event global
          .finally(() => { refreshPending.current = false; });
      } else {
        armRefreshIn(Math.round(delta / 1000));
      }
    };
    window.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      window.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { refresh_in } = await authService.login(email, password);
    const me = await authService.me();
    setUser(me); authService.cacheUser(me);
    armRefreshIn(refresh_in);
  };

  const logout = async () => {
    try { await authService.logout(); }
    finally {
      setUser(null);
      clearRefreshTimer();
      clearNextRefresh();
      navigate("/login", { replace: true });
    }
  };

  const refreshUser = async () => {
    const me = await authService.me(); setUser(me); authService.cacheUser(me);
  };

  const hasRole = (...roles: Array<User["role"]>) => !!user && roles.includes(user.role);

  if (!ready) return null;
  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user, login, logout, refreshUser, hasRole }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

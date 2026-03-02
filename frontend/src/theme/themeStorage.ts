import { DEFAULT_THEME_CONFIG } from "./defaultThemeConfig";
import type { ThemeConfig } from "@/features/home/services/homeApi";

const STORAGE_KEY = "config";

export type ThemeMode = "light" | "dark";

/**
 * Sauvegarde la config de thème en fusionnant avec l'existant
 * => si le backend renvoie une nouvelle config, on met à jour les couleurs
 *    mais on NE PERD PAS le mode (theme_mode) choisi par l'utilisateur.
 */
export function saveThemeConfig(config: ThemeConfig) {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as ThemeConfig) : {};

    const merged: ThemeConfig = {
      ...existing,
      ...config,
    };

    // Si l'ancien avait déjà un theme_mode et que la nouvelle config n'en fournit pas,
    // on garde l'ancien (donc on ne repasse pas à "light" après un refresh).
    if ((existing as any).theme_mode && !(config as any).theme_mode) {
      (merged as any).theme_mode = (existing as any).theme_mode;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

/**
 * Charge la config depuis localStorage, avec fallback DEFAULT_THEME_CONFIG
 */
export function loadThemeConfig(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_CONFIG;
    const parsed = JSON.parse(raw) as ThemeConfig;
    return { ...DEFAULT_THEME_CONFIG, ...parsed };
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
}

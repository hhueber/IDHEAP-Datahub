import { DEFAULT_THEME_CONFIG } from "./defaultThemeConfig";
import type { ThemeConfig } from "@/features/home/services/homeApi";

const STORAGE_KEY = "config";

export function saveThemeConfig(config: ThemeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

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
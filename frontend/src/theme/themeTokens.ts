import type { ThemeConfig } from "@/features/home/services/homeApi";

export type ThemeMode = "light" | "dark";

/**
 * Retourne la couleur dark si mode=dark et si la clé existe,
 * sinon fallback sur light.
 */
export function pickThemeValue(
  cfg: ThemeConfig,
  mode: ThemeMode,
  lightKey: string,
  darkKey: string
): string {
  const light = cfg[lightKey];
  const dark = cfg[darkKey];

  // Si on est en dark MAIS que la clé dark n’existe pas encore (PR pas mergée),
  // on fallback sur light.
  return (mode === "dark" ? (dark ?? light) : light) ?? "";
}

export function getThemeTokens(cfg: ThemeConfig, mode: ThemeMode) {
  const primary = pickThemeValue(cfg, mode, "colour_light_primary", "colour_dark_primary");
  const textColor = pickThemeValue(cfg, mode, "colour_light_text", "colour_dark_text");
  const background = pickThemeValue(cfg, mode, "colour_light_background", "colour_dark_background");
  const borderColor = pickThemeValue(cfg, mode, "colour_light_secondary", "colour_dark_secondary");

  const navbarOverlayBg = pickThemeValue(cfg, mode, "navbar_overlay_light_bg", "navbar_overlay_dark_bg");

  const countryColors = pickThemeValue(cfg, mode, "country_light", "country_dark");
  const lakesColores = pickThemeValue(cfg, mode, "lakes_light", "lakes_dark");
  const cantonClores = pickThemeValue(cfg, mode, "canton_light", "canton_dark");
  const districtColores = pickThemeValue(cfg, mode, "district_light", "district_dark");
  const communesColores = pickThemeValue(cfg, mode, "communes_light", "communes_dark");

  return {
    primary,
    textColor,
    background,
    borderColor,
    navbarOverlayBg,
    countryColors,
    lakesColores,
    cantonClores,
    districtColores,
    communesColores,
  };
}

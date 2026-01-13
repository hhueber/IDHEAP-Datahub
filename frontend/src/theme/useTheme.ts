import { useMemo } from "react";
import { loadThemeConfig } from "@/theme/themeStorage";
import { getThemeTokens } from "@/theme/themeTokens";

export function useTheme() {
  const cfg = loadThemeConfig();

  return useMemo(() => {
    const effectiveMode: "light" | "dark" = "light";
    const tokens = getThemeTokens(cfg, effectiveMode);

    return {
      effectiveMode,
      cfg,
      ...tokens,

      // dérivés des couleurs de base suite dans partie 2
      hoverText05: tokens.textColor,
      hoverText07: tokens.textColor,
      hoverText30: tokens.textColor,
      adaptiveTextColorPrimary: tokens.primary,
      hoverPrimary04: tokens.primary,
      hoverPrimary06: tokens.primary,
      hoverPrimary15: tokens.primary,
      hoverPrimary90: tokens.primary,
      hoverBg08: tokens.primary,
    };
  }, [cfg]);
}
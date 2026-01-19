import { useMemo } from "react";
import { loadThemeConfig } from "@/theme/themeStorage";
import { useThemeMode } from "@/theme/ThemeContext";
import { getThemeTokens } from "@/theme/themeTokens";
import { hexToRgba, getAdaptiveTextColor } from "@/utils/color";

export function useTheme() {
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();

  return useMemo(() => {
    const tokens = getThemeTokens(cfg, mode);

    return {
      mode,
      cfg,
      ...tokens,

      // dérivés (optionnel mais pratique)
      hoverText05: hexToRgba(tokens.textColor, 0.5),
      hoverText07: hexToRgba(tokens.textColor, 0.7),
      hoverText30: hexToRgba(tokens.textColor, 0.30),
      adaptiveTextColorPrimary: getAdaptiveTextColor(tokens.primary),
      hoverPrimary04: hexToRgba(tokens.primary, 0.04),
      hoverPrimary06: hexToRgba(tokens.primary, 0.06),
      hoverPrimary15: hexToRgba(tokens.primary, 0.15),
      hoverPrimary90: hexToRgba(tokens.primary, 0.90),
      hoverBg08: hexToRgba(tokens.primary, 0.08),
    };
  }, [mode, cfg]);
}

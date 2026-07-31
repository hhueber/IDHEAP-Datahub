import React from "react";
import { getAdaptiveTextColor } from "@/utils/color";
import { useTranslation } from "react-i18next";
import { DEFAULT_THEME_CONFIG } from "@/theme/defaultThemeConfig";
import { getThemeTokens } from "@/theme/themeTokens";

type MaybeColor = string | null | undefined;

function normalizeColor(color: MaybeColor, fallback: string): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  // On accepte aussi les rgba(...) pour ne pas casser ton thème actuel
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;
  return fallback;
}

type ThemePreviewPanelProps = {
  variant: "light" | "dark";
  logoUrl?: string;
  title: string;
  backgroundColor?: MaybeColor;
  logoBackground?: MaybeColor;
  textColor?: MaybeColor;
  primaryColor?: MaybeColor;
  secondaryColor?: MaybeColor;
  selectionColor?: MaybeColor;
};

export function ThemePreviewPanel({
  variant,
  logoUrl,
  title,
  backgroundColor,
  logoBackground,
  textColor,
  primaryColor,
  secondaryColor,
  selectionColor,
}: ThemePreviewPanelProps) {
  const baseTokens = getThemeTokens(DEFAULT_THEME_CONFIG, variant);
  // Fallbacks "safe" pour éviter un preview illisible si la config est vide/invalide.
  const bg = normalizeColor(backgroundColor, baseTokens.background);
  const primary = normalizeColor(primaryColor, baseTokens.primary);
  const secondary = normalizeColor(secondaryColor, baseTokens.borderColor);
  const text = normalizeColor(textColor, baseTokens.textColor);
  const logoBg = normalizeColor(logoBackground, baseTokens.logoBackground);
  const selection = normalizeColor(selectionColor, baseTokens.selectionColor);

  const cardText = getAdaptiveTextColor(bg);
  const { t } = useTranslation();

  return (
    <div
      className="rounded-xl border p-3 text-xs shadow-sm"
      style={{ backgroundColor: bg, color: cardText, borderColor: secondary }}
    >
      <div className="mb-2 text-[11px] font-semibold opacity-80">
        {title}
      </div>

      {/* Barre supérieure style navbar */}
      <div
        className="mb-3 h-4 rounded-md"
        style={{ backgroundColor: primary }}
      />

      {/* Logo preview */}
      {logoUrl ? (
        <div
          className="mb-3 inline-flex items-center justify-center rounded-md border px-3 py-2"
          style={{ backgroundColor: logoBg, borderColor: secondary }}
        >
          <img
            src={logoUrl}
            alt="logo preview"
            className="max-h-10 max-w-[180px] object-contain select-none"
            draggable={false}
          />
        </div>
      ) : null}

      {/* Contenu principal */}
      <div className="space-y-2">
        <div className="text-[11px]" style={{ color: text }}>
          {t("admin.config.themeConfigPage.previewPanel.text")}
        </div>

        {/* Bouton primary avec bordure secondary */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md px-3 py-1 text-[11px] font-medium shadow-sm"
          style={{
            backgroundColor: primary,
            border: `1px solid ${secondary}`,
            color: getAdaptiveTextColor(primary),
          }}
        >
          {t("admin.config.themeConfigPage.previewPanel.buttonPrimary")}
        </button>

        {/* Badge / chip avec secondary donc cadre secondaire*/}
        <span
          className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium"
          style={{
            border: `1px solid ${secondary}`,
            color: text,
            backgroundColor: bg,
          }}
        >
          {t("admin.config.themeConfigPage.previewPanel.secondaryFrame")}
        </span>
        <div
          className="rounded-md px-2 py-2 text-[11px] font-medium"
          style={{
            backgroundColor: selection,
            color: getAdaptiveTextColor(selection),
            border: `1px solid ${secondary}`,
          }}
        >
          {t("admin.config.themeConfigPage.previewPanel.selection")}
        </div>
      </div>
    </div>
  );
}

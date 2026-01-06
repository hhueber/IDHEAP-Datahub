import React from "react";
import { getAdaptiveTextColor } from "@/utils/color";
import { useTranslation } from "react-i18next";

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
  title: string;
  backgroundColor?: MaybeColor;
  textColor?: MaybeColor;
  primaryColor?: MaybeColor;
  secondaryColor?: MaybeColor;
};

export function ThemePreviewPanel({
  variant,
  title,
  backgroundColor,
  textColor,
  primaryColor,
  secondaryColor,
}: ThemePreviewPanelProps) {
  const bg = normalizeColor(
    backgroundColor,
    variant === "dark" ? "#020617" : "#ffffff"
  );
  const primary = normalizeColor(
    primaryColor,
    variant === "dark" ? "#FB377F" : "#D60270"
  );
  const secondary = normalizeColor(
    secondaryColor,
    variant === "dark" ? "rgba(148,163,184,0.45)" : "rgba(0,0,0,0.10)"
  );
  const text = normalizeColor(
    textColor,
    variant === "dark" ? "#F9FAFB" : "#111827"
  );

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

        {/* Badge / chip avec secondary */}
        <span
          className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium"
          style={{
            border: `1px solid ${secondary}`,
            color: text,
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        >
          {t("admin.config.themeConfigPage.previewPanel.secondaryFrame")}
        </span>
      </div>
    </div>
  );
}

type MapPreviewPanelProps = {
  variant: "light" | "dark";
  title: string;
  backgroundColor?: MaybeColor;
  communeColor?: MaybeColor;
  districtColor?: MaybeColor;
  cantonColor?: MaybeColor;
  countryColor?: MaybeColor;
  lakesColor?: MaybeColor;
};

export function MapPreviewPanel({
  variant,
  title,
  backgroundColor,
  communeColor,
  districtColor,
  cantonColor,
  countryColor,
  lakesColor,
}: MapPreviewPanelProps) {
  const bg = normalizeColor(
    backgroundColor,
    variant === "dark" ? "#020617" : "#ffffff"
  );
  const text = getAdaptiveTextColor(bg);

  const rows: { label: string; color: MaybeColor }[] = [
    { label: "Communes", color: communeColor },
    { label: "Districts", color: districtColor },
    { label: "Cantons", color: cantonColor },
    { label: "Country", color: countryColor },
    { label: "Lakes", color: lakesColor },
  ];

  const fallbackColors = {
    Communes: "#22c55e",
    Districts: "#a855f7",
    Cantons: "#f87171",
    Country: "#000000",
    Lakes: "#0ea5e9",
  } as const;

  return (
    <div
      className="rounded-xl border p-3 text-xs shadow-sm"
      style={{ backgroundColor: bg, color: text, borderColor: "rgba(148,163,184,0.45)" }}
    >
      <div className="mb-2 text-[11px] font-semibold opacity-80">
        {title}
      </div>

      <div className="grid grid-cols-1 gap-1">
        {rows.map((r) => {
          const c = normalizeColor(
            r.color,
            // @ts-expect-error – accès volontaire au petit objet fallback
            fallbackColors[r.label] || "#6b7280"
          );
          return (
            <div
              key={r.label}
              className="flex items-center gap-2 rounded-md px-2 py-1"
              style={{
                backgroundColor:
                  variant === "dark"
                    ? "rgba(15,23,42,0.6)"
                    : "rgba(255,255,255,0.7)",
              }}
            >
              <span
                className="inline-block h-3 w-6 rounded-sm border"
                style={{ backgroundColor: c }}
              />
              <span className="text-[11px] opacity-80">{r.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

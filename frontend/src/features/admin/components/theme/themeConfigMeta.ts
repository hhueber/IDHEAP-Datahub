import type { ThemeConfigDto } from "@/services/config";
import type { Preset } from "@/features/admin/components/theme/PresetsSection";

export type SaveState = "idle" | "saving" | "success" | "error";

export type ColorFieldDef = {
  key: keyof ThemeConfigDto;
  labelKey: string;
};

export const LIGHT_FIELDS: ColorFieldDef[] = [
  { key: "colour_light_primary", labelKey: "admin.config.themeConfigPage.primaryColourLabel" },
  { key: "colour_light_secondary", labelKey: "admin.config.themeConfigPage.secondaryColourLabel" },
  { key: "colour_light_background", labelKey: "admin.config.themeConfigPage.backgroundColourLabel" },
  { key: "colour_light_text", labelKey: "admin.config.themeConfigPage.textColourLabel" },
  { key: "navbar_overlay_light_bg", labelKey: "admin.config.themeConfigPage.navbarOverlayLabel" },
  { key: "logoBackground_light", labelKey: "admin.config.themeConfigPage.logoBackgroundLabel" },
];

export const DARK_FIELDS: ColorFieldDef[] = [
  { key: "colour_dark_primary", labelKey: "admin.config.themeConfigPage.primaryColourLabel" },
  { key: "colour_dark_secondary", labelKey: "admin.config.themeConfigPage.secondaryColourLabel" },
  { key: "colour_dark_background", labelKey: "admin.config.themeConfigPage.backgroundColourLabel" },
  { key: "colour_dark_text", labelKey: "admin.config.themeConfigPage.textColourLabel" },
  { key: "navbar_overlay_dark_bg", labelKey: "admin.config.themeConfigPage.navbarOverlayLabel" },
  { key: "logoBackground_dark", labelKey: "admin.config.themeConfigPage.logoBackgroundLabel" },
];

export const MAP_LIGHT_FIELDS: ColorFieldDef[] = [
  { key: "communes_light", labelKey: "admin.config.themeConfigPage.communesColourLabel" },
  { key: "district_light", labelKey: "admin.config.themeConfigPage.districtColourLabel" },
  { key: "canton_light", labelKey: "admin.config.themeConfigPage.cantonColourLabel" },
  { key: "country_light", labelKey: "admin.config.themeConfigPage.countryColourLabel" },
  { key: "lakes_light", labelKey: "admin.config.themeConfigPage.lakesColourLabel" },
];

export const MAP_DARK_FIELDS: ColorFieldDef[] = [
  { key: "communes_dark", labelKey: "admin.config.themeConfigPage.communesColourLabel" },
  { key: "district_dark", labelKey: "admin.config.themeConfigPage.districtColourLabel" },
  { key: "canton_dark", labelKey: "admin.config.themeConfigPage.cantonColourLabel" },
  { key: "country_dark", labelKey: "admin.config.themeConfigPage.countryColourLabel" },
  { key: "lakes_dark", labelKey: "admin.config.themeConfigPage.lakesColourLabel" },
];

export const PRESETS: Preset[] = [
  {
    name: "Blue",
    light: {
      colour_light_primary: "#2563eb",
      colour_light_secondary: "#1d4ed8",
      colour_light_background: "#f9fafb",
      colour_light_text: "#111827",
    },
    dark: {
      colour_dark_primary: "#1d4ed8",
      colour_dark_secondary: "#1e293b",
      colour_dark_background: "#020617",
      colour_dark_text: "#e5e7eb",
    },
  },
  {
    name: "Green",
    light: {
      colour_light_primary: "#16a34a",
      colour_light_secondary: "#15803d",
      colour_light_background: "#f9fafb",
      colour_light_text: "#022c22",
    },
    dark: {
      colour_dark_primary: "#15803d",
      colour_dark_secondary: "#052e16",
      colour_dark_background: "#020617",
      colour_dark_text: "#e5e7eb",
    },
  },
];

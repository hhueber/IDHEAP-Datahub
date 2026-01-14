// theme par défaut en cas de bug
import type { ThemeConfig } from "@/features/home/services/homeApi";

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  instance_name: "IDHEAP DataHub",
  logo_url: "/img/idheap-dh.png",

  colour_light_primary: "#D60270",
  colour_light_secondary: "rgba(0,0,0,0.10)",
  colour_light_background: "#FFFFFF",
  colour_light_text: "#111827",

  navbar_overlay_light_bg: "rgba(0,0,0,0.30)",           // fond sombre derrière le menu
  logoBackground_light: "#FFFFFF",

  communes_light: "#16a34a",
  district_light: "#7c3aed",
  canton_light: "#ef4444",
  country_light: "#000000",
  lakes_light: "#3b82f6",

  navbar_overlay_dark_bg: "rgba(15,23,42,0.85)",
  logoBackground_dark: "#FFFFFF",

  colour_dark_primary: "#FB377F",
  colour_dark_secondary: "rgba(148,163,184,0.45)",
  colour_dark_background: "#020617",
  colour_dark_text: "#F9FAFB",

  communes_dark: "#22c55e",
  district_dark: "#a855f7",
  canton_dark: "#f87171",
  country_dark: "#e5e7eb",
  lakes_dark: "#0ea5e9",

  theme_default_mode: "light",
};

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

  communes_light: "#16a34a",
  district_light: "#7c3aed",
  canton_light: "#ef4444",
  country_light: "#000000",
  lakes_light: "#3b82f6",

  navbar_overlay_dark_bg: "rgba(0,0,0,0.65)",

  colour_dark_primary: "#FB377F",
  colour_dark_secondary: "#60A5FA",
  colour_dark_background: "#020617",
  colour_dark_text: "#E5E7EB",

  communes_dark: "#4ade80",
  district_dark: "#c4b5fd",
  canton_dark: "#fca5a5",
  country_dark: "#f9fafb",
  lakes_dark: "#60a5fa",

  theme_default_mode: "light",
};

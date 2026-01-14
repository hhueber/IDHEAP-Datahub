import { apiFetch } from "@/shared/apiFetch";

export type ThemeMode = "light" | "dark";

export interface ThemeConfigDto {
  instance_name?: string | null;
  logo_url?: string | null;

  // LIGHT
  colour_light_primary?: string | null;
  colour_light_secondary?: string | null;
  colour_light_background?: string | null;
  colour_light_text?: string | null;
  navbar_overlay_light_bg?: string | null;

  communes_light?: string | null;
  district_light?: string | null;
  canton_light?: string | null;
  country_light?: string | null;
  lakes_light?: string | null;

  // DARK
  colour_dark_primary?: string | null;
  colour_dark_secondary?: string | null;
  colour_dark_background?: string | null;
  colour_dark_text?: string | null;
  navbar_overlay_dark_bg?: string | null;

  communes_dark?: string | null;
  district_dark?: string | null;
  canton_dark?: string | null;
  country_dark?: string | null;
  lakes_dark?: string | null;

  theme_default_mode?: ThemeMode;
}

export type ApiResponse<T> = {
  success: boolean;
  detail: string;
  data: T;
};

export async function fetchThemeConfig(): Promise<ThemeConfigDto> {
  const res = await apiFetch<ApiResponse<ThemeConfigDto>>("/config/theme", {
    method: "GET",
    auth: true,
  });
  return res.data;
}

export async function saveThemeConfig(payload: ThemeConfigDto): Promise<void> {
  // On envoie tout l'objet, Pydantic gère les champs optionnels.
  await apiFetch<ApiResponse<unknown>>("/config/theme", {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function uploadThemeLogo(dataUrl: string): Promise<string> {
  const res = await apiFetch<{
    success: boolean;
    detail: string;
    data?: { url: string };
  }>("/config/theme/logo", {
    method: "POST",
    auth: true,
    body: {
      image_data: dataUrl,
    },
  });

  if (!res.success || !res.data?.url) {
    throw new Error(res.detail || "Logo upload failed");
  }

  return res.data.url;
}

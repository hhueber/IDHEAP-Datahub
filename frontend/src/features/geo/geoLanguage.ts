export function normalizeGeoLanguage(
  language?: string | null
): string {
  const normalizedLanguage =
    language
      ?.trim()
      .toLowerCase()
      .replace("_", "-")
      .split("-")[0] || "en";

  return normalizedLanguage;
}

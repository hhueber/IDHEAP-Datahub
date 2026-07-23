export function normalizeGeoLanguage(
  language?: string | null
): string {
  return (
    language
      ?.trim()
      .toLowerCase()
      .replace("_", "-")
      .split("-")[0] || "en"
  );
}
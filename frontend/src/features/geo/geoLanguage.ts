export function normalizeGeoLanguage(
  language?: string | null
): string {
  const normalizedLanguage =
    language
      ?.trim()
      .toLowerCase()
      .replace("_", "-")
      .split("-")[0] || "en";

  // Le frontend utilise "rm" pour le romanche,
  // tandis que le backend utilise actuellement "ro".
  if (normalizedLanguage === "rm") {
    return "ro";
  }

  return normalizedLanguage;
}
const SUPPORTED_PAGE_ALL_LANGS = ["fr", "de", "it", "ro", "en"] as const;

export type PageAllLang = (typeof SUPPORTED_PAGE_ALL_LANGS)[number];

export function getPageAllLang(i18nLanguage?: string): PageAllLang {
  const fromI18n = i18nLanguage?.split("-")[0];

  const fromStorage =
    localStorage.getItem("i18nextLng")

  const normalized = (fromI18n || fromStorage || "fr").split("-")[0];

  if (SUPPORTED_PAGE_ALL_LANGS.includes(normalized as PageAllLang)) {
    return normalized as PageAllLang;
  }

  return "fr";
}
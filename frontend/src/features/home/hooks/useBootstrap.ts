import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { homeApi, HomeBootstrap } from "@/features/home/services/homeApi";

import { saveThemeConfig, loadThemeConfig } from "@/theme/themeStorage";

// Cache par langue
const cacheByLang = new Map<string, HomeBootstrap>();

export function useBootstrap() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";

  const [data, setData] = useState<HomeBootstrap | null>(cacheByLang.get(lang) ?? null);
  const [loading, setLoading] = useState(!cacheByLang.has(lang));
  const [error, setError] = useState<Error | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (cacheByLang.has(lang)) {
      const d = cacheByLang.get(lang)!;

      // -> Même si c'est du cache, on vérifie themeConfig : si absent -> charger depuis localStorage
      if (!d.themeConfig) {
        d.themeConfig = loadThemeConfig();
      }

      setData(d);
      setLoading(false);
      setError(null);
      setErrorKey(null);
      return;
    }

    const c = new AbortController();
    setLoading(true);
    setError(null);
    setErrorKey(null);

    homeApi
      .getBootstrap(c.signal, lang)
      .then((d) => {
        if (d.themeConfig) {
          saveThemeConfig(d.themeConfig);
        } else {
          // -> Si pas de config reçue -> fallback localStorage ou defaults
          d.themeConfig = loadThemeConfig();
        }
        cacheByLang.set(lang, d);
        setData(d);
      })
      .catch((e) => {
        if ((e as any)?.name !== "AbortError") {
          setError(e as Error);
          // erreur lors du chargement des datas initiales sur home Pages
          setErrorKey("home.bootstrapError");
        }
      })
      .finally(() => setLoading(false));

    return () => c.abort();
  }, [lang]);

  return { data, loading, error, errorKey, lang };
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { homeApi, HomeBootstrap } from "@/features/home/services/homeApi";

// Cache par langue
const cacheByLang = new Map<string, HomeBootstrap>();

export function useBootstrap() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";

  const [data, setData] = useState<HomeBootstrap | null>(cacheByLang.get(lang) ?? null);
  const [loading, setLoading] = useState(!cacheByLang.has(lang));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cacheByLang.has(lang)) {
      setData(cacheByLang.get(lang)!);
      setLoading(false);
      setError(null);
      return;
    }

    const c = new AbortController();
    setLoading(true);
    setError(null);

    homeApi.getBootstrap(c.signal, lang)
      .then((d) => {
        cacheByLang.set(lang, d);
        setData(d);
      })
      .catch((e) => {
        if ((e as any)?.name !== "AbortError") setError(e as Error);
      })
      .finally(() => setLoading(false));

    return () => c.abort();
  }, [lang]);

  return { data, loading, error, lang };
}
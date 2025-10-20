import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { questionsApi } from "@/features/questions/services/questionsApi";
import type { QuestionItem } from "@/features/home/services/homeApi";

/** Charge les questions d'un survey (réactif à l'ID et à la langue) */
export function useSurveyQuestions(surveyUid: number | null) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";

  const [data, setData] = useState<QuestionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (surveyUid == null) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    const c = new AbortController();
    setLoading(true);
    setError(null);

    questionsApi
      .getBySurvey(surveyUid, c.signal, lang)
      .then((result) => setData(result.items))
      .catch((e) => {
        if ((e as any)?.name !== "AbortError") setError(e as Error);
      })
      .finally(() => setLoading(false));

    return () => c.abort();
  }, [surveyUid, lang]); // relance si l'ID ou la langue change

  return { data, loading, error };
}

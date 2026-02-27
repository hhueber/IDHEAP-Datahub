import { useEffect, useState } from "react";
import { questionsApi } from "@/features/questions/services/questionsApi";

export function useQuestionYears(questionUid: number | null, scope: "per_survey" | "global") {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof questionUid !== "number") {
      setYears([]);
      setLoading(false);
      setErrorKey(null);
      return;
    }

    const ctrl = new AbortController();
    let alive = true;

    setLoading(true);
    setErrorKey(null);

    questionsApi
      .getAvailableYears(questionUid, scope, ctrl.signal)
      .then((res) => {
        if (!alive) return;
        setYears(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!alive) return;
        setErrorKey("home.bootstrapError");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [questionUid, scope]);

  return { years, loading, errorKey };
}

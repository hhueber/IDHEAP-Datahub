import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function useConfigResource<T>(api: {
  list: () => Promise<{ success: boolean; detail: string; data: T[] }>;
  upsert: (body: T) => Promise<{ success: boolean; detail: string }>;
  remove: (code: string) => Promise<{ success: boolean; detail: string }>;
}) {
  const { t } = useTranslation();

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await api.list();
      if (r.success) setItems(r.data || []); else setErr(r.detail || t("config.errors.loadFailed"));
    } catch { setErr(t("config.errors.network")); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const save = async (body: T) => {
    setMsg(null); setErr(null);
    const r = await api.upsert(body);
    if (r.success) { setMsg(r.detail || t("config.errors.saved")); await reload(); } else setErr(r.detail || t("config.errors.saveFailed"));
  };

  const remove = async (code: string) => {
    setMsg(null); setErr(null);
    const r = await api.remove(code);
    if (r.success) { setMsg(r.detail || t("config.errors.deleted")); await reload(); } else setErr(r.detail || t("config.errors.deleteFailed"));
  };

  return { items, loading, msg, err, reload, save, remove, setMsg, setErr };
}

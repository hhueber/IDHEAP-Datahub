import { useEffect, useState } from "react";

export function useConfigResource<T>(api: {
  list: () => Promise<{ success: boolean; detail: string; data: T[] }>;
  upsert: (body: T) => Promise<{ success: boolean; detail: string }>;
  remove: (code: string) => Promise<{ success: boolean; detail: string }>;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await api.list();
      if (r.success) setItems(r.data || []); else setErr(r.detail || "Failed to load");
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const save = async (body: T) => {
    setMsg(null); setErr(null);
    const r = await api.upsert(body);
    if (r.success) { setMsg(r.detail || "Saved"); await reload(); } else setErr(r.detail || "Save failed");
  };

  const remove = async (code: string) => {
    setMsg(null); setErr(null);
    const r = await api.remove(code);
    if (r.success) { setMsg(r.detail || "Deleted"); await reload(); } else setErr(r.detail || "Delete failed");
  };

  return { items, loading, msg, err, reload, save, remove, setMsg, setErr };
}

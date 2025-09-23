import React, { useState } from "react";
import { deleteMember } from "@/services/admin";
import { ApiError } from "@/shared/apiFetch";

export default function DeleteMemberPage() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", role: "MEMBER" as "MEMBER" | "ADMIN" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErr(null); setMsg(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setErr(null); setMsg(null);
    try {
      const r = await deleteMember(form);
      if (r.success) setMsg(r.detail || "Utilisateur supprimé");
      else setErr(r.detail || "Échec de suppression");
    } catch (e: any) {
      const ae = e as ApiError;
      const d = (ae.details as any)?.detail;
      if (Array.isArray(d)) setErr(d.map((x: any) => x.msg).join(" · "));
      else setErr(d || ae.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Supprimer un membre</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Prénom</label>
            <input name="first_name" value={form.first_name} onChange={onChange} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div><label className="block text-sm font-medium mb-1">Nom</label>
            <input name="last_name" value={form.last_name} onChange={onChange} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div><label className="block text-sm font-medium mb-1">Rôle</label>
          <select name="role" value={form.role} onChange={onChange} className="w-full rounded-lg border px-3 py-2">
            <option value="MEMBER">Membre</option><option value="ADMIN">Admin</option>
          </select>
        </div>
        {msg && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700 text-sm">{msg}</div>}
        {err && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">{err}</div>}
        <button type="submit" disabled={submitting} className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60">
          {submitting ? "Suppression..." : "Supprimer"}
        </button>
      </form>
    </section>
  );
}
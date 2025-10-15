import React, { useState } from "react";
import { createMember } from "@/services/admin";
import { ApiError } from "@/shared/apiFetch";

export default function AddMemberPage() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", role: "MEMBER" as "MEMBER" | "ADMIN", password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErr(null); setMsg(null);
  };

  const validate = () => {
    if (form.password !== form.confirm) { setErr("La confirmation ne correspond pas"); return false; }
    if (form.password.length < 10) { setErr("Mot de passe trop court (min. 10 caractères)"); return false; }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setErr(null); setMsg(null);
    try {
      const r = await createMember(form);
      if (r.success) setMsg(r.detail || "Membre créé");
      else setErr(r.detail || "Échec");
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
    <section className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Ajouter un membre</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input name="password" type="password" value={form.password} onChange={onChange} className="w-full rounded-lg border px-3 py-2" />
            <p className="text-xs text-gray-500 mt-1">≥10 caractères, 1 maj, 1 min, 1 chiffre, 1 spécial</p>
          </div>
          <div><label className="block text-sm font-medium mb-1">Confirmation</label>
            <input name="confirm" type="password" value={form.confirm} onChange={onChange} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        {msg && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700 text-sm">{msg}</div>}
        {err && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">{err}</div>}
        <button type="submit" disabled={submitting} className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60">
          {submitting ? "Création..." : "Créer le membre"}
        </button>
      </form>
    </section>
  );
}

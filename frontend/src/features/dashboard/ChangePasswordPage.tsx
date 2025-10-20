// Formulaire de changement de mot de passe (utilisateur) avec validation simple et retours UI
import React, { useState } from "react";
import { changePassword } from "@/services/user";
import { ApiError } from "@/shared/apiFetch";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Maj champs + reset messages
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErr(null); setMsg(null);
  };

  // Validation minimale côté client
  const validate = () => {
    if (form.new_password !== form.confirm) { setErr("La confirmation ne correspond pas"); return false; }
    if (form.new_password.length < 10) { setErr("Mot de passe trop court (min. 10 caractères)"); return false; }
    return true;
  };

  // Soumission -> appel API + gestion des retours
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setErr(null); setMsg(null);
    try {
      const r = await changePassword(form);
      if (r.success) { setMsg(r.detail || "Mot de passe modifié"); setForm({ old_password: "", new_password: "", confirm: "" }); }
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
    <section className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Changer mon mot de passe</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div><label className="block text-sm font-medium mb-1">Ancien mot de passe</label>
          <input name="old_password" type="password" value={form.old_password} onChange={onChange} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div><label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
          <input name="new_password" type="password" value={form.new_password} onChange={onChange} className="w-full rounded-lg border px-3 py-2" />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 10 caractères, avec au moins : 1 lettre majuscule, 1 lettre minuscule, 1 chiffre et 1 symbole (ex. !@#$%&*).
          </p>
        </div>
        <div><label className="block text-sm font-medium mb-1">Confirmation</label>
          <input name="confirm" type="password" value={form.confirm} onChange={onChange} className="w-full rounded-lg border px-3 py-2" />
        </div>
        {/* Messages de succès / erreur */}
        {msg && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700 text-sm">{msg}</div>}
        {err && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">{err}</div>}
        {/* Action */}
        <button type="submit" disabled={submitting} className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60">
          {submitting ? "Modification..." : "Modifier"}
        </button>
      </form>
    </section>
  );
}

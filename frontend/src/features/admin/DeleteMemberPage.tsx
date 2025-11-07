// Formulaire de suppression de membre (admin/membre) avec retour succès/erreur
import React, { useState } from "react";
import { deleteMember } from "@/services/admin";
import { ApiError } from "@/shared/apiFetch";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";

type Role = "MEMBER" | "ADMIN";

export default function DeleteMemberPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<{ first_name: string; last_name: string; email: string; role: Role }>({
    first_name: "",
    last_name: "",
    email: "",
    role: "MEMBER",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msgKey, setMsgKey] = useState<string | null>(null);
  const [errKey, setErrKey] = useState<string | null>(null);

  // Maj champs + reset messages
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrKey(null);
    setMsgKey(null);
  };

  // Soumission -> appel API + gestion retours
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrKey(null);
    setMsgKey(null);
    try {
      const r = await deleteMember(form);
      if (r.success) {
        setMsgKey("admin.deleteMember.success");
        setForm({ first_name: "", last_name: "", email: "", role: "MEMBER" });
      } else {
        setErrKey("admin.deleteMember.fail");
      }
    } catch (e: any) {
      const ae = e as ApiError;
      const d = (ae.details as any)?.detail;
      if (Array.isArray(d)) setErrKey(d.map((x: any) => x.msg).join(" · "));
      else setErrKey("admin.deleteMember.errors.generic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">{t("admin.deleteMember.title")}</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Identité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">{t("admin.deleteMember.firstNameLabel")}</label>
            <input name="first_name" value={form.first_name} onChange={onChange} className="w-full rounded-lg border px-3 py-2"
              placeholder={t("admin.deleteMember.firstNamePlaceholder")}
              autoComplete="given-name" 
            />
          </div>
          {/* Contact */}
          <div><label className="block text-sm font-medium mb-1">{t("admin.deleteMember.lastNameLabel")}</label>
            <input name="last_name" value={form.last_name} onChange={onChange} className="w-full rounded-lg border px-3 py-2" 
              placeholder={t("admin.deleteMember.lastNamePlaceholder")}
              autoComplete="family-name"
            />
          </div>
        </div>
        <div><label className="block text-sm font-medium mb-1">{t("admin.deleteMember.emailLabel")}</label>
          <input name="email" type="email" value={form.email} onChange={onChange} className="w-full rounded-lg border px-3 py-2" 
            placeholder={t("admin.deleteMember.emailPlaceholder")}
            autoComplete="email"
            required
          />
        </div>
        {/* Rôle (double check côté serveur) */}
        <div><label className="block text-sm font-medium mb-1">{t("admin.deleteMember.roleLabel")}</label>
          <select name="role" value={form.role} onChange={onChange} className="w-full rounded-lg border px-3 py-2">
            <option value="MEMBER">{t("admin.deleteMember.roles.member")}</option><option value="ADMIN">{t("admin.deleteMember.roles.admin")}</option>
          </select>
        </div>
        {/* Messages */}
        {msgKey && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700 text-sm">{t(msgKey)}</div>}
        {errKey && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">{t(errKey)}</div>}
        {/* Action */}
        <button type="submit" disabled={submitting} className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60">
          {submitting ? <LoadingDots label={t("admin.deleteMember.submitting")} /> : t("admin.deleteMember.submit")}
        </button>
      </form>
    </section>
  );
}

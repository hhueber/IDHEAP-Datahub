// Formulaire de suppression de membre (admin/membre) avec retour succès/erreur
import React, { useState } from "react";
import { deleteMember } from "@/services/admin";
import { ApiError } from "@/shared/apiFetch";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { Button, TextField, FormMessage } from "@/utils/UI";
import type { Role } from "@/config/roles";
import { useTheme } from "@/theme/useTheme";


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

  const { textColor, background, borderColor, primary } = useTheme();

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
        // la suppression a échoué
        setErrKey("admin.deleteMember.fail");
      }
    } catch (e: any) {
      const ae = e as ApiError;
      const d = (ae.details as any)?.detail;
      // erreur de validation coté serveur
      if (Array.isArray(d)) setErrKey("admin.deleteMember.errors.serverValidation");
      // membre non trouvé
      else if (ae?.status === 404) setErrKey("admin.deleteMember.errors.notFound");
      // action interdite
      else if (ae?.status === 403) setErrKey("admin.deleteMember.errors.forbidden");
      // erreur générique
      else setErrKey("admin.deleteMember.errors.generic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="p-6 max-w-xl" 
      style={{
        backgroundColor: background,
        color: textColor,
      }}>
      <h1 className="text-2xl font-semibold mb-4" style={{ color: textColor }}>{t("admin.deleteMember.title")}</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Identité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label={t("admin.deleteMember.firstNameLabel")}
            name="first_name"
            value={form.first_name}
            onChange={onChange}
            placeholder={t("admin.deleteMember.firstNamePlaceholder")}
            autoComplete="given-name"
          />
          {/* Contact */}
          <TextField
            label={t("admin.deleteMember.lastNameLabel")}
            name="last_name"
            value={form.last_name}
            onChange={onChange}
            placeholder={t("admin.deleteMember.lastNamePlaceholder")}
            autoComplete="family-name"
          />
        </div>
        <TextField
          label={t("admin.deleteMember.emailLabel")}
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder={t("admin.deleteMember.emailPlaceholder")}
          autoComplete="email"
          required
        />
        {/* Rôle (double check côté serveur) */}
        <div><label className="block text-sm font-medium mb-1">{t("admin.deleteMember.roleLabel")}</label>
          <select name="role" value={form.role} onChange={onChange} className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              color: textColor,
              borderColor: borderColor,
            }}>
            <option value="MEMBER">{t("admin.deleteMember.roles.member")}</option><option value="ADMIN">{t("admin.deleteMember.roles.admin")}</option>
          </select>
        </div>
        {/* Messages */}
        {msgKey && <FormMessage tone="success">{t(msgKey)}</FormMessage>}
        {errKey && <FormMessage tone="error">{t(errKey)}</FormMessage>}
        {/* Action */}
        <Button
          type="submit"
          disabled={submitting}
          style={{ borderColor: primary, borderWidth: 1, borderStyle: "solid" }}
        >
          {submitting ? <LoadingDots label={t("admin.deleteMember.submitting")} /> : t("admin.deleteMember.submit")}
        </Button>
      </form>
    </section>
  );
}

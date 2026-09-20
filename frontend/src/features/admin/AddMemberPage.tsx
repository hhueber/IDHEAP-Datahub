// Formulaire d’ajout de membre (admin/membre) avec validation minimale et affichage d’erreurs/succès
import React, { useState } from "react";
import { createMember } from "@/services/admin";
import { ApiError } from "@/shared/apiFetch";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import PasswordField from "@/utils/PasswordField";
import { Button, TextField, FormMessage } from "@/utils/UI";
import type { Role } from "@/config/roles";
import { useTheme } from "@/theme/useTheme";


export default function AddMemberPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    role: Role;
    password: string;
    confirm: string;
  }>({
    first_name: "",
    last_name: "",
    email: "",
    role: "MEMBER",
    password: "",
    confirm: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msgKey, setMsgKey] = useState<string | null>(null);
  const [errKey, setErrKey] = useState<string | null>(null);

  const { textColor, background, borderColor, hoverText07 } = useTheme();

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrKey(null);
    setMsgKey(null);
  };

  // Validation rapide côté client
  const validate = () => {
    // les mots de passe ne correspndent pas coté client
    if (form.password !== form.confirm) { setErrKey("admin.addMember.errors.confirmMismatch"); return false; }
    // mot de passe trop court coté client
    if (form.password.length < 10) { setErrKey("admin.addMember.errors.tooShort"); return false; }
    return true;
  };

  // Soumission -> appel API + gestion retours
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); 
    setErrKey(null);
    setMsgKey(null);
    try {
      const r = await createMember(form);
      if (r.success) {
        setMsgKey("admin.addMember.success");
        setForm({ first_name: "", last_name: "", email: "", role: "MEMBER", password: "", confirm: "" });
      } else {
        // la creation du membre a échoué coté serveur
        setErrKey("admin.addMember.fail");
      }
    } catch (e: any) {
      const ae = e as ApiError;
      const d = (ae.details as any)?.detail;
      // erreur de validation coté serveur
      if (Array.isArray(d)) setErrKey("admin.addMember.errors.serverValidation");
      // email déjà utilisé
      else if (ae?.status === 409) setErrKey("admin.addMember.errors.emailExists");
      // action interdite
      else if (ae?.status === 403) setErrKey("admin.addMember.errors.forbidden");
      // erreur générique
      else setErrKey("admin.addMember.errors.generic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="p-6 max-w-2xl rounded-xl"
      style={{
        backgroundColor: background,
        color: textColor,
        border: `1px solid ${borderColor}`,
      }}>
      <h1 className="text-2xl font-semibold mb-4">{t("admin.addMember.title")}</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Identité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label={t("admin.addMember.firstNameLabel")}
            name="first_name"
            value={form.first_name}
            onChange={onChange}
            placeholder={t("admin.addMember.firstNamePlaceholder")}
            autoComplete="given-name"
          />
          <TextField
            label={t("admin.addMember.lastNameLabel")}
            name="last_name"
            value={form.last_name}
            onChange={onChange}
            placeholder={t("admin.addMember.lastNamePlaceholder")}
            autoComplete="family-name"
          />
        {/* Email */}
        </div>
        <TextField
          label={t("admin.addMember.emailLabel")}
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder={t("admin.addMember.emailPlaceholder")}
          autoComplete="email"
          required
        />
        {/* Rôle */}
        <div><label className="block text-sm font-medium mb-1">{t("admin.addMember.roleLabel")}</label>
          <select name="role" value={form.role} onChange={onChange} className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              borderColor,
              color: textColor,
            }}>
            <option value="MEMBER">{t("admin.addMember.roles.member")}</option><option value="ADMIN">{t("admin.addMember.roles.admin")}</option>
          </select>
        </div>
        {/* Mot de passe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <PasswordField
              id="password"
              name="password"
              label={t("admin.addMember.passwordLabel")}
              placeholder={t("admin.addMember.passwordPlaceholder")}
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
            />
            <p className="text-xs mt-1" style={{ color: hoverText07 }}>{t("admin.addMember.passwordHelp")}</p>
          </div>
          <PasswordField
            id="confirm"
            name="confirm"
            label={t("admin.addMember.confirmLabel")}
            placeholder={t("admin.addMember.confirmPlaceholder")}
            value={form.confirm}
            onChange={onChange}
            autoComplete="new-password"
          />
        {/* Messages */}
        </div>
        {msgKey && <FormMessage tone="success">{t(msgKey)}</FormMessage>}
        {errKey && <FormMessage tone="error">{t(errKey)}</FormMessage>}
        {/* Action */}
        <Button type="submit" disabled={submitting}>
          {submitting ? <LoadingDots label={t("admin.addMember.submitting")} /> : t("admin.addMember.submit")}
        </Button>
      </form>
    </section>
  );
}

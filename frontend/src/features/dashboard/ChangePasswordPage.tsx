// Formulaire de changement de mot de passe (utilisateur) avec validation simple et retours UI
import React, { useState } from "react";
import { changePassword } from "@/services/user";
import { ApiError } from "@/shared/apiFetch";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import PasswordField from "@/utils/PasswordField";
import { useTheme } from "@/theme/useTheme";

export default function ChangePasswordPage() {
  const { t } = useTranslation();

  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msgKey, setMsgKey] = useState<string | null>(null);
  const [errKey, setErrKey] = useState<string | null>(null);

  const { primary, textColor, background, borderColor, adaptiveTextColorPrimary, hoverText07, hoverPrimary06 } = useTheme();

  // Maj champs + reset messages
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrKey(null);
    setMsgKey(null);
  };

  // Validation minimale côté client
  const validate = () => {
    // erreur car les mots de passe ne correspondent pas
    if (form.new_password !== form.confirm) { setErrKey("changePassword.errors.confirmMismatch"); return false; }
    // erreur car mot de passe trop court
    if (form.new_password.length < 10) { setErrKey("changePassword.errors.tooShort"); return false; }
    return true;
  };

  // Soumission -> appel API + gestion des retours
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); 
    setErrKey(null);
    setMsgKey(null);
    try {
      const r = await changePassword(form);
      if (r.success) { 
        setMsgKey(r.detail ? "changePassword.successWithDetail" : "changePassword.success");
        setForm({ old_password: "", new_password: "", confirm: "" }); }
      else 
        setErrKey(r.detail ? "changePassword.failWithDetail" : "changePassword.fail");
    } catch (e: any) {
      const ae = e as ApiError;
      const d = (ae.details as any)?.detail;
      if (Array.isArray(d)) {
        // erreurs de validation coté serveur
        setErrKey("changePassword.errors.serverValidation");
      } else if (ae?.status === 401 || String(ae?.message || "").toLowerCase().includes("invalid")) {
        // ancien mot de passe invalide coté serveur
        setErrKey("changePassword.errors.invalidOldPassword");
      } else {
        // erreur genérique coté serveur
        setErrKey("changePassword.errors.generic");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="p-6 max-w-xl"
      style={{
        backgroundColor: background,
        borderColor: borderColor,
        color: textColor,
      }}>
      <h1 className="text-2xl font-semibold mb-4" style={{ color: textColor }}>{t("changePassword.title")}</h1>

      <form className="space-y-4" onSubmit={onSubmit}>
        <PasswordField
          id="old_password"
          name="old_password"
          label={t("changePassword.oldPasswordLabel")}
          placeholder={t("changePassword.oldPasswordPlaceholder")}
          value={form.old_password}
          onChange={onChange}
          autoComplete="current-password"
        />

        <div>
          <PasswordField
            id="new_password"
            name="new_password"
            label={t("changePassword.newPasswordLabel")}
            placeholder={t("changePassword.newPasswordPlaceholder")}
            value={form.new_password}
            onChange={onChange}
            autoComplete="new-password"
          />
          <p className="text-xs mt-1" style={{ color: hoverText07 }}>{t("changePassword.passwordHelp")}</p>
        </div>

        <PasswordField
          id="confirm"
          name="confirm"
          label={t("changePassword.confirmLabel")}
          placeholder={t("changePassword.confirmPlaceholder")}
          value={form.confirm}
          onChange={onChange}
          autoComplete="new-password"
        />

        {/* Messages de succès / erreur */}
        {msgKey && (
          <div
            className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700 text-sm"
            role="status"
            aria-live="polite"
          >
            {t(msgKey)}
          </div>
        )}

        {errKey && (
          <div
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {t(errKey)}
          </div>
        )}

        {/* Action */}
        <button
          type="submit"
          disabled={submitting}
          className="
            rounded-lg px-4 py-2 text-sm font-medium
            disabled:opacity-60 disabled:cursor-not-allowed
            transition
            [background-color:var(--submit-bg)]
            hover:[background-color:var(--submit-hover-bg)]
          "
          aria-busy={submitting}
          style={
            {
              "--submit-bg": primary,
              "--submit-hover-bg": hoverPrimary06,
              color: adaptiveTextColorPrimary,
            } as React.CSSProperties
          }
        >
          {submitting ? <LoadingDots label={t("changePassword.submitting")} /> : t("changePassword.submit")}
        </button>
      </form>
    </section>
  );
}

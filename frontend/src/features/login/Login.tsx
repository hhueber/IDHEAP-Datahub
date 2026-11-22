// Page de connexion : authentifie l’utilisateur puis redirige vers le dashboard
import { FormEvent, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import PasswordField from "@/utils/PasswordField";
import { useTheme } from "@/theme/useTheme";
import { Button, TextField } from "@/utils/UI";

export default function Login() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errKey, setErrKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { background, borderColor, textColor } = useTheme();

  // Déjà connecté (ex: cookie valide) -> redirection immédiate
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  // Soumission du formulaire -> appel login + redirection
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrKey(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e: any) {
      const code = e?.code || e?.status || e?.response?.status || e?.name;
      if (code === 401 || e?.message?.toLowerCase?.().includes("invalid")) {
        // erreur mauvais identifiants
        setErrKey("login.errors.invalidCredentials");
      } else if (code === "NetworkError" || code === 0) {
        // erreur réseau
        setErrKey("login.errors.network");
      } else if (code === 423 || e?.message?.toLowerCase?.().includes("locked")) {
        // erreur de compte verrouillé (si besoin)
        setErrKey("login.errors.locked");
      } else if (code === 429) {
        // erreur de trop nombreurses tentatives
        setErrKey("login.errors.rateLimited");
      } else {
        // erreur genérique 
        setErrKey("login.errors.generic");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto my-10 max-w-lg rounded-2xl shadow-xl p-8 border"
      style={{
        backgroundColor: background,
        borderColor,
        color: textColor,
      }}>
      <h2 className="text-2xl font-bold">{t("login.title")}</h2>
      <p className="mt-2 text-sm">{t("login.subtitle")}</p>

      {/* Message d’erreur éventuel */}
      {errKey && (
        <div className="mt-4 text-red-600" role="alert" aria-live="polite">
          {t(errKey)}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <TextField
          label={t("login.emailLabel")}
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t("login.emailPlaceholder")}
        />

        <PasswordField
          id="password"
          name="password"
          label={t("login.passwordLabel")}
          placeholder={t("login.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          hideLabel={true}
          variant="minimal"
        />

        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          className="w-full font-medium disabled:cursor-not-allowed"
        >
          {loading ? (
            <LoadingDots label={t("login.submitting")} />
          ) : (
            t("login.submit")
          )}
        </Button>
      </form>
    </section>
  );
}

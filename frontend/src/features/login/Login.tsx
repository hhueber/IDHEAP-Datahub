// Page de connexion : authentifie l’utilisateur puis redirige vers le dashboard
import { FormEvent, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import PasswordField from "@/utils/PasswordField";

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
        // echec de connection, generique
        setErrKey(e?.message || "login.errors.generic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-2xl bg-white/90 backdrop-blur shadow-xl ring-1 ring-black/5 p-8">
      <h2 className="text-2xl font-bold text-gray-900">{t("login.title")}</h2>
      <p className="text-gray-600 mt-2">{t("login.subtitle")}</p>

      {/* Message d’erreur éventuel */}
      {errKey && (
        <div className="mt-4 text-red-600" role="alert" aria-live="polite">
          {t(errKey)}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="email">
            {t("login.emailLabel")}
          </label>
          <input
            id="email"
            className="mt-1 w-full rounded border px-3 py-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t("login.emailPlaceholder")}
          />
        </div>

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

        <button
          disabled={loading}
          className="mt-3 w-full rounded bg-black text-white py-2 disabled:opacity-60"
          aria-busy={loading}
        >
          {loading ? (
            <LoadingDots label={t("login.submitting")} />
          ) : (
            t("login.submit")
          )}
        </button>
      </form>
    </section>
  );
}

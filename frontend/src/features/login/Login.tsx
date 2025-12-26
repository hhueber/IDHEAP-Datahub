// Page de connexion : authentifie l’utilisateur puis redirige vers le dashboard
import { FormEvent, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import PasswordField from "@/utils/PasswordField";
import { loadThemeConfig } from "@/theme/themeStorage";
import { hexToRgba, getAdaptiveTextColor } from "@/utils/color";
import { useThemeMode } from "@/theme/ThemeContext";

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

  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const primary = (mode === "dark" ? cfg.colour_dark_primary : cfg.colour_light_primary) ?? cfg.colour_light_primary;
  const background = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  const borderColor = (mode === "dark" ? cfg.colour_dark_secondary : cfg.colour_light_secondary) ?? cfg.colour_light_secondary;
  const textColor = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;

  const submitBaseBg = hexToRgba(primary, 0.9);
  const submitHoverBg = hexToRgba(primary, 1);
  const submitTextColor = getAdaptiveTextColor(primary);

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
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email" style={{ color: textColor }}>
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
            style={{
              backgroundColor: background,
              borderColor,
              color: textColor,
            }}
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
          className={`
            mt-3 w-full rounded py-2 text-sm font-medium
            disabled:opacity-60 disabled:cursor-not-allowed
            hover:[background-color:var(--login-submit-hover-bg)]
          `}
          aria-busy={loading}
          style={
            {
              backgroundColor: submitBaseBg,
              color: submitTextColor,
              "--login-submit-hover-bg": submitHoverBg,
            } as React.CSSProperties
          }
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

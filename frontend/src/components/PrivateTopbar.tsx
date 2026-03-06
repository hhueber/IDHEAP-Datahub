import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DropdownList } from "@/utils/DropdownList";
import { useTheme } from "@/theme/useTheme";
import { useThemeMode } from "@/theme/ThemeContext";
import { resolveAssetUrl } from "@/shared/apiFetch";
import { useAuth } from "@/contexts/AuthContext";

type Lang = { code: string; label: string };
const langs: Lang[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
  { code: "rm", label: "RM" },
];

export default function PrivateTopbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";
  
  const { primary, textColor, background, borderColor, logoBackground, hoverPrimary10, hoverPrimary15, cfg } = useTheme();
  const instanceName = cfg.instance_name;
  const DEFAULT_LOGO = "/img/idheap-dh.png";
  const logoUrlRaw = cfg.logo_url;
  const logoUrl =
    !logoUrlRaw || logoUrlRaw === DEFAULT_LOGO
      ? DEFAULT_LOGO
      : resolveAssetUrl(logoUrlRaw);

  const userName = useMemo(() => {
    if (!user) return t("dashboard.private.anonymous");
    const first = (user.first_name || "").trim();
    const last = (user.last_name || "").trim();
    const full = `${first} ${last}`.replace(/\s+/g, " ").trim();
    return full || t("dashboard.private.anonymous");
  }, [user, t]);

  const initials = useMemo(() => {
    if (!user) return "U";
    const firstParts = (user.first_name || "").trim().split(/\s+/).filter(Boolean);
    const lastParts = (user.last_name || "").trim().split(/\s+/).filter(Boolean);
    const a = firstParts[0]?.[0] ?? "U";
    const b = lastParts.length > 0 ? (lastParts[lastParts.length - 1]?.[0] ?? "") : "";
    return (a + b).toUpperCase();
  }, [user]);

  const curLang = (i18n.language || "").toLowerCase();
  const curBase = curLang.split("-")[0];
  const currentLang =
    langs.find((l) => curLang.startsWith(l.code) || curBase === l.code) ?? langs[0];

  const [errKey, setErrKey] = useState<string | null>(null);

  const changeLang = async (code: string) => {
    setErrKey(null);
    try {
      await i18n.changeLanguage(code);
    } catch {
      setErrKey("nav.errors.changeLanguage");
    }
  };

  const loc = useLocation();
  const isActive = (path: string) => loc.pathname === path || loc.pathname.startsWith(path + "/");

  const pillStyle: React.CSSProperties = {
    borderColor: borderColor,
    color: primary,
    backgroundColor: "transparent",
  };

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur"
      style={{
        backgroundColor: background,
        borderBottom: `1px solid ${borderColor}`,
        color: textColor,
        height: "64px",
      }}
    >
      <div className="h-full px-3 sm:px-5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <img
              src={logoUrl}
              alt={instanceName}
              className="h-10 w-10 rounded-xl object-contain shadow"
              style={{
                backgroundColor: logoBackground,
                border: `1px solid ${borderColor}`,
              }}
            />
            <div className="hidden sm:block min-w-0">
              <div className="font-semibold truncate" style={{ color: primary }}>
                {instanceName}
              </div>
              <div className="text-xs opacity-80 truncate">
                {t("nav.private.privateArea")}
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/dashboard"
            className="px-3 py-2 rounded-lg text-sm font-medium transition"
            style={{
              color: primary,
              backgroundColor: isActive("/dashboard") ? hoverPrimary10 : "transparent",
            }}
          >
            {t("dashboard.title")}
          </Link>

          <Link
            to="/"
            className="px-3 py-2 rounded-lg text-sm font-medium transition"
            style={{
              color: primary,
              backgroundColor: isActive("/") ? hoverPrimary10 : "transparent",
            }}
          >
            {t("nav.home")}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Lang visible */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: primary }}>
              {t("nav.language")}
            </span>

            <div className="min-w-[84px]">
              <DropdownList<Lang>
                items={langs}
                selected={currentLang}
                onSelect={(lang) => changeLang(lang.code)}
                labelFor={(item) => item.label}
                keyFor={(item) => item.code}
                isSelected={(item, selected) => item.code === selected?.code}
                placeholder="--"
              />
            </div>
          </div>

          {/* Erreur */}
          {errKey && (
            <div
              className="hidden lg:block rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm"
              role="alert"
              aria-live="assertive"
            >
              {t(errKey)}
            </div>
          )}

          {/* Theme */}
          <button
            type="button"
            onClick={toggleMode}
            className="px-3 py-2 rounded-lg text-sm font-medium border transition"
            style={pillStyle}
            aria-label={t("nav.theme")}
          >
            {isDark ? "Dark" : "Light"}
          </button>

          {/* User + logout */}
          <div className="flex items-center gap-2 pl-1">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold border"
              style={{
                borderColor: borderColor,
                backgroundColor: hoverPrimary15,
                color: primary,
              }}
              title={userName}
            >
              {initials}
            </div>

            <button
              type="button"
              onClick={logout}
              className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-medium transition border"
              style={{
                borderColor: borderColor,
                color: primary,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverPrimary10;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              {t("dashboard.logout")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

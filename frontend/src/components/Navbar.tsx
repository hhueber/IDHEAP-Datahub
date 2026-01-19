import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { DropdownList } from "@/utils/DropdownList";
import { resolveAssetUrl } from "@/shared/apiFetch";
import { useTheme } from "@/theme/useTheme";
import { useThemeMode } from "@/theme/ThemeContext";

type Lang = { code: string; label: string };
const langs: Lang[] = [
  { code: "en", label: "EN", },
  { code: "fr", label: "FR", },
  { code: "de", label: "DE", },
  { code: "it", label: "IT", },
  { code: "rm", label: "RM", },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [errKey, setErrKey] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";
  
  const { primary, textColor, background, borderColor, navbarOverlayBg, logoBackground, hoverBg08, cfg } = useTheme();
  const instanceName = cfg.instance_name;
  const DEFAULT_LOGO = "/img/idheap-dh.png";
  const logoUrlRaw = cfg.logo_url;
  const logoUrl =
    !logoUrlRaw || logoUrlRaw === DEFAULT_LOGO
      ? DEFAULT_LOGO
      : resolveAssetUrl(logoUrlRaw);

  // fermer le drawer au clic extérieur / ESC
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const n = e.target as Node;
      if (
        open &&
        panelRef.current && !panelRef.current.contains(n) &&
        btnRef.current && !btnRef.current.contains(n)
      ) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const curLang = (i18n.language || "").toLowerCase();
  const curBase = curLang.split("-")[0];
  const current = langs.find(l => curLang.startsWith(l.code) || curBase === l.code) ?? langs[0];

  const toggleMenu = () => setOpen(v => !v);

  const changeLang = async (code: string) => {
    setErrKey(null);
    try {
      await i18n.changeLanguage(code);
      setOpen(false);
    } catch {
      // erreur lors du changement de langue
      setErrKey("nav.errors.changeLanguage");
    }
  };

  return (
    <>
      {/* Bouton flottant (c'est le logo) */}
      <button
        ref={btnRef}
        type="button"
        aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
        aria-expanded={open}
        onClick={toggleMenu}
        className={[
          "fixed top-3 left-3 inline-flex items-center justify-center",
          "w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-transparent",
          open ? "opacity-0 pointer-events-none z-40" : "opacity-100 z-50",
        ].join(" ")}
        // décale les contrôles Leaflet sous le bouton (utile même quand le bouton est masqué)
        style={{ "--leaflet-top-offset": "96px" } as React.CSSProperties}
      >
        <img
          src={logoUrl}
          alt={instanceName}
          className="h-12 sm:h-14 w-auto object-contain select-none rounded-xl shadow-2xl" // fond blanc derrière le logo et ombre noire
          style={{
            backgroundColor: logoBackground, //fond derrière le logo toujours blanc
            border: `1px solid ${borderColor}`,
          }}
        />
        {!open && (
          <svg viewBox="0 0 24 24" className="absolute w-6 h-6 -right-2 -bottom-2" aria-hidden="true" style={{ color: primary }}>
          </svg>
        )}
      </button>

      {/* Drawer + Overlay (au-dessus du reste de la map) */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ backgroundColor: navbarOverlayBg }} onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            role="menu"
            aria-label={t("nav.navigation")}
            className="absolute left-0 top-0 h-full w-[min(10rem,70vw)]
                       overflow-y-auto rounded-tr-2xl rounded-br-2xl
                       backdrop-blur p-3
                       flex flex-col"
            style={{
              backgroundColor: background, // fond du panneau
              color: textColor,
            }}
          >
            <div className="flex-1 overflow-y-auto">
            {/* Langues */}
              <div className="p-2 mb-2 rounded-xl">
                <div className="flex items-center gap-2 px-1 py-1">
                  <span className="font-semibold" style={{ color: primary }}>
                    {t("nav.language")}
                  </span>
                </div>

                <div className="mt-2">
                  {/* Utilisation du DropdownList/Liste déroulante */}
                  <DropdownList<Lang>
                    items={langs}
                    selected={current}
                    onSelect={(lang) => changeLang(lang.code)}
                    labelFor={(item) => item.label}
                    keyFor={(item) => item.code}
                    isSelected={(item, selected) => item.code === selected?.code}
                    placeholder="--"
                  />
                </div>
              </div>

              {/* Erreur éventuelle (changement de langue) */}
              {errKey && (
                <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm" role="alert" aria-live="assertive">
                  {t(errKey)}
                </div>
              )}

              {/* Liens */}
              <div className="space-y-1">
                <Link
                  to="/"
                  className="
                    block w-full px-3 py-2 rounded-lg font-medium transition
                    hover:[background-color:var(--navbar-link-hover-bg)]
                  "
                  style={{
                    color: primary,
                    // on donne la valeur de la couleur de hover à une CSS variable
                    "--navbar-link-hover-bg": hoverBg08,
                  } as React.CSSProperties}
                  onClick={() => setOpen(false)}
                >
                  {t("nav.home")}
                </Link>
                <button
                  type="button"
                  className="
                    w-full text-left px-3 py-2 rounded-lg font-medium transition
                    hover:[background-color:var(--navbar-link-hover-bg)]
                  "
                  style={{
                    color: primary,
                    "--navbar-link-hover-bg": hoverBg08,
                  } as React.CSSProperties}
                  onClick={() => setOpen(false)}
                >
                  {t("nav.data", "Data")}
                </button>
              </div>
            </div>
          

            {/* --- Switch Light / Dark en BAS de la navbar --- */}
            <div className="pt-3 mt-3 border-t border-dashed">
              <button
                type="button"
                onClick={toggleMode}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium border"
                style={{
                  borderColor:
                    (isDark
                      ? cfg.colour_dark_secondary
                      : cfg.colour_light_secondary) ??
                    cfg.colour_light_secondary,
                  backgroundColor: "transparent",
                  color: primary,
                }}
              >
                <span>{t("nav.theme", "Theme")}</span>
                <span
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{
                    borderColor:
                      (isDark
                        ? cfg.colour_dark_secondary
                        : cfg.colour_light_secondary) ??
                      cfg.colour_light_secondary,
                  }}
                >
                  {isDark ? "Dark" : "Light"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import brand from "@/img/idheap-dh.png";
import { Link } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";

type Lang = { code: string; label: string; countryCode: string };
const langs: Lang[] = [
  { code: "en", label: "EN", countryCode: "GB" },
  { code: "fr", label: "FR", countryCode: "FR" },
  { code: "de", label: "DE", countryCode: "DE" },
  { code: "it", label: "IT", countryCode: "IT" },
  { code: "rm", label: "RM", countryCode: "CH" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [errKey, setErrKey] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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
          src={brand}
          alt="IDHEAP"
          className="h-12 sm:h-14 w-auto object-contain select-none
             rounded-xl ring-1 ring-black/10 shadow-2xl bg-white"
        />
        {!open && (
          <svg viewBox="0 0 24 24" className="absolute w-6 h-6 -right-2 -bottom-2 text-indigo-600" aria-hidden="true">
            {/* <path d="M12 2l2.955 6.241 6.883.98-4.919 4.71 1.161 6.829L12 17.77l-6.08 3.99 1.161-6.829L2.162 9.221l6.883-.98L12 2z" fill="currentColor"/> */}
          </svg>
        )}
      </button>

      {/* Drawer + Overlay (au-dessus du reste de la map) */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            role="menu"
            aria-label={t("nav.navigation")}
            className="absolute left-0 top-0 h-full w-[min(22rem,92vw)]
                       overflow-y-auto rounded-tr-2xl rounded-br-2xl
                       bg-white/95 backdrop-blur p-3"
          >
            {/* Langues */}
            <div className="p-2 mb-2 rounded-xl bg-white/80">
              <div className="flex items-center gap-2 px-1 py-1">
                <ReactCountryFlag countryCode={current.countryCode} svg style={{ width: "1.2em", height: "1.2em" }} />
                <span className="font-semibold text-indigo-800">{t("nav.language")}</span>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {langs.map(({ code, label, countryCode }) => {
                  const active = curLang.startsWith(code) || curBase === code;
                  return (
                    <button
                      key={code}
                      onClick={() => changeLang(code)}
                      className={`px-2 py-1 rounded-md hover:bg-indigo-50 transition ${
                        active ? "bg-indigo-600 text-white" : "text-indigo-700"
                      }`}
                      aria-current={active ? "true" : undefined}
                      aria-label={t("nav.switchTo", { lang: label })}
                      title={t("nav.switchTo", { lang: label })}
                    >
                      <span className="inline-flex items-center gap-1">
                        <ReactCountryFlag countryCode={countryCode} svg style={{ width: "1.05em", height: "1.05em" }} />
                        {label}
                      </span>
                    </button>
                  );
                })}
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
                className="block w-full px-3 py-2 rounded-lg font-medium text-indigo-700 hover:bg-indigo-50 transition"
                onClick={() => setOpen(false)}
              >
                {t("nav.home")}
              </Link>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-indigo-700 hover:bg-indigo-50 transition"
                onClick={() => setOpen(false)}
              >
                {t("nav.data", "Data")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

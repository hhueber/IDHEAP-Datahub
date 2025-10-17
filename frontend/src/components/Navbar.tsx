import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import brand from "@/img/idheap-dh.png";
import { Link } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";

type Lang = {
  code: string;        // i18n code: "en", "fr", ...
  label: string;       // Affiché (EN/FR/...)
  countryCode: string; // Code ISO du drapeau pour react-country-flag (GB, FR, ...)
};

// Map simple code -> drapeau
const langs: Lang[] = [
  { code: "en", label: "EN", countryCode: "GB" },
  { code: "fr", label: "FR", countryCode: "FR" },
  { code: "de", label: "DE", countryCode: "DE" },
  { code: "it", label: "IT", countryCode: "IT" },
  { code: "rm", label: "RM", countryCode: "CH" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();

  // --- Mobile menu
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLangsOpen, setMobileLangsOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // --- Desktop dropdown langues
  const [langsOpen, setLangsOpen] = useState(false);
  const langsRef = useRef<HTMLDivElement>(null);

  // Fermer menus au clic extérieur / ESC
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        setMobileLangsOpen(false);
      }
      if (langsRef.current && !langsRef.current.contains(e.target as Node)) {
        setLangsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMobileLangsOpen(false);
        setLangsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className="px-3 py-2 rounded-lg font-medium text-indigo-700 hover:bg-indigo-50 transition"
        onClick={() => setMobileOpen(false)}
      >
        {t("nav.home")}
      </Link>
      <button
        type="button"
        className="px-3 py-2 rounded-lg font-medium text-indigo-700 hover:bg-indigo-50 transition"
        onClick={() => setMobileOpen(false)}
      >
        {t("nav.data", "Data")}
      </button>
    </>
  );

  const currentLang = (i18n.language || "").toLowerCase();
  const currentLangBase = currentLang.split("-")[0]; // "fr-CH" -> "fr"
  const current = langs.find((l) => currentLang.startsWith(l.code) || currentLangBase === l.code) ?? langs[0];

  return (
    <header className="sticky top-0 z-[6000] h-16 bg-white/80 backdrop-blur ring-1 ring-black/5">
      <div className="w-full px-2 sm:px-4">
        <div className="relative flex h-14 sm:h-16 items-center">
          {/* GAUCHE : liens desktop + bouton mobile */}
          <div className="flex items-center gap-2">
            {/* Bouton menu (mobile uniquement) */}
            <div className="md:hidden relative" ref={mobileMenuRef}>
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
                className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl ring-1 ring-indigo-200/80 bg-white/70 hover:bg-indigo-50 text-indigo-700 transition"
              >
                {/* hamburger (fermé) / étoile (ouvert) */}
                {mobileOpen ? (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
                    <path
                      d="M12 2l2.955 6.241 6.883.98-4.919 4.71 1.161 6.829L12 17.77l-6.08 3.99 1.161-6.829L2.162 9.221l6.883-.98L12 2z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <div className="relative w-6 h-6">
                    <span className="absolute left-0 right-0 top-[4px] h-0.5 bg-current rounded-sm" />
                    <span className="absolute left-0 right-0 top-[10px] h-0.5 bg-current rounded-sm" />
                    <span className="absolute left-0 right-0 top-[16px] h-0.5 bg-current rounded-sm" />
                  </div>
                )}
              </button>

              {/* Panneau mobile */}
              {mobileOpen && (
                <div
                  role="menu"
                  className="
                    fixed left-0 top-[calc(theme(spacing.16))] sm:top-[calc(theme(spacing.18))]
                    w-[min(18rem,92vw)]
                    rounded-2xl bg-white/95 backdrop-blur shadow-xl ring-1 ring-black/5 p-2
                    animate-fadeIn
                  "
                >
                  {/* Langues */}
                  <div className="p-2 rounded-xl hover:bg-indigo-50/60 transition">
                    <button
                      type="button"
                      onClick={() => setMobileLangsOpen((v) => !v)}
                      className="w-full flex items-center justify-between text-left font-medium text-indigo-700"
                    >
                      <span>{t("nav.language")}</span>
                      <span className="text-sm text-indigo-600">{mobileLangsOpen ? "−" : "+"}</span>
                    </button>

                    {mobileLangsOpen && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {langs.map(({ code, label, countryCode }) => {
                          const active = currentLang.startsWith(code) || currentLangBase === code;
                          return (
                            <button
                              key={code}
                              onClick={() => {
                                i18n.changeLanguage(code);
                                setMobileOpen(false);
                                setMobileLangsOpen(false);
                              }}
                              className={`px-2 py-1 rounded-md ring-1 ring-indigo-200 hover:bg-indigo-50 transition ${
                                active ? "bg-indigo-600 text-white" : "text-indigo-700"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1">
                                <ReactCountryFlag
                                  countryCode={countryCode}
                                  svg
                                  style={{ width: "1.1em", height: "1.1em" }}
                                  aria-label={label}
                                />
                                {label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Accueil */}
                  <div className="p-2 rounded-xl hover:bg-indigo-50/60 transition">
                    <Link
                      to="/"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-left font-medium text-indigo-700"
                    >
                      {t("nav.home")}
                    </Link>
                  </div>

                  {/* Data (placeholder) */}
                  <div className="p-2 mt-1 rounded-xl hover:bg-indigo-50/60 transition">
                    <button type="button" className="w-full text-left font-medium text-indigo-700">
                      {t("nav.data", "Data")}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("nav.dataSoon", "Bientôt disponible.")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Affiché uniquement quand la fenêtre fait au moins 768 px de large ; caché sur mobile */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLinks />
            </nav>
          </div>

          {/* DROITE : dropdown langues (desktop) + logo + IDHEAP */}
          <div className="ml-auto flex items-center gap-3">
            {/* Dropdown langues (desktop) */}
            <div className="relative hidden md:block" ref={langsRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={langsOpen}
                onClick={() => setLangsOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg ring-1 ring-indigo-200/80 bg-white/70 hover:bg-indigo-50 text-indigo-700 transition"
              >
                <ReactCountryFlag
                  countryCode={current.countryCode}
                  svg
                  style={{ width: "1.2em", height: "1.2em" }}
                  aria-label={current.label}
                />
                <span className="font-medium">{t("nav.language")}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${langsOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.086l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {langsOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-white/95 backdrop-blur shadow-xl ring-1 ring-black/5 p-2 animate-fadeIn"
                >
                  {langs.map(({ code, label, countryCode }) => {
                    const active = currentLang.startsWith(code) || currentLangBase === code;
                    return (
                      <button
                        key={code}
                        onClick={() => {
                          i18n.changeLanguage(code);
                          setLangsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-50 transition ${
                          active ? "bg-indigo-600 text-white" : "text-indigo-700"
                        }`}
                      >
                        <ReactCountryFlag
                          countryCode={countryCode}
                          svg
                          style={{ width: "1.2em", height: "1.2em" }}
                          aria-label={label}
                        />
                        <span className="font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Logo + texte IDHEAP */}
            <div className="flex items-center gap-2">
              <img
                src={brand}
                alt="IDHEAP"
                className="h-8 sm:h-10 w-auto object-contain select-none pointer-events-none"
              />
              <span className="font-extrabold text-indigo-800 tracking-tight hidden sm:inline">
                IDHEAP
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

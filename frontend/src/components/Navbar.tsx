import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import brand from "@/img/idheap-dh.png";
import { Link } from "react-router-dom";

const langs = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
  { code: "rm", label: "RM" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [langsOpen, setLangsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-[6000] h-16 bg-white/80 backdrop-blur ring-1 ring-black/5">
      {/* Barre 100% largeur, padding responsive */}
      <div className="w-full px-2 sm:px-4">
        <div className="relative flex h-14 sm:h-16 items-center justify-between">
          {/* GAUCHE : bouton du menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl ring-1 ring-indigo-200/80 bg-white/70 hover:bg-indigo-50 text-indigo-700 transition"
            >
              {/* hamburger (fermé) / étoile (ouvert) */}
              {open ? (
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

            {open && (
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
                    onClick={() => setLangsOpen((v) => !v)}
                    className="w-full flex items-center justify-between text-left font-medium text-indigo-700"
                  >
                    <span>{t("nav.language")}</span>
                    <span className="text-sm text-indigo-600">{langsOpen ? "−" : "+"}</span>
                  </button>

                  {langsOpen && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {langs.map(({ code, label }) => (
                        <button
                          key={code}
                          onClick={() => i18n.changeLanguage(code)}
                          className={`px-2 py-1 rounded-md ring-1 ring-indigo-200 hover:bg-indigo-50 transition ${
                            i18n.language === code ? "bg-indigo-600 text-white" : "text-indigo-700"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acceuil */}
                <div className="p-2 rounded-xl hover:bg-indigo-50/60 transition">
                <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="block w-full text-left font-medium text-indigo-700"
                >
                    {t("nav.home")}
                </Link>
                </div>

                {/* Data (placeholder) a faire actuellement fait rien  */}
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

          {/* DROITE : logo IDHEAP peut etre mettre text: IDHEAP */}
          <div className="flex items-center ml-auto">
            <img
              src={brand}
              alt="brand"
              className="h-8 sm:h-10 w-auto object-contain select-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

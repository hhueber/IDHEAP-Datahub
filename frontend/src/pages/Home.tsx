import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GeoJsonMap from "@/components/GeoJsonMap";

export default function Home() {
  const { t } = useTranslation();
  const [panelOpen, setPanelOpen] = useState(false);

  // ESC ferme toute les panneaux mobiles
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanelOpen(false);
    if (panelOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  return (
    <section className="w-full">
      <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Carte 2/3 : GeoJson fixe */}
        <div className="relative lg:col-span-2 h-full">
          <GeoJsonMap className="absolute inset-0" />
        </div>

        {/* Panneau 1/3 desktop : menu */}
        <aside className="hidden lg:block h-full overflow-y-auto">
          <div className="min-h-full w-full p-6">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                {t("home.heroTitle")}
              </h1>
              <p className="mt-2 text-gray-600">{t("home.heroSubtitle")}</p>
            </div>
          </div>
        </aside>
      </div>

      {/*  Mobile / Tablet  */}

      {/* Backdrop  */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          className="
            lg:hidden fixed inset-x-0 top-16 bottom-0 z-[3000]
            bg-black/20 transition-opacity duration-300
            opacity-100
          "
        />
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setPanelOpen(v => !v)}
        className="
          lg:hidden fixed bottom-4 z-[3600]
          h-12 w-12 rounded-full ring-1 ring-indigo-200 bg-indigo-600 text-white
          shadow-lg hover:bg-indigo-500 active:translate-y-px
          grid place-items-center
          transition-transform duration-300 ease-out
        "
        style={{
          right: "max(env(safe-area-inset-right), 1rem)",
          transform: panelOpen ? "translateX(calc(-1 * min(90vw, 24rem)))" : "translateX(0)",
        }}
        aria-label={panelOpen ? t("home.close", "Close") : t("home.openPanel", "Open panel")}
      >
        {!panelOpen ? (
          <div className="relative w-6 h-6">
            <span className="absolute left-0 right-0 top-[4px] h-0.5 bg-current rounded-sm" />
            <span className="absolute left-0 right-0 top-[10px] h-0.5 bg-current rounded-sm" />
            <span className="absolute left-0 right-0 top-[16px] h-0.5 bg-current rounded-sm" />
          </div>
        ) : (
          <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Drawer : pointer-events seulement quand ouvert */}
      <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-[3500] pointer-events-none">
        <div
          className={`
            absolute right-0 top-0 h-full w-[min(90vw,24rem)]
            bg-white/95 backdrop-blur shadow-2xl ring-1 ring-black/10
            transform transition-transform duration-300 ease-out
            ${panelOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}
            overflow-y-auto
          `}
          role="dialog"
          aria-modal="true"
        >
          <div className="p-5">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                {t("home.heroTitle")}
              </h1>
              <p className="mt-2 text-gray-600">{t("home.heroSubtitle")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
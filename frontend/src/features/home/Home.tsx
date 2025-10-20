import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GeoJsonMap from "@/components/GeoJsonMap";
import HomeInfoPanel from "@/features/home/components/HomeInfoPanel";
import { useBootstrap } from "@/features/home/hooks/useBootstrap";

export default function Home() {
  const { t } = useTranslation();
  const [panelOpen, setPanelOpen] = useState(false);

  // appel bootstrap
  const { data, loading, error } = useBootstrap();

  // ESC ferme le drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanelOpen(false);
    if (panelOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  return (
    <section className="absolute inset-0">
        {/* Carte en plein espace */}
        <div className="relative h-full">
          <GeoJsonMap className="absolute inset-0" />
        </div>

      {/* Backdrop */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          className="fixed inset-x-0 top-16 bottom-0 z-[3000] bg-black/20 transition-opacity duration-300 opacity-100"
        />
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setPanelOpen(v => !v)}
        className="
          fixed bottom-4 z-[3600]
          h-12 w-12 rounded-full ring-1 ring-indigo-200 bg-indigo-600 text-white
          shadow-lg hover:bg-indigo-500 active:translate-y-px
          grid place-items-center
          transition-transform duration-300 ease-out
        "
        style={{
          right: "max(env(safe-area-inset-right), 1rem)",
          transform: panelOpen ? "translateX(calc(-1 * min(90vw, 28rem)))" : "translateX(0)",
        }}
        aria-label={panelOpen ? t("home.close") : t("home.openPanel")}
      >
        {/* icône hamburger / flèche */}
        {!panelOpen ? (
          <div className="relative w-6 h-6">
            <span className="absolute left-0 right-0 top-[4px] h-0.5 bg-current rounded-sm" />
            <span className="absolute left-0 right-0 top-[10px] h-0.5 bg-current rounded-sm" />
            <span className="absolute left-0 right-0 top-[16px] h-0.5 bg-current rounded-sm" />
          </div>
        ) : (
          <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Drawer */}
      <div className="fixed inset-x-0 top-16 bottom-0 z-[3500] pointer-events-none">
        <div
          className={`
            absolute right-0 top-0 h-full
            /* largeur: mobile 90vw, desktop ~28rem */
            w-[min(90vw,28rem)]
            bg-white/95 backdrop-blur shadow-2xl ring-1 ring-black/10
            transform transition-transform duration-300 ease-out
            ${panelOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}
            overflow-y-auto
          `}
          role="dialog"
          aria-modal="true"
        >
          <div className="p-5">
            <HomeInfoPanel data={data} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </section>
  );
}

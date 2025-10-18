import { useState } from "react";
import { useTranslation } from "react-i18next";
import GeoJsonMap from "@/components/GeoJsonMap";
import HomeInfoPanel from "@/features/home/components/HomeInfoPanel";
import { useBootstrap } from "@/features/home/hooks/useBootstrap";

export default function Home() {
  const { t } = useTranslation();

  // Menu ouvert par défaut
  const [panelOpen, setPanelOpen] = useState(true);

  // appel bootstrap
  const { data, loading, error } = useBootstrap();

  return (
    // plein écran (le parent <main> est en absolute inset-0 via le layout)
    <section className="absolute inset-0">
      {/* Carte en plein écran */}
      <div className="absolute inset-0">
        <GeoJsonMap className="absolute inset-0" />
      </div>

      {/* Bouton flottant (ouvre/ferme uniquement) */}
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
          // le bouton se décale à gauche de la largeur du drawer quand ouvert
          transform: panelOpen ? "translateX(calc(-1 * min(90vw, 28rem)))" : "translateX(0)",
        }}
        aria-label={panelOpen ? t("home.close") : t("home.openPanel")}
      >
        {!panelOpen ? (
          // hamburger
          <div className="relative w-6 h-6">
            <span className="absolute left-0 right-0 top-[4px] h-0.5 bg-current rounded-sm" />
            <span className="absolute left-0 right-0 top-[10px] h-0.5 bg-current rounded-sm" />
            <span className="absolute left-0 right-0 top-[16px] h-0.5 bg-current rounded-sm" />
          </div>
        ) : (
          // flèche
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

      {/* Drawer (ouvert/fermé seulement via le bouton) */}
      <div className="fixed inset-0 z-[3500] pointer-events-none">
        <div
          className={`
            absolute right-0 top-0 h-full
            w-[min(90vw,28rem)]
            bg-white/95 backdrop-blur shadow-2xl ring-1 ring-black/10
            transform transition-transform duration-300 ease-out
            ${panelOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}
            overflow-y-auto
            rounded-tl-2xl rounded-bl-2xl
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

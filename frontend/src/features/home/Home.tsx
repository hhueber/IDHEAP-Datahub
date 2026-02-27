import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GeoJsonMap from "@/components/GeoJsonMap";
import HomeInfoPanel from "@/features/home/components/HomeInfoPanel";
import { useBootstrap } from "@/features/home/hooks/useBootstrap";
import { useTheme } from "@/theme/useTheme";
import { useChoropleth } from "@/features/geo/hooks/useChoropleth";
import type { ChoroplethGranularity } from "@/features/geo/geoApi";

const GLOBAL_UID = -1;

export default function Home() {
  const { t } = useTranslation();

  // Menu ouvert par défaut
  const [panelOpen, setPanelOpen] = useState(true);

  // état sélection
  const [selectedSurveyUid, setSelectedSurveyUid] = useState<number>(GLOBAL_UID);
  const [selectedQuestionUid, setSelectedQuestionUid] = useState<number | null>(null);
  const [globalYear, setGlobalYear] = useState<number | null>(null);

  // Granularity selector
  const [granularity, setGranularity] = useState<ChoroplethGranularity>("commune");

  // appel bootstrap
  const { data, loading, error, errorKey } = useBootstrap();

  // Theme
  const { primary, background, borderColor, adaptiveTextColorPrimary } = useTheme();

  const isGlobal = selectedSurveyUid === GLOBAL_UID;

  // année utilisée pour la carte (et pour la choropleth si survey)
  const surveyYear = useMemo(() => {
    if (!data?.surveys?.length) return null;
    const s = data.surveys.find((x) => x.uid === selectedSurveyUid);
    return s?.year ?? null;
  }, [data?.surveys, selectedSurveyUid]);

  const activeYear = isGlobal ? globalYear : surveyYear;
  const choroplethScope = isGlobal ? "global" : "per_survey";

  // choropleth : année = activeYear
  const { data: choropleth } = useChoropleth({
    scope: choroplethScope,
    question_uid: selectedQuestionUid,
    year: activeYear,
    bins: 6,
    granularity,
  });

  return (
    // Plein écran : ce bloc remplit toute la fenêtre, de haut en bas.
    <section className="absolute inset-0">
      {/* Carte en plein écran */}
      <div className="absolute inset-0">
        <GeoJsonMap
          className="absolute inset-0"
          year={activeYear}
          choropleth={choropleth}
          panelOpen={panelOpen}
        />
      </div>

      {/* Bouton flottant (ouvre/ferme uniquement) */}
      <button
        onClick={() => setPanelOpen(v => !v)}
        className="
          fixed bottom-4 z-[3600]
          h-12 w-12 rounded-full border
          shadow-lg active:translate-y-px
          grid place-items-center
          transition-transform duration-300 ease-out
          hover:opacity-90
        "
        style={{
          right: "max(env(safe-area-inset-right), 1rem)",
          // se décale à gauche de la largeur du drawer quand ouvert
          transform: panelOpen ? "translateX(calc(-1 * min(90vw, 28rem)))" : "translateX(0)",
          backgroundColor: primary,
          borderColor: borderColor,
          color: adaptiveTextColorPrimary, // texte + icône blancs comme avant
        }}
        aria-label={panelOpen ? t("home.close") : t("home.openPanel")}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`w-6 h-6 transition-transform duration-200 ease-out ${panelOpen ? "" : "-scale-x-100"}`}
        >
          {/* chevron "gauche" de base ; on le flippe à droite quand panelOpen === false */}
          <path
            d="M9 6l6 6-6 6" // si on veux inverser la fleche changer en "M15 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Drawer (ouvert/fermé seulement via le bouton) */}
      <aside className="fixed inset-0 z-[3500] pointer-events-none">
        <div
          className={`
            absolute right-0 top-0 h-full
            w-[min(90vw,28rem)]
            backdrop-blur shadow-2xl border
            transform transition-transform duration-300 ease-out
            ${panelOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}
            overflow-y-auto
            rounded-tl-2xl rounded-bl-2xl
          `}
          role="dialog"
          aria-modal="true"
          style={{
            backgroundColor: background,
            borderColor: borderColor,
          }}
        >
          <HomeInfoPanel
            data={data}
            loading={loading}
            error={error}
            errorKey={errorKey}
            selectedSurveyUid={selectedSurveyUid}
            onSurveyChange={(uid) => {
              setSelectedSurveyUid(uid);
              // reset question quand on change de scope
              setSelectedQuestionUid(null);
            }}
            selectedQuestionUid={selectedQuestionUid}
            onQuestionSelect={(uid) => setSelectedQuestionUid(uid)}
            globalYear={globalYear}
            onGlobalYearChange={setGlobalYear}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
        </div>
      </aside>
    </section>
  );
}

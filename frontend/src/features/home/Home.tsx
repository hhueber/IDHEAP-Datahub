import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GeoJsonMap from "@/components/GeoJsonMap";
import HomeInfoPanel from "@/features/home/components/HomeInfoPanel";
import { useBootstrap } from "@/features/home/hooks/useBootstrap";
import { useTheme } from "@/theme/useTheme";
import { useChoropleth } from "@/features/geo/hooks/useChoropleth";
import type { ChoroplethGranularity } from "@/features/geo/geoApi";
import MapLoadingOverlay from "@/utils/MapLoadingOverlay";
import { normalizeGeoLanguage } from "@/features/geo/geoLanguage";
import { createPortal } from "react-dom";
import GreetingModal from "./components/GreetingModal";
import BottomStatsPanel from "@/features/home/components/BottomStatsPanel";
import introJs from "intro.js";
import "intro.js/introjs.css";

const GLOBAL_UID = -1;

type SelectedArea = {
  uid: number;
  name?: string;
  level: "commune" | "district" | "canton";
} | null;

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = normalizeGeoLanguage(
    i18n.resolvedLanguage ?? i18n.language
  );
  const [selectedArea, setSelectedArea] = useState<SelectedArea>(null);

  // Menu ouvert par défaut
  const [panelOpen, setPanelOpen] = useState(true);

  // Etat de la modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // état sélection
  const [selectedSurveyUid, setSelectedSurveyUid] =
    useState<number>(GLOBAL_UID);
  const [selectedQuestionUid, setSelectedQuestionUid] = useState<number | null>(
    null,
  );
  const [globalYear, setGlobalYear] = useState<number | null>(null);

  // Granularity selector
  const [granularity, setGranularity] =
    useState<ChoroplethGranularity>("commune");

  // appel bootstrap
  const { data, loading, error, errorKey } = useBootstrap();

  // Theme
  const { primary, background, borderColor, adaptiveTextColorPrimary } =
    useTheme();

  const isGlobal = selectedSurveyUid === GLOBAL_UID;

  const closeModal = () => setIsModalOpen(false);

  const handleStartTour = () => {
    setIsModalOpen(false);

    introJs()
      .setOptions({
        nextLabel: t("common.next"),
        prevLabel: t("common.prev"),
        doneLabel: t("common.done"),
        steps: [
          {
            element: "#map-tour",
            intro: t("home.tour.geomap"),
          },
          {
            element: "#floating-buttton",
            intro: t("home.tour.floatingButton"),
          },
          {
            element: "#btn-navbar",
            intro: t("home.tour.btn-navbar"),
          },
          {
            element: ".leaflet-control-zoom",
            intro: t("home.tour.zoom"),
          },
          {
            element: ".leaflet-control-simpleMapScreenshoter-btn",
            intro: t("home.tour.screenshot"),
          },
          {
            element: "#btn-center-swiss",
            intro: t("home.tour.centerswiss"),
          },
          {
            element: "#place-of-interest-menu",
            intro: t("home.tour.place-menu"),
          },
          {
            element: "#place-of-interest-onoff",
            intro: t("home.tour.placeonoff"),
          },
          {
            element: "#basemap-btn",
            intro: t("home.tour.basemap"),
          },
          {
            element: "#year-selector",
            intro: t("home.tour.year-selector"),
          },
          {
            element: "#question-selector",
            intro: t("home.tour.question-selector"),
          },
          {
            element: "#saved-question-selector",
            intro: t("home.tour.saved-question-selector"),
          },
          {
            element: "#granularity-selector",
            intro: t("home.tour.granularity-selector"),
          },
          {
            element: "#export-selector",
            intro: t("home.tour.export-selector"),
          },
        ],
      })
      .start();
  };

  // année utilisée pour la carte (et pour la choropleth si survey)
  const surveyYear = useMemo(() => {
    if (!data?.surveys?.length) return null;
    const s = data.surveys.find((x) => x.uid === selectedSurveyUid);
    return s?.year ?? null;
  }, [data?.surveys, selectedSurveyUid]);

  const activeYear = isGlobal ? globalYear : surveyYear;
  const choroplethScope = isGlobal ? "global" : "per_survey";

  useEffect(() => {
    const hasBeenHiden = localStorage.getItem("hideWelcomeModal");

    if (!hasBeenHiden) {
      setIsModalOpen(true);
    }
  }, []);

  // choropleth : année = activeYear
  const {
    data: choropleth,
    loading: choroplethLoading,
    errorKey: choroplethErrorKey,
  } = useChoropleth({
    scope: choroplethScope,
    question_uid: selectedQuestionUid,
    year: activeYear,
    bins: 6,
    granularity,
  });

  const selectedSurvey = data?.surveys?.find(
    (s) => s.uid === selectedSurveyUid,
  );

  const statsYear =
    selectedSurveyUid === GLOBAL_UID ? globalYear : selectedSurvey?.year;

  let overlayType: "loading" | "action" = "loading";
  let overlayLabel: string | undefined;

  if (choroplethLoading) {
    overlayType = "loading";
    overlayLabel = t("common.loading");
  }

  return (
    // Plein écran : ce bloc remplit toute la fenêtre, de haut en bas.
    <section className="absolute inset-0 flex flex-row overflow-hidden">
      {isModalOpen &&
        createPortal(
          <GreetingModal
            onClose={closeModal}
            onStartTour={handleStartTour}
          ></GreetingModal>,
          document.body,
        )}
      {/* Carte — zone flexible, prend tout l'espace disponible */}
      <div id="map-tour" className="relative flex-1 min-w-0">
        <GeoJsonMap
          className="absolute inset-0"
          year={activeYear}
          choropleth={choropleth}
          panelOpen={panelOpen}
          granularity={granularity}
          selectedArea={selectedArea}
          onSelectArea={setSelectedArea}
        />
        {(choroplethLoading) && (
          <MapLoadingOverlay label={overlayLabel} type={overlayType} />
        )}

        {/*
          Bouton d'ouverture/fermeture, placé dans la zone carte.
          Desktop : suit naturellement le bord droit de la carte lorsqu'elle se réduit.
          Mobile  : translateX via CSS (index.css + attribut data-open).
        */}
        <button
          id="floating-buttton"
          data-open={panelOpen.toString()}
          onClick={() => setPanelOpen((v) => !v)}
          className="
            absolute top-[24px] right-4 z-[3600]
            translate-x-0
            h-12 w-12 rounded-full border
            shadow-lg active:translate-y-px
            grid place-items-center
            max-lg:transition-transform max-lg:duration-300 max-lg:ease-out
            hover:opacity-90
          "
          style={{
            backgroundColor: primary,
            borderColor: borderColor,
            color: adaptiveTextColorPrimary,
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

        {/* Pop up bas, dans la zone carte, sa largeur suit celle de la map */}
        <BottomStatsPanel
          selectedArea={selectedArea}
          onClose={() => setSelectedArea(null)}
          questionUid={selectedQuestionUid}
          year={statsYear}
          scope={selectedSurveyUid === GLOBAL_UID ? "global" : "per_survey"}
          lang={lang}
        />
      </div>

      {/*
        Drawer, double comportement selon la taille d'écran :
        >= lg (1024 px) : colonne flex dans le layout, largeur animée (carte réduite).
        < lg           : overlay fixe par-dessus la carte.
      */}
      <aside
        className={[
          // Desktop >=lg : enfant flex, largeur animée via CSS transition
          "lg:relative lg:shrink-0 lg:z-auto lg:overflow-hidden",
          "lg:rounded-tl-2xl lg:rounded-bl-2xl",
          "lg:transition-[width] lg:duration-300 lg:ease-out",
          panelOpen
            ? "lg:w-[min(90vw,28rem)] lg:pointer-events-auto"
            : "lg:w-0 lg:pointer-events-none",
          // Mobile <lg : overlay fixe plein écran (pointer-events géré par le panneau interne)
          "max-lg:fixed max-lg:inset-0 max-lg:z-[3500] max-lg:pointer-events-none",
        ].join(" ")}
      >
        <div
          id="popup-right"
          className={[
            // Dimensions fixes du panneau, le parent aside gère le clip sur desktop
            "w-[min(90vw,28rem)] h-full overflow-y-auto",
            "border shadow-2xl",
            "rounded-tl-2xl rounded-bl-2xl",
            // Mobile : positionné à droite de l'écran, animé via translateX
            "max-lg:absolute max-lg:right-0 max-lg:top-0",
            "max-lg:backdrop-blur",
            "max-lg:rounded-tl-2xl max-lg:rounded-bl-2xl",
            "max-lg:transform max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
            panelOpen
              ? "max-lg:translate-x-0 max-lg:pointer-events-auto"
              : "max-lg:translate-x-full max-lg:pointer-events-none",
          ].join(" ")}
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
              setGlobalYear(null);
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

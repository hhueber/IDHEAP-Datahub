import { useState } from "react";
import { useTranslation } from "react-i18next";
import PlaceOfInterestMarkers from "@/components/map/PlaceOfInterestMarkers";
import { usePlaceOfInterestMarkers } from "@/features/geo/hooks/usePlaceOfInterestMarkers";

const CUSTOM_OFFSET_PX = 160; 

export default function PlaceOfInterestLayer() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentLang =
    i18n.language || window.localStorage.getItem("i18nextLng") || "en";

  const {
    placeOfInterest,
    hideAllBackend,
    setHideAllBackend,
  } = usePlaceOfInterestMarkers(currentLang);

  const togglePlaceOfInterest = () => {
    setHideAllBackend(!hideAllBackend);
  };

  return (
    <>
      <div
        className="leaflet-top leaflet-left pointer-events-none"
        style={{
          top: `calc(var(--leaflet-top-offset, 96px) + ${CUSTOM_OFFSET_PX}px)`,
        }}
      >
        <div className="leaflet-control leaflet-bar flex flex-col pointer-events-auto ml-2 overflow-hidden rounded-md">
          {/* Bouton MENU GLOBAL */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="
              w-8 h-8 flex items-center justify-center
              bg-white hover:bg-stone-100
              text-stone-800 text-lg font-semibold
              border-b border-stone-300
            "
            title={t("map.menu.global")}
          >
            ☰
          </button>

          {/* Bouton ON/OFF villes */}
          <button
            type="button"
            onClick={togglePlaceOfInterest}
            className={`
              w-8 h-8 flex items-center justify-center
              text-base
              ${hideAllBackend
                ? "bg-white text-stone-500 hover:bg-stone-100"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
              }
            `}
            title={
              hideAllBackend
                ? t("map.placeOfInterest.show")
                : t("map.placeOfInterest.hide")
            }
          >
            {/* Bouton masquer/demasquer les places d'intérêt */}
            {hideAllBackend ? "\u29BB" : "\u25CF"}
          </button>
        </div>
      </div>

      {/* Marqueurs de villes */}
      <PlaceOfInterestMarkers placeOfInterest={placeOfInterest} />

      {/* Modale menu global */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-[90%] p-4 z-[710]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {t("map.menu.global")}
              </h2>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100"
                aria-label={t("common.close", "Close")}
              >
                {/* croix de fermeture */}
                {"\u00D7"}
              </button>
            </div>

            <p className="text-sm text-stone-700">
              {t("map.menu.placeholder")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

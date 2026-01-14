import { useState } from "react";
import { useTranslation } from "react-i18next";
import PlaceOfInterestMarkers from "@/components/map/PlaceOfInterestMarkers";
import { usePlaceOfInterestMarkers } from "@/features/geo/hooks/usePlaceOfInterestMarkers";
import PlaceOfInterestMenuModal from "@/components/map/PlaceOfInterestMenuModal";
import { useTheme } from "@/theme/useTheme";

const CUSTOM_OFFSET_PX = 160;

export default function PlaceOfInterestLayer() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentLang =
    i18n.language || window.localStorage.getItem("i18nextLng") || "en";

  const {
    placeOfInterest,
    backendPlaceOfInterest,
    extraPlaceOfInterest,
    hideAllBackend,
    setHideAllBackend,
    hiddenCodes,
    togglePlaceOfInterestHidden,
    addExtraPlaceOfInterest,
    removeExtraPlaceOfInterest,
  } = usePlaceOfInterestMarkers(currentLang);

  const togglePlaceOfInterest = () => {
    setHideAllBackend(!hideAllBackend);
  };

  const { primary, textColor, background, borderColor, adaptiveTextColorPrimary } = useTheme();

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
              text-lg font-semibold
              border-b
              transition hover:opacity-90
            "
            // les couleurs sont fixes pour que tout les bouton de la map garde le meme style
            style={{
              backgroundColor: "#FFFFFF",
              color: "#111827",
              borderColor,
            }}
            title={t("map.menu.global")}
          >
            {/* Bouton menu hambourger */}
            {"\u2630"}
          </button>

          {/* Bouton ON/OFF villes */}
          <button
            type="button"
            onClick={togglePlaceOfInterest}
            className="
              w-8 h-8 flex items-center justify-center
              text-base
              border-t
              transition hover:opacity-90
            "
            style={{
              backgroundColor: hideAllBackend ? background : primary,
              color: hideAllBackend ? textColor : adaptiveTextColorPrimary,
              borderColor,
            }}
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

      {/* Marqueurs de villes sur la carte */}
      <PlaceOfInterestMarkers placeOfInterest={placeOfInterest} />

      {/* Modale de gestion des villes */}
      <PlaceOfInterestMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        backendPlaceOfInterest={backendPlaceOfInterest}
        extraPlaceOfInterest={extraPlaceOfInterest}
        hideAllBackend={hideAllBackend}
        hiddenCodes={hiddenCodes}
        togglePlaceOfInterestHidden={togglePlaceOfInterestHidden}
        addExtraPlaceOfInterest={addExtraPlaceOfInterest}
        removeExtraPlaceOfInterest={removeExtraPlaceOfInterest}
      />
    </>
  );
}

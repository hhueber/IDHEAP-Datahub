import { useState } from "react";
import { useTranslation } from "react-i18next";
import CityMarkers from "@/components/map/CityMarkers";
import { useCityMarkers } from "@/features/geo/hooks/useCityMarkers";
import CityMenuModal from "@/components/map/CityMenuModal";

const CUSTOM_OFFSET_PX = 160;

export default function CityLayer() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentLang =
    i18n.language || window.localStorage.getItem("i18nextLng") || "en";

  const {
    cities,
    backendCities,
    extraCities,
    hideAllBackend,
    setHideAllBackend,
    hiddenCodes,
    toggleCityHidden,
    addExtraCity,
    removeExtraCity,
  } = useCityMarkers(currentLang);

  const toggleCities = () => {
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
            {/* Bouton menu hambourger */}
            {"\u2630"}
          </button>

          {/* Bouton ON/OFF villes */}
          <button
            type="button"
            onClick={toggleCities}
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
                ? t("map.cities.show")
                : t("map.cities.hide")
            }
          >
            {/* Bouton ON/OFF villes */}
            {hideAllBackend ? "\u29BB" : "\u25CF"}
          </button>
        </div>
      </div>

      {/* Marqueurs de villes sur la carte */}
      <CityMarkers cities={cities} />

      {/* Modale de gestion des villes */}
      <CityMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        backendCities={backendCities}
        extraCities={extraCities}
        hideAllBackend={hideAllBackend}
        hiddenCodes={hiddenCodes}
        toggleCityHidden={toggleCityHidden}
        addExtraCity={addExtraCity}
        removeExtraCity={removeExtraCity}
      />
    </>
  );
}

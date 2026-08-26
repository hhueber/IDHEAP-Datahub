import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PlaceOfInterestMarkers from "@/components/map/PlaceOfInterestMarkers";
import { usePlaceOfInterestMarkers } from "@/features/geo/hooks/usePlaceOfInterestMarkers";
import PlaceOfInterestMenuModal from "@/components/map/PlaceOfInterestMenuModal";
import { useTheme } from "@/theme/useTheme";
import { normalizeGeoLanguage } from "@/features/geo/geoLanguage";
import type {
  FeatureCollection,
  GeoFeatureProperties,
} from "@/features/geo/geoApi";

const CUSTOM_OFFSET_PX = 160;

type BasemapId = "none" | "light" | "swiss";

type Props = {
  communes?: FeatureCollection<GeoFeatureProperties> | null;

  districts?: FeatureCollection<GeoFeatureProperties> | null;

  cantons?: FeatureCollection<GeoFeatureProperties> | null;

  selectedBasemap?: BasemapId;
  onBasemapChange?: (id: BasemapId) => void;
};

export default function PlaceOfInterestLayer({
  communes,
  districts,
  cantons,
  selectedBasemap = "none",
  onBasemapChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBasemapOpen, setIsBasemapOpen] = useState(false);
  const basemapRef = useRef<HTMLDivElement>(null);

  const currentLang = normalizeGeoLanguage(
    i18n.resolvedLanguage ||
      i18n.language ||
      localStorage.getItem("i18nextLng"),
  );

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

  // Ferme le popup basemap si clic en dehors
  useEffect(() => {
    if (!isBasemapOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        basemapRef.current &&
        !basemapRef.current.contains(e.target as Node)
      ) {
        setIsBasemapOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isBasemapOpen]);

  const {
    primary,
    textColor,
    background,
    borderColor,
    adaptiveTextColorPrimary,
  } = useTheme();

  const basemapOptions: { id: BasemapId; labelKey: string }[] = [
    { id: "none", labelKey: "map.basemap.none" },
    { id: "light", labelKey: "map.basemap.light" },
    { id: "swiss", labelKey: "map.basemap.swiss" },
  ];

  return (
    <>
      <div
        data-no-export
        className="leaflet-top leaflet-left pointer-events-none"
        style={{
          top: `calc(var(--leaflet-top-offset, 96px) + ${CUSTOM_OFFSET_PX}px)`,
        }}
      >
        <div
          className="relative flex items-start pointer-events-auto"
          ref={basemapRef}
        >
          {/* Groupe de boutons */}
          <div className="leaflet-control leaflet-bar flex flex-col ml-2 overflow-hidden rounded-md">
            {/* Bouton MENU GLOBAL */}
            <button
              id="place-of-interest-menu"
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
              id="place-of-interest-onoff"
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

            {/* Bouton fond cartographique */}
            {onBasemapChange && (
              <button
                type="button"
                onClick={() => setIsBasemapOpen((o) => !o)}
                className="
                  w-8 h-8 flex items-center justify-center
                  border-t
                  transition hover:opacity-90
                "
                style={{
                  backgroundColor:
                    selectedBasemap !== "none" ? primary : "#FFFFFF",
                  color:
                    selectedBasemap !== "none"
                      ? adaptiveTextColorPrimary
                      : "#111827",
                  borderColor,
                }}
                title={t("map.basemap.title")}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
              </button>
            )}
          </div>

          {/* Popup sélecteur de fond */}
          {isBasemapOpen && onBasemapChange && (
            <div
              className="absolute left-10 top-0 z-[9999] rounded-md shadow-lg overflow-hidden"
              style={{
                backgroundColor: "#FFFFFF",
                border: `1px solid ${borderColor}`,
                minWidth: "130px",
              }}
            >
              <div
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  color: "#6B7280",
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                {t("map.basemap.title")}
              </div>
              {basemapOptions.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onBasemapChange(id);
                    setIsBasemapOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm transition hover:opacity-80 flex items-center gap-2"
                  style={{
                    backgroundColor:
                      selectedBasemap === id ? primary : "#FFFFFF",
                    color:
                      selectedBasemap === id
                        ? adaptiveTextColorPrimary
                        : "#111827",
                  }}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full border flex-shrink-0"
                    style={{
                      backgroundColor:
                        selectedBasemap === id ? textColor : "transparent",
                      borderColor:
                        selectedBasemap === id ? textColor : "#9CA3AF",
                    }}
                  />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Marqueurs de villes sur la carte */}
      <PlaceOfInterestMarkers
        placeOfInterest={placeOfInterest}
        communes={communes}
        districts={districts}
        cantons={cantons}
      />

      {/* Modale de gestion des villes */}
      <PlaceOfInterestMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        lang={currentLang}
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

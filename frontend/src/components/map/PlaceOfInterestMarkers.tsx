// Marqueurs des villes repères : place quelques grandes villes suisses
// et affiche leur nom au survol (ou au clic sur mobile/tactile).
import { GeoJSON, Marker, Pane, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import L from "leaflet";
import type {LatLngExpression, PathOptions} from "leaflet";
import type {Feature, FeatureCollection, GeoFeatureProperties} from "@/features/geo/geoApi";
import type {PlaceOfInterestMarker} from "@/features/geo/hooks/usePlaceOfInterestMarkers";
import { hexToRgba } from "@/utils/color";
import { useTheme } from "@/theme/useTheme";

type GeoCollection = FeatureCollection<GeoFeatureProperties>;
type GeoFeature = Feature<GeoFeatureProperties>;
type Props = {
  placeOfInterest: PlaceOfInterestMarker[];
  communes?: GeoCollection | null;
  districts?: GeoCollection | null;
  cantons?: GeoCollection | null;
};

type AreaPlaceOfInterest = {
  place: PlaceOfInterestMarker;
  feature: GeoFeature;
};

const normalizeGeoCode = (
  value: unknown
): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getLocalUid = (
  place: PlaceOfInterestMarker
): number | null => {
  if (place.source !== "local") {
    return null;
  }

  const match = place.code.match(
    /^local-(commune|district|canton)-(\d+)$/
  );

  if (!match) {
    return null;
  }

  const uid = Number(match[2]);

  return Number.isFinite(uid)
    ? uid
    : null;
};

const findGeoFeature = (
  collection: GeoCollection | null | undefined,
  place: PlaceOfInterestMarker
): GeoFeature | undefined => {
  if (!collection) {
    return undefined;
  }

  /*
   * Nouveau stockage :
   * comparaison par vrai code géographique.
   */
  if (place.geoCode) {
    const normalizedCode = normalizeGeoCode(place.geoCode);

    const featureByCode =
      collection.features.find(
        (feature) =>
          normalizeGeoCode(
            feature.properties?.code
          ) === normalizedCode
      );

    if (featureByCode) {
      return featureByCode;
    }
  }

  /*
   * Compatibilité avec les anciens POI locaux
   * qui contiennent uniquement :
   *
   * local-district-117
   * local-canton-8
   */
  const localUid =
    getLocalUid(place);

  if (localUid === null) {
    return undefined;
  }

  return collection.features.find(
    (feature) =>
      Number(
        feature.properties?.uid
      ) === localUid
  );
};

const createPositionMarkerIcon = (
  color: string
): L.DivIcon =>
  L.divIcon({
    className: "place-of-interest-marker-wrapper",
    html: `
      <span
        class="place-of-interest-marker-icon"
        style="background-color: ${color};"
        aria-hidden="true"
      ></span>
    `,
    iconSize: [28, 28],

    /*
     * L'ancrage est placé en bas au centre de l'icône,
     * afin que la pointe corresponde à la position géographique.
     */
    iconAnchor: [14, 28],

    /*
     * Position du tooltip par rapport à l'ancrage.
     */
    tooltipAnchor: [10, -14],
  });

export default function PlaceOfInterestMarkers({
  placeOfInterest,
  communes: _communes,
  districts,
  cantons,
}: Props) {
  const {textColor, background, primary, borderColor, cantonColores, districtColores} = useTheme();

  
  // L'icône n'est recréée que lorsque la couleur primary change.
  const positionMarkerIcon = useMemo(
    () => createPositionMarkerIcon(primary),
    [primary]
  );

  const communePlaces =
    placeOfInterest.filter(
      (place) => place.geoType === "commune"
    );

  const districtPlaces =
    placeOfInterest
      .filter(
        (place) => place.geoType === "district"
      )
      .map((place) => ({
        place,
        feature: findGeoFeature(
          districts,
          place
        ),
      }))
      .filter(
        (
          item
        ): item is AreaPlaceOfInterest =>
          item.feature !== undefined
      );

  const cantonPlaces =
    placeOfInterest
      .filter(
        (place) =>
          place.geoType === "canton"
      )
      .map((place) => ({
        place,
        feature: findGeoFeature(
          cantons,
          place
        ),
      }))
      .filter(
        (
          item
        ): item is AreaPlaceOfInterest =>
          item.feature !== undefined
      );

  /*
   * Fallback :
   * si un district ou canton n'est pas
   * retrouvé dans le GeoJSON, il reste
   * affiché comme point.
   */
  const resolvedAreaCodes = new Set([
    ...districtPlaces.map(
      ({ place }) => place.code
    ),
    ...cantonPlaces.map(
      ({ place }) => place.code
    ),
  ]);

  const pointPlaces =
    placeOfInterest.filter(
      (place) =>
        place.geoType === "commune" ||
        !resolvedAreaCodes.has(place.code)
    );

  const districtStyle:
    PathOptions = {
      color: districtColores,
      weight: 4,
      opacity: 1,
      fill: false,
      fillOpacity: 0,
    };

  const cantonStyle:
    PathOptions = {
      color: cantonColores,
      weight: 5,
      opacity: 1,
      fill: false,
      fillOpacity: 0,
    };

  const bindAreaTooltip = (
    place: PlaceOfInterestMarker
  ) => (
    _feature: GeoFeature,
    layer: L.Layer
  ) => {
    const tooltipLayer =
      layer as L.Path;
    tooltipLayer.bindTooltip(
      place.name,
      {
        sticky: true,
        direction: "right",
        offset: [8, 0],
        opacity: 1,
        className: "place-of-interest-area-tooltip",
      }
    );

    layer.on({
      mouseover: () => layer.openTooltip(),
      mouseout: () => layer.closeTooltip(),
      click: () => layer.openTooltip(),
    });
  };

  return (
    <>
      <style>{`
        /*
         * Leaflet applique normalement ses propres dimensions,
         * bordures et couleurs aux DivIcon.
         */
        .leaflet-div-icon.place-of-interest-marker-wrapper,
        .place-of-interest-marker-wrapper {
          width: 28px !important;
          height: 28px !important;
          
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
        }

        /*
         * Le SVG est utilisé comme masque.
         */
        .place-of-interest-marker-icon {
          display: block;
          width: 28px;
          height: 28px;
          background-color: ${primary};
          -webkit-mask-image:
            url("/img/position-marker.svg");
          mask-image:
            url("/img/position-marker.svg");
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          -webkit-mask-size: contain;
          mask-size: contain;

          // Une légère ombre
          filter: drop-shadow(0 1px 2px ${hexToRgba("#111827", 0.35)});
          transition:
            transform 150ms ease,
            filter 150ms ease;
        }

        // Petit effet visuel au survol.
        .place-of-interest-marker-wrapper:hover
        .place-of-interest-marker-icon {
          transform: translateY(-1px) scale(1.08);
          filter: drop-shadow(0 2px 3px ${hexToRgba("#111827", 0.45)});
        }
        .leaflet-tooltip.place-of-interest-area-tooltip {
          padding: 2px 6px border-radius: 6px;
          white-space: nowrap font-size: 12px;
          font-weight: 600 background: ${background};
          color: ${textColor} border: 1px solid ${borderColor};
          box-shadow: 0 1px 2px ${hexToRgba("#111827", 0.1)};
        }

        .leaflet-tooltip.place-of-interest-area-tooltip::before {
          display: none;
        }
      `}</style>

      <Pane
        name="placeOfInterestDistricts"
        style={{ zIndex: 725 }}
      >
        {districtPlaces.map(
          ({ place, feature }) => (
            <GeoJSON
              key={place.code}
              data={feature}
              pane="placeOfInterestDistricts"
              style={() =>
                districtStyle
              }
              onEachFeature={
                bindAreaTooltip(place)
              }
            />
          )
        )}
      </Pane>

      <Pane
        name="placeOfInterestCantons"
        style={{ zIndex: 726 }}
      >
        {cantonPlaces.map(
          ({ place, feature }) => (
            <GeoJSON
              key={place.code}
              data={feature}
              pane="placeOfInterestCantons"
              style={() =>
                cantonStyle
              }
              onEachFeature={
                bindAreaTooltip(place)
              }
            />
          )
        )}
      </Pane>

      <Pane
        name="placeOfInterestPoints"
        style={{ zIndex: 725 }}
      >
        {pointPlaces.map((place) => (
          <Marker
            key={place.code}
            position={
              place.pos as LatLngExpression
            }
            icon={positionMarkerIcon}
            eventHandlers={{
              mouseover: (event) => event.target.openTooltip(),
              mouseout: (event) => event.target.closeTooltip(),
              /*
               * Permet également l'ouverture du tooltip
               * sur mobile et tablette.
               */
              click: (event) => event.target.openTooltip(),
            }}
          >
            <Tooltip
            // pas "permanent": visible au survol/tap seulement
              sticky
              direction="right"
              offset={[8, 0]}
              opacity={1}
              className="
                pointer-events-none !bg-transparent
                !border-none !shadow-none
              "
            >
              <div
                className="
                  px-1.5 py-0.5 text-[12px]
                  font-semibold rounded-md
                  shadow-sm whitespace-nowrap
                "
                style={{
                  backgroundColor: background,
                  color: textColor,
                  borderColor: borderColor,
                  borderWidth: 1,
                  borderStyle: "solid",
                  boxShadow: `0 1px 2px ${hexToRgba("#111827", 0.1)}`, // couleur en dure pour garder une coehérence visuelle
                }}
              >
                {place.name}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </Pane>
    </>
  );
}

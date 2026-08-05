// Marqueurs des villes repères : place quelques grandes villes suisses
// et affiche leur nom au survol (ou au clic sur mobile/tactile).
import {CircleMarker, GeoJSON, Pane, Tooltip} from "react-leaflet";
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

export default function PlaceOfInterestMarkers({
  placeOfInterest,
  communes: _communes,
  districts,
  cantons,
}: Props) {
  const {textColor, background, borderColor, cantonColores, districtColores} = useTheme();

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
    layer: any
  ) => {
    layer.bindTooltip(
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
        {pointPlaces.map((c) => (
          <CircleMarker
            key={c.code}
            center={
              c.pos as LatLngExpression
            }
            radius={5}
            pathOptions={{
              color: textColor,
              weight: 1,
              fillColor: textColor,
              fillOpacity: 1,
            }}
          eventHandlers={{
            mouseover: (e) => e.target.openTooltip(),
            mouseout: (e) => e.target.closeTooltip(),
            click: (e) => e.target.openTooltip(), // mobile/tactile
          }}
        >
          <Tooltip
            // pas "permanent": visible au survol/tap seulement
            sticky
            direction="right"
            offset={[8, 0]}
            opacity={1}
            className={`
              pointer-events-none
              !bg-transparent !border-none !shadow-none
            `}
          >
            <div
              className="
                px-1.5 py-0.5 text-[12px] font-semibold
                rounded-md shadow-sm
                whitespace-nowrap
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
              {c.name}
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </Pane>
    </>
  );
}

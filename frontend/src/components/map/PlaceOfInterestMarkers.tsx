// Marqueurs des villes repères : place quelques grandes villes suisses
// et affiche leur nom au survol (ou au clic sur mobile/tactile).
import { CircleMarker, Tooltip, Pane } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useTranslation } from "react-i18next";

type PlaceOfInterest = { code: string; defaultName: string; pos: LatLngExpression };

const PlaceOfInterest: PlaceOfInterest[] = [
  { code: "lausanne",     defaultName: "Lausanne",     pos: [46.5197, 6.6323] },
  { code: "bern",         defaultName: "Bern",         pos: [46.9480, 7.4474] },
  { code: "basel",        defaultName: "Basel",        pos: [47.5596, 7.5886] },
  { code: "luzern",       defaultName: "Luzern",       pos: [47.0502, 8.3093] },
  { code: "schaffhausen", defaultName: "Schaffhausen", pos: [47.6973, 8.6349] },
];

export default function PlaceOfInterestMarkers() {
  const { t } = useTranslation();

  return (
    // zIndex < 650 (tooltipPane) pour que les tooltips passent par-dessus
    <Pane name="placeOfInterest" style={{ zIndex: 625 }}>
      {PlaceOfInterest.map((c) => {
        const label = t(`map.placeOfInterest.${c.code}`, { defaultValue: c.defaultName });
        return (
          <CircleMarker
            key={c.code}
            center={c.pos}
            radius={5}
            pathOptions={{ color: "#000", weight: 1, fillColor: "#000", fillOpacity: 1 }}
            eventHandlers={{
              mouseover: (e) => e.target.openTooltip(),
              mouseout:  (e) => e.target.closeTooltip(),
              click:     (e) => e.target.openTooltip(), // mobile/tactile
            }}
          >
            <Tooltip
              // pas "permanent": visible au survol/tap seulement
              sticky
              direction="right"
              offset={[8, 0]}
              opacity={1}
              className="
                pointer-events-none
                px-1.5 py-0.5 text-[12px] font-semibold
                text-stone-900 bg-white/95
                ring-1 ring-black/10 rounded-md shadow-sm
                whitespace-nowrap
              "
            >
              {label}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </Pane>
  );
}

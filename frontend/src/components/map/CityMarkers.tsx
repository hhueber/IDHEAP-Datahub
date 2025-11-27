// Marqueurs des villes repères : place quelques grandes villes suisses
// et affiche leur nom au survol (ou au clic sur mobile/tactile).
import { CircleMarker, Tooltip, Pane } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { CityMarker } from "@/features/geo/hooks/useCityMarkers";

type Props = {
  cities: CityMarker[];
};

export default function CityMarkers({ cities }: Props) {
  return (
    // zIndex < 650 (tooltipPane) pour que les tooltips passent par-dessus
    <Pane name="cities" style={{ zIndex: 625 }}>
      {cities.map((c) => (
        <CircleMarker
          key={c.code}
          center={c.pos as LatLngExpression}
          radius={5}
          pathOptions={{
            color: "#000",
            weight: 1,
            fillColor: "#000",
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
            className="
              pointer-events-none
              px-1.5 py-0.5 text-[12px] font-semibold
              text-stone-900 bg-white/95
              ring-1 ring-black/10 rounded-md shadow-sm
              whitespace-nowrap
            "
          >
            {c.name}
          </Tooltip>
        </CircleMarker>
      ))}
    </Pane>
  );
}

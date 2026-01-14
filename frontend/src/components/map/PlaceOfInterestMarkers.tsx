// Marqueurs des villes repères : place quelques grandes villes suisses
// et affiche leur nom au survol (ou au clic sur mobile/tactile).
import { CircleMarker, Tooltip, Pane } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { PlaceOfInterestMarker } from "@/features/geo/hooks/usePlaceOfInterestMarkers";
import { hexToRgba } from "@/utils/color";
import { useTheme } from "@/theme/useTheme";

type Props = {
  placeOfInterest: PlaceOfInterestMarker[];
};

export default function PlaceOfInterestMarkers({ placeOfInterest }: Props) {
  const { textColor, background, borderColor } = useTheme();

  return (
    // zIndex < 650 (tooltipPane) pour que les tooltips passent par-dessus
    <Pane name="placeOfInterest" style={{ zIndex: 625 }}>
      {placeOfInterest.map((c) => (
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
                boxShadow: `0 1px 2px ${hexToRgba("#000000", 0.1)}`, // couleur en dure pour garder une coehérence visuelle
              }}
            >
              {c.name}
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </Pane>
  );
}

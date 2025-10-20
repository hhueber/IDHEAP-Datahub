import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";

// Limites approx. de la Suisse (SW / NE)
export const SWISS_BOUNDS: L.LatLngBoundsExpression = [
  [45.817, 5.956],  // sud-ouest
  [47.808, 10.492], // nord-est
];

type Props = {
  position?: L.ControlPosition;
  bounds?: L.LatLngBoundsExpression;
};

export default function ResetSwissControl({
  position = "topleft",
  bounds = SWISS_BOUNDS,
}: Props) {
  const map = useMap();

  // Control container + button
  useEffect(() => {
    const container = L.DomUtil.create("div", "leaflet-bar");

    const btn = L.DomUtil.create("a", "", container);
    btn.href = "#";
    btn.title = "Recentrer sur la Suisse";
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 13l2-2 2 1 2-2 2 1 3-2 3 2-1 2 2 2-3 1-2 2-3-1-2 1-2-2-1-3z" fill="currentColor"/>
        </svg>
    `;
    (btn as HTMLElement).style.display = "flex";
    (btn as HTMLElement).style.alignItems = "center";
    (btn as HTMLElement).style.justifyContent = "center";

    // Conteneur de contrôle + bouton
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(btn, "click", (e) => {
        L.DomEvent.preventDefault(e);
        map.fitBounds(bounds as any, { padding: [20, 20] });
    });

    // Contrôle minimal du wrapper Leaflet
    const ResetControl = L.Control.extend({
        onAdd: () => container,
        onRemove: () => {},
    });

    // Contrôle du montage, puis nettoyage lors du démontage/des modifications
    const ctrl = new ResetControl({ position });
    ctrl.addTo(map);

    return () => {
        ctrl.remove();
    };
    }, [map, position, bounds]);

  return null;
}

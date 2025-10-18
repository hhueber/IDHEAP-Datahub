// Prépare la capture d’écran de la carte (utilisée ensuite pour exporter en PNG/PDF).
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-simple-map-screenshoter";

// TS helper (optionnel), on étend Window et Map avec nos refs internes
declare global {
  interface Window { __leafletMap?: any }
}
declare module "leaflet" {
  interface Map { __screenshoter?: any }
}

function InstallScreenshoter({ showButton = true }: { showButton?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map || map.__screenshoter) return;

    // @ts-ignore (types non fournis par le plugin)
    const ctrl = L.simpleMapScreenshoter({ position: "topleft" }).addTo(map);
    map.__screenshoter = ctrl;

    // masquer le bouton si demandé
    if (!showButton) {
      const container = (ctrl as any)?._container as HTMLElement | undefined;
      if (container) container.style.display = "none";
    }

    return () => {
      try { map.removeControl?.(ctrl); } catch {}
      map.__screenshoter = undefined;
    };
  }, [map, showButton]);

  return null;
}

export default InstallScreenshoter;

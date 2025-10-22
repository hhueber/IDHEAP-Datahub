// Carte GeoJSON Suisse : couches pays/lacs/communes/districts/cantons + marqueurs de villes,
// contrôles utilitaires (reset zoom Suisse, capture écran).
import { MapContainer, GeoJSON, Pane, ImageOverlay, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import ResetSwissControl, { SWISS_BOUNDS } from "@/components/map/ResetSwissControl";
import { geoApi, GeoBundle } from "@/features/geo/geoApi";
import { onEachCanton } from "@/components/map/admLabels";
import CityMarkers from "@/components/map/CityMarkers";
import "leaflet-simple-map-screenshoter";
import InstallScreenshoter from "./map/screenShoter";

/** Assure le recalcul de taille Leaflet (containers responsives, resize, etc.) */
function MapSizeFixer({ host }: { host: HTMLElement | null }) {
  const map = useMap();
  useLayoutEffect(() => { map.invalidateSize(false); }, [map]);
  useEffect(() => {
    const bump = () => map.invalidateSize(false);
    const raf = requestAnimationFrame(bump);
    const t = setTimeout(bump, 200);
    let ro: ResizeObserver | null = null;
    if (host && "ResizeObserver" in window) { ro = new ResizeObserver(bump); ro.observe(host); }
    window.addEventListener("resize", bump);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener("resize", bump); if (ro && host) ro.unobserve(host); };
  }, [map, host]);
  return null;
}

/** Expose la carte Leaflet globalement (window.__leafletMap) pour d’autres modules (export…) */
function ExposeMapOnWindow() {
  const map = useMap();
  useEffect(() => {
    (window as any).__leafletMap = map; // exposé global simple
  }, [map]);
  return null;
}

type Props = {
  className?: string;
  baseImageUrl?: string;
  baseImageOpacity?: number; // 0..1
};

export default function GeoJsonMap({
  className = "absolute inset-0",
  baseImageUrl,
  baseImageOpacity = 1,
}: Props) {
  const [bundle, setBundle] = useState<GeoBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  /** Chargement des couches géo pour l’année courante. */
  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true; // évite setState après unmount

    const currentYear = new Date().getFullYear();

    geoApi
      .getByYear(currentYear, ctrl.signal, {
        layers: ["country", "lakes", "cantons", "districts"],
        clearOthers: false,
      }
      )
      .then((b) => {
        if (!alive) return;
        setBundle(b);
      })
      .catch((e: any) => {
        if (!alive) return;
        // ignorer les annulations
        const name = e?.name || "";
        const msg = (e?.message || "").toLowerCase();
        if (name === "AbortError" || msg.includes("aborted") || msg.includes("canceled")) return;

        setError(e?.message || "Failed to load geometry");
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  // Styles (couleurs/épaisseurs/fill) des différentes couches
  const countryStyle = useMemo(() => ({
  color: "#000000",      // frontière pays en noir
  weight: 1,
  fillColor: "#ffffff",  // fond blanc
  fillOpacity: 1,
}), []);
const lakesStyle = useMemo(() => ({
  color: "#3b82f6",      // bleu
  weight: 1.2,
  // si préfère uniquement le contour mettre fillOpacity: 0
  fillColor: "#3b82f6",
  fillOpacity: 0.85,
}), []);
const cantonsStyle = useMemo(() => ({
  color: "#ef4444",      // rouge
  weight: 1.2,
  fillOpacity: 0,
}), []);
const districtsStyle = useMemo(() => ({
  color: "#7c3aed",      // violet bleuter
  weight: 0.9,
  fillOpacity: 0,
}), []);
const communesStyle = useMemo(() => ({
  color: "#16a34a",       // green
  weight: 0.6,
  fillOpacity: 0,
}), []);

  // Alias pratiques
  const country   = bundle?.country   ?? null;
  const lakes     = bundle?.lakes     ?? null;
  const cantons   = bundle?.cantons   ?? null;
  const districts = bundle?.districts ?? null;
  const communes  = (bundle as any)?.communes ?? null;

  return (
    <div ref={hostRef} data-map-root className={`${className} overflow-hidden`}>
      {/* Ajustements UI Leaflet */}
      <style>{`
        [data-map-root] .leaflet-top { top: var(--leaflet-top-offset, 96px); }
        [data-map-root] .leaflet-left { left: 12px; }
        [data-map-root] .leaflet-container { background: #ffffff; } /* fond blanc si pas de raster */
      `}</style>
      <MapContainer
        center={[46.8182, 8.2275]}
        zoom={7}
        className="w-full h-full"
        scrollWheelZoom
      >
        {/* Utilitaires : export écran, resize, bouton recadrage Suisse */}
        <ExposeMapOnWindow />
        <InstallScreenshoter showButton={true} />
        <MapSizeFixer host={hostRef.current} />
        <ResetSwissControl position="topleft" />

        {/* Raster en fond (zIndex le plus bas) */}
        <Pane name="pane-raster" style={{ zIndex: 100 }}>
          {baseImageUrl && (
            <ImageOverlay
              url={baseImageUrl}
              bounds={SWISS_BOUNDS}
              opacity={baseImageOpacity}
            />
          )}
        </Pane>

        {/* Ordre de superposition : pays -> lacs -> communes -> districts -> cantons*/}
        <Pane name="pane-country"  style={{ zIndex: 200 }}>
          {country   && <GeoJSON data={country as any}   style={() => countryStyle} pane="pane-country"  />}
        </Pane>
        <Pane name="pane-lakes"    style={{ zIndex: 300 }}>
          {lakes     && <GeoJSON data={lakes as any}     style={() => lakesStyle} pane="pane-lakes"    />}
        </Pane>
        <Pane name="pane-communes" style={{ zIndex: 400 }}>
          {communes  && <GeoJSON data={communes as any}  style={() => communesStyle}  pane="pane-communes" />}
        </Pane>
        <Pane name="pane-districts" style={{ zIndex: 500 }}>
          {districts && <GeoJSON data={districts as any} style={() => districtsStyle} pane="pane-districts" />}
        </Pane>
        <Pane name="pane-cantons"  style={{ zIndex: 600 }}>
          {cantons   && <GeoJSON data={cantons as any}   style={() => cantonsStyle} onEachFeature={onEachCanton} pane="pane-cantons"  />}
        </Pane>
        {/* Points villes et labels */}
        <CityMarkers />
      </MapContainer>

      {/* Alerte d’erreur de chargement géo */}
      {error && (
        <div className="absolute top-2 left-2 z-[4000] rounded bg-red-600 text-white px-3 py-1 text-sm shadow">
          {error}
        </div>
      )}
    </div>
  );
}

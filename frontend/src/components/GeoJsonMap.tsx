import { MapContainer, GeoJSON, Pane, ImageOverlay, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import ResetSwissControl, { SWISS_BOUNDS } from "@/components/map/ResetSwissControl";
import { geoApi, GeoBundle } from "@/features/geo/geoApi";
import { onEachCanton } from "@/components/map/admLabels";
import CityMarkers from "@/components/map/CityMarkers";
import "leaflet-simple-map-screenshoter";
import InstallScreenshoter from "./map/screenShoter";

// TODO: patch le abort
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

function ExposeMapOnWindow() {
  const map = useMap();
  useEffect(() => {
    (window as any).__leafletMap = map; // exposé global simple
  }, [map]);
  return null;
}

type Props = {
  className?: string;
  /** Optionnel : URL d’un PNG/JPEG géoréférencé (couvrant SWISS_BOUNDS) à mettre en fond */
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

  useEffect(() => {
    const ctrl = new AbortController();
    const currentYear = new Date().getFullYear(); // défaut
    geoApi.getByYear(currentYear, ctrl.signal)
      .then(setBundle)
      .catch((e) => {
        console.error("Failed to fetch Geo bundle:", e);
        setError(e?.message || "Failed to load geometry");
      });
    return () => ctrl.abort();
  }, []);

  // Styles
  const countryStyle = useMemo(() => ({
  color: "#000000",      // frontière pays en noir
  weight: 1,
  fillColor: "#ffffff",  // fond blanc
  fillOpacity: 1,
}), []);
const lakesStyle = useMemo(() => ({
  color: "#3b82f6",      // bleu (tailwind blue-500)
  weight: 1.2,
  // si préfère uniquement le contour mettre fillOpacity: 0
  fillColor: "#3b82f6",
  fillOpacity: 0.85,
}), []);
const cantonsStyle = useMemo(() => ({
  color: "#ef4444",      // rouge (tailwind red-500)
  weight: 1.2,
  fillOpacity: 0,
}), []);
const districtsStyle = useMemo(() => ({
  color: "#7c3aed",      // violet (tailwind violet-600)
  weight: 0.9,
  fillOpacity: 0,
}), []);
  // const communesStyle = useMemo(() => ({
  //   color: "#16a34a",       // green-600
  //   weight: 0.6,
  //   fillColor: "#dcfce7",   // green-100
  //   fillOpacity: 0.15,
  // }), []);

  const country   = bundle?.country   ?? null;
  const lakes     = bundle?.lakes     ?? null;
  const cantons   = bundle?.cantons   ?? null;
  const districts = bundle?.districts ?? null;
  // const communes  = (bundle as any)?.communes ?? null; // si/qd tu ajoutes la couche

  return (
    <div ref={hostRef} data-map-root className={`${className} overflow-hidden`}>
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
        <ExposeMapOnWindow />
        <InstallScreenshoter showButton={true} />
        <MapSizeFixer host={hostRef.current} />
        <ResetSwissControl position="topleft" />

        {/* Pane raster tout en bas */}
        <Pane name="pane-raster" style={{ zIndex: 100 }}>
          {baseImageUrl && (
            <ImageOverlay
              url={baseImageUrl}
              bounds={SWISS_BOUNDS}
              opacity={baseImageOpacity}
              // crossOrigin="anonymous"  // important pour l’export html2canvas
            />
          )}
        </Pane>

        {/* Ordre: pays → lacs → cantons → districts → communes */}
        <Pane name="pane-country"  style={{ zIndex: 200 }}>
          {country   && <GeoJSON data={country as any}   style={() => countryStyle} pane="pane-country"  />}
        </Pane>
        <Pane name="pane-lakes"    style={{ zIndex: 300 }}>
          {lakes     && <GeoJSON data={lakes as any}     style={() => lakesStyle} pane="pane-lakes"    />}
        </Pane>
        <Pane name="pane-districts" style={{ zIndex: 400 }}>
          {districts && <GeoJSON data={districts as any} style={() => districtsStyle} pane="pane-districts" />}
        </Pane>
        <Pane name="pane-cantons"  style={{ zIndex: 500 }}>
          {cantons   && <GeoJSON data={cantons as any}   style={() => cantonsStyle} onEachFeature={onEachCanton} pane="pane-cantons"  />}
        </Pane>
        {/* <Pane name="pane-communes" style={{ zIndex: 600 }}>
          {communes  && <GeoJSON data={communes as any}  style={() => communesStyle}  pane="pane-communes" />}
        </Pane> */}
        {/* Points villes et labels */}
        <CityMarkers />
      </MapContainer>

      {error && (
        <div className="absolute top-2 left-2 z-[4000] rounded bg-red-600 text-white px-3 py-1 text-sm shadow">
          {error}
        </div>
      )}
    </div>
  );
}

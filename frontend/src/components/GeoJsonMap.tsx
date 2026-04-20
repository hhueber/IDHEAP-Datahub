// Carte GeoJSON Suisse : couches pays/lacs/communes/districts/cantons + marqueurs de villes,
// contrôles utilitaires (reset zoom Suisse, capture écran).
import { MapContainer, GeoJSON, Pane, ImageOverlay, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import ResetSwissControl, { SWISS_BOUNDS } from "@/components/map/ResetSwissControl";
import { geoApi, GeoBundle } from "@/features/geo/geoApi";
import { onEachCanton } from "@/components/map/admLabels";
import "leaflet-simple-map-screenshoter";
import InstallScreenshoter from "./map/screenShoter";
import PlaceOfInterestLayer from "@/components/map/PlaceOfInterestLayer";
import { useTheme } from "@/theme/useTheme";
import type { ChoroplethResponse } from "@/features/geo/geoApi";
import MapLegendOverlay from "@/components/map/MapLegendOverlay";
import L from "leaflet";
import "leaflet.pattern";

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
  year?: number | null; // année pour charger les couches "by_year"
  choropleth?: ChoroplethResponse | null; // overlay communes colorées
  baseImageUrl?: string;
  baseImageOpacity?: number;
  panelOpen?: boolean;
};

export default function GeoJsonMap({
  className = "absolute inset-0",
  year = null,
  choropleth = null,
  baseImageUrl,
  baseImageOpacity = 1,
  panelOpen = true,
}: Props) {
  const { t } = useTranslation();
  const [bundle, setBundle] = useState<GeoBundle | null>(null);
  const [errKey, setErrKey] = useState<string | null>(null);
  const [errDetail, setErrDetail] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const { background, countryColors, lakesColores, cantonColores, districtColores, communesColores, borderColor } = useTheme();

  const patternCacheRef = useRef<Map<string, any>>(new Map());

  // Crée ou récupère un pattern de rayures multicolores (pour les choropleth catégorielles avec ex-aequo)
  function getMultiStripePattern(map: any, colors: string[], angle = 45, stripe = 6) {
    const cols = colors.filter(Boolean).slice(0, 12);
    const key = `${cols.join("|")}|${angle}|${stripe}`;
    const cache = patternCacheRef.current;
    const existing = cache.get(key);
    if (existing) return existing;

    const n = cols.length;
    const w = stripe * n;
    const h = stripe * n;

    const pattern = new (L as any).Pattern({
      width: w,
      height: h,
      patternUnits: "userSpaceOnUse",
      angle,
    });

    cols.forEach((col, i) => {
      const rect = new (L as any).PatternRect({
        x: i * stripe,
        y: 0,
        width: stripe,
        height: h,
        fill: true,
        fillColor: col,
        fillOpacity: 1,
        stroke: false,
      });
      pattern.addShape(rect);
    });

    pattern.addTo(map);
    cache.set(key, pattern);
    return pattern;
  }

  function TooltipZoomGuard() {
    const map = useMap();

    useEffect(() => {
      const tooltipPane = map.getPanes().tooltipPane;
      let waitingForFreshMouseMove = false;

      const closeAllTooltips = () => {
        map.eachLayer((layer: any) => {
          if (layer.closeTooltip) {
            layer.closeTooltip();
          }
        });
      };

      const hideTooltips = () => {
        if (tooltipPane) {
          tooltipPane.style.display = "none";
        }
        closeAllTooltips();
        (map as any).__suspendTooltips = true;
      };

      const showTooltips = () => {
        if (tooltipPane) {
          tooltipPane.style.display = "";
        }
        (map as any).__suspendTooltips = false;
      };

      const suspend = () => {
        waitingForFreshMouseMove = false;
        hideTooltips();
      };

      const releaseButWaitForFreshHover = () => {
        closeAllTooltips();
        waitingForFreshMouseMove = true;
        (map as any).__suspendTooltips = true;
      };

      const onMouseDown = (e: any) => {
        if (e.originalEvent?.button === 0) {
          suspend();
        }
      };

      const onMouseUp = (e: any) => {
        if (e.originalEvent?.button === 0) {
          releaseButWaitForFreshHover();
        }
      };

      const onMouseMove = (e: any) => {
        const buttons = e.originalEvent?.buttons ?? 0;

        // si clic encore maintenu, on reste bloqué
        if (buttons !== 0) {
          return;
        }

        // après relâchement, on attend un vrai nouveau mouvement
        if (waitingForFreshMouseMove) {
          waitingForFreshMouseMove = false;
          showTooltips();
          closeAllTooltips();
        }
      };

      map.on("mousedown", onMouseDown);
      map.on("mouseup", onMouseUp);
      map.on("mousemove", onMouseMove);

      map.on("dragstart", suspend);
      map.on("movestart", suspend);
      map.on("zoomstart", suspend);

      map.on("dragend", releaseButWaitForFreshHover);
      map.on("moveend", releaseButWaitForFreshHover);
      map.on("zoomend", releaseButWaitForFreshHover);

      return () => {
        if (tooltipPane) {
          tooltipPane.style.display = "";
        }
        (map as any).__suspendTooltips = false;

        map.off("mousedown", onMouseDown);
        map.off("mouseup", onMouseUp);
        map.off("mousemove", onMouseMove);

        map.off("dragstart", suspend);
        map.off("movestart", suspend);
        map.off("zoomstart", suspend);

        map.off("dragend", releaseButWaitForFreshHover);
        map.off("moveend", releaseButWaitForFreshHover);
        map.off("zoomend", releaseButWaitForFreshHover);
      };
    }, [map]);

    return null;
  }

  /** Chargement des couches géo pour l’année courante. */
  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true; // évite setState après unmount

    const y = typeof year === "number" ? year : new Date().getFullYear();

    geoApi
      .getByYear(y, ctrl.signal, {
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
        const name = e?.name || "";
        const msg = (e?.message || "").toLowerCase();
        if (name === "AbortError" || msg.includes("aborted") || msg.includes("canceled")) return;

        if (name === "NetworkError" || msg.includes("network") || !navigator.onLine) {
          // erreur avec la connexion réseau
          setErrKey("map.errors.network");
        } else {
          // erreur avec les GeoJson
          setErrKey("map.errors.loadGeometry");
        }
        setErrDetail(e?.message || null);
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  // Styles (couleurs/épaisseurs/fill) des différentes couches
  const countryStyle = useMemo(() => ({
  color: countryColors,      // frontière pays en noir
  weight: 1,
  fillColor: background,  // fond blanc
  fillOpacity: 1,
}), []);
const lakesStyle = useMemo(() => ({
  color: lakesColores,      // bleu
  weight: 1.2,
  // si préfère uniquement le contour mettre fillOpacity: 0
  fillColor: lakesColores,
  fillOpacity: 0.85,
}), []);
const cantonsStyle = useMemo(() => ({
  color: cantonColores,      // rouge
  weight: 1.2,
  fillOpacity: 0,
}), []);
const districtsStyle = useMemo(() => ({
  color: districtColores,      // violet bleuter
  weight: 0.9,
  fillOpacity: 0,
}), []);
const communesStyle = useMemo(() => ({
  color: communesColores,       // green
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
    <div ref={hostRef} data-map-root 
      className={`${className} overflow-hidden`}
      style={
        {
          // on expose la couleur de fond à Leaflet via une variable CSS
          "--map-bg": background,
        } as React.CSSProperties
      }
    >
      {/* Ajustements UI Leaflet */}
      <style>{`
        [data-map-root] .leaflet-top { top: var(--leaflet-top-offset, 96px); }
        [data-map-root] .leaflet-left { left: 12px; }
        [data-map-root] .leaflet-container { background: var(--map-bg); }

        [data-map-root] .leaflet-tooltip-pane {
          z-index: 1000;
        }
        [data-map-root] .leaflet-tooltip.choropleth-tooltip {
          background: rgba(255,255,255,0.58);
          border-radius: 6px;
        }
      `}</style>
      <MapContainer
        center={[46.8182, 9.2]}
        zoom={8}
        className="w-full h-full"
        scrollWheelZoom
      >
        {/* Utilitaires : export écran, resize, bouton recadrage Suisse */}
        <ExposeMapOnWindow />
        <InstallScreenshoter showButton={true} />
        <MapSizeFixer host={hostRef.current} />
        <TooltipZoomGuard />
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
        <Pane name="pane-lakes"    style={{ zIndex: 700 }}>
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
        {choropleth?.feature_collection && (
          <>
            <Pane name="choropleth" style={{ zIndex: 650 }} />
            <GeoJSON
              key={`choropleth-${choropleth.question_uid}-${choropleth.year_requested}-${choropleth.granularity}`}
              data={choropleth.feature_collection as any}
              pane="choropleth"
              style={(feat: any) => {
                const props = feat?.properties ?? {};
                const fill = props.fill_color ?? "#cccccc";
                const pat = props.fill_pattern;
                const map = (window as any).__leafletMap;

                const base: any = {
                  weight: 1,
                  opacity: 1,
                  color: borderColor,
                };

                // Si le backend a fourni un pattern (catégoriel + tie), on l'applique
                if (
                  map &&
                  pat?.type === "stripes" &&
                  Array.isArray(pat.colors) &&
                  pat.colors.length >= 2
                ) {
                  const angle = typeof pat.angle === "number" ? pat.angle : 45;
                  const stripe = typeof pat.stripe === "number" ? pat.stripe : 6;

                  const p = getMultiStripePattern(map, pat.colors, angle, stripe);

                  return {
                    ...base,
                    fillOpacity: 1,    // important: le pattern fait le rendu
                    fillPattern: p,
                  };
                }

                // fallback normal
                return {
                  ...base,
                  fillOpacity: 0.75,
                  fillColor: fill,
                };
              }}
              onEachFeature={(feature: any, layer: any) => {
                const props = feature?.properties ?? {};
                const v = props.value ?? null;

                // Si gradient: pas de nom de commune
                if (choropleth.legend.type === "gradient") {
                  layer.bindTooltip(`${v ?? "No data"}`, { sticky: true, opacity: 1, className: "choropleth-tooltip" });
                } else {
                  const name = props.name ?? props.code ?? "";
                  layer.bindTooltip( `<div>${name}</div><div>${v ?? "No data"}</div>`,{sticky: true, opacity: 1, className: "choropleth-tooltip"});
                }
              }}
            />

            {/* Légende */}
            <MapLegendOverlay choropleth={choropleth} panelOpen={panelOpen} />
          </>
        )}
        {/* Points villes et labels */}
        <PlaceOfInterestLayer />
      </MapContainer>

      {/* Alerte d’erreur de chargement géo */}
      {errKey && (
        <>
          <div
            className="absolute top-2 left-2 z-[4000] rounded bg-red-600 text-white px-3 py-1 text-sm shadow"
            role="alert"
            aria-live="assertive"
            title={errDetail || undefined}
          >
            {t(errKey)}
          </div>
          {/* Annonce screen reader dédiée */}
          <div className="sr-only" aria-live="assertive">{t(errKey)}</div>
        </>
      )}
    </div>
  );
}

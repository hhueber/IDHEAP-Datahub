// Carte GeoJSON Suisse : couches pays/lacs/communes/districts/cantons + marqueurs de villes,
// contrôles utilitaires (reset zoom Suisse, capture écran).
import { useEffect, useMemo, useRef, useState, useLayoutEffect, lazy, Suspense, useCallback } from "react";
import { MapContainer, GeoJSON, Pane, ImageOverlay, TileLayer, useMap } from "react-leaflet";
import { useTranslation } from "react-i18next";
import ResetSwissControl, { SWISS_BOUNDS, SWISS_BOUNDS_PADDED } from "@/components/map/ResetSwissControl";
import { geoApi, GeoBundle } from "@/features/geo/geoApi";
import { onEachCanton } from "@/components/map/admLabels";
import "leaflet-simple-map-screenshoter";
import InstallScreenshoter from "./map/screenShoter";
import PlaceOfInterestLayer from "@/components/map/PlaceOfInterestLayer";
import { useTheme } from "@/theme/useTheme";
import type { ChoroplethResponse } from "@/features/geo/geoApi";
import MapLegendOverlay from "@/components/map/MapLegendOverlay";
import type { ChoroplethGranularity } from "@/features/geo/geoApi";
import L from "leaflet";
import "leaflet.pattern";
import type { ViewState3D } from "@/features/geo/3d/ChoroplethDeckLayer";

const ChoroplethDeckLayer = lazy(() => import("@/features/geo/3d/ChoroplethDeckLayer"));

type BasemapId = "none" | "light" | "swiss";

const BASEMAP_CONFIG: Record<
  Exclude<BasemapId, "none">,
  { url: string; attribution: string; subdomains?: string[] }
> = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
      '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ["a", "b", "c", "d"],
  },
  swiss: {
    url: "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
    attribution: '&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
  },
};

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
  granularity?: ChoroplethGranularity;
  selectedArea?: {
    uid: number;
    level: "commune" | "district" | "canton";
  } | null;
  onSelectArea?: (area: any) => void;
};

export default function GeoJsonMap({
  className = "absolute inset-0",
  year = null,
  choropleth = null,
  baseImageUrl,
  baseImageOpacity = 1,
  panelOpen = true,
  selectedArea,
  onSelectArea,
}: Props) {
  const { t } = useTranslation();
  const [bundle, setBundle] = useState<GeoBundle | null>(null);
  const [errKey, setErrKey] = useState<string | null>(null);
  const [errDetail, setErrDetail] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const { background, countryColors, lakesColores, cantonColores, districtColores, communesColores, borderColor, selectionColor, primary, adaptiveTextColorPrimary } = useTheme();

  const patternCacheRef = useRef<Map<string, any>>(new Map());

  // 3D mode
  const [is3DMode, setIs3DMode] = useState(false);
  const deckViewStateRef = useRef<ViewState3D>({
    longitude: 8.2, latitude: 46.8, zoom: 7, pitch: 40, bearing: 0,
  });
  const initialDeckViewStateRef = useRef({ lng: 8.2, lat: 46.8, zoom: 7 });

  // 3D is available for any question with at least one positive numeric value,
  // regardless of legend type (gradient or categorical).
  // One pass computes both the availability flag and the normalisation maximum
  // (passed to ChoroplethDeckLayer so it does not need to iterate again).
  const { is3DAvailable, maxPositiveValue } = useMemo(() => {
    const features = choropleth?.feature_collection?.features;
    if (!features) return { is3DAvailable: false, maxPositiveValue: 0 };
    let max = 0;
    for (const f of features) {
      const p = (f as any)?.properties ?? {};
      if (p.value_kind !== "value" || p.value == null) continue;
      const v = parseFloat(String(p.value));
      if (!isNaN(v) && v > 0 && v > max) max = v;
    }
    return { is3DAvailable: max > 0, maxPositiveValue: max };
  }, [choropleth]);

  // If the active question has no positive numeric values at all while in 3D, revert.
  // (Switching between gradient and numeric-categorical keeps is3DAvailable true,
  // so this effect no longer fires in that case.)
  useEffect(() => {
    if (is3DMode && !is3DAvailable) {
      setIs3DMode(false);
      const map = (window as any).__leafletMap;
      requestAnimationFrame(() => map?.invalidateSize(false));
    }
  }, [is3DMode, is3DAvailable]);

  const handleActivate3D = useCallback(() => {
    if (!is3DAvailable) return;
    const map = (window as any).__leafletMap;
    if (map) {
      const c = map.getCenter();
      initialDeckViewStateRef.current = { lng: c.lng, lat: c.lat, zoom: map.getZoom() };
    }
    setIs3DMode(true);
  }, [is3DAvailable]);

  const handleReturnTo2D = useCallback((lng: number, lat: number, zoom: number) => {
    const map = (window as any).__leafletMap;
    if (map) {
      map.setView([lat, lng], zoom, { animate: false });
      requestAnimationFrame(() => map.invalidateSize(false));
    }
    setIs3DMode(false);
  }, []);

  // User clicks the "2D" button -> read current deck.gl position, sync Leaflet
  const handleManualReturn2D = useCallback(() => {
    const vs = deckViewStateRef.current;
    const map = (window as any).__leafletMap;
    if (map) {
      map.setView([vs.latitude, vs.longitude], vs.zoom, { animate: false });
      requestAnimationFrame(() => map.invalidateSize(false));
    }
    setIs3DMode(false);
  }, []);
  const [basemap, setBasemap] = useState<BasemapId>("none");

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
    color: countryColors,      // couleur frontière du pays
    weight: 1,
    fillColor: background,  // fond couleur du background general
    fillOpacity: basemap !== "none" ? 0 : 1,
  }), [background, countryColors, basemap]);
  const lakesStyle = useMemo(() => ({
    color: lakesColores,      // couleur lacs
    weight: 1.2,
    // si préfère uniquement le contour mettre fillOpacity: 0
    fillColor: lakesColores,
    fillOpacity: 0.85,
  }), []);
  const cantonsStyle = useMemo(() => ({
    color: cantonColores,      // couleur canton
    weight: 1.2,
    fillOpacity: 0,
  }), []);
  const districtsStyle = useMemo(() => ({
    color: districtColores,      // couleur district
    weight: 0.9,
    fillOpacity: 0,
  }), []);
  const communesStyle = useMemo(() => ({
    color: communesColores,       // couleur commune
    weight: 0.6,
    fillOpacity: 0,
  }), []);

  const choroplethFillOpacity = basemap !== "none" ? 0.45 : 0.75;
  const activeTileConfig = basemap !== "none" ? BASEMAP_CONFIG[basemap] : null;

  // Alias pratiques
  const country   = bundle?.country   ?? null;
  const lakes     = bundle?.lakes     ?? null;
  const cantons   = bundle?.cantons   ?? null;
  const districts = bundle?.districts ?? null;
  const communes  = (bundle as any)?.communes ?? null;

  const getLegendDisplayValue = (rawValue: any): string => {
    if (rawValue == null || rawValue === "") {
      return "No data";
    }

    const items = (choropleth?.legend as any)?.items;

    if (!Array.isArray(items)) {
      return String(rawValue);
    }

    const findLabel = (value: any) => {
      const strValue = String(value);

      const found = items.find((it: any) => {
        const optionValue = it?.value ?? it?.label;
        return String(optionValue) === strValue;
      });

      return found?.label ?? strValue;
    };

    if (Array.isArray(rawValue)) {
      return rawValue.map(findLabel).join(", ");
    }

    return findLabel(rawValue);
  };

  const escapeHtml = (value: unknown): string =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

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
      {/* 3D overlay (deck.gl standalone canvas) */}
      {is3DMode && choropleth?.feature_collection && (
        <Suspense fallback={null}>
          <ChoroplethDeckLayer
            choropleth={choropleth}
            initialLng={initialDeckViewStateRef.current.lng}
            initialLat={initialDeckViewStateRef.current.lat}
            initialZoom={initialDeckViewStateRef.current.zoom}
            onSwitchTo2D={handleReturnTo2D}
            viewStateRef={deckViewStateRef}
            selectedArea={selectedArea ?? null}
            onSelectArea={onSelectArea ?? (() => {})}
            maxPositiveValue={maxPositiveValue}
          />
        </Suspense>
      )}

      {/* 2D / 3D toggle button */}
      {choropleth && (
        <button
          onClick={is3DMode ? handleManualReturn2D : handleActivate3D}
          disabled={!is3DAvailable && !is3DMode}
          title={
            !is3DAvailable && !is3DMode
              ? "Mode 3D disponible uniquement pour les données numériques"
              : is3DMode
              ? "Retour en mode 2D"
              : "Activer le mode 3D"
          }
          style={{
            position: "absolute",
            bottom: "1rem",
            left: "1rem",
            zIndex: 2000,
            padding: "5px 14px",
            borderRadius: "0.5rem",
            border: `1px solid ${borderColor}`,
            backgroundColor: is3DMode ? primary : "#FFFFFF",
            color: is3DMode ? adaptiveTextColorPrimary : "#111827",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: !is3DAvailable && !is3DMode ? "not-allowed" : "pointer",
            opacity: !is3DAvailable && !is3DMode ? 0.4 : 1,
            boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
            transition: "opacity 0.2s, background-color 0.2s",
            userSelect: "none",
            pointerEvents: "auto",
          }}
          aria-pressed={is3DMode}
          aria-label={is3DMode ? "Retour en mode 2D" : "Activer le mode 3D"}
        >
          {is3DMode ? "2D" : "3D"}
        </button>
      )}

      {/*
       * Leaflet container — kept mounted in 3D mode to preserve its internal
       * state (zoom, panes, event listeners).  Pointer events are disabled so
       * the invisible map does not intercept clicks meant for the deck.gl canvas.
       */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          visibility: is3DMode ? "hidden" : "visible",
          pointerEvents: is3DMode ? "none" : "auto",
        }}
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

        .leaflet-interactive:focus {
          outline: none !important;
        }

        .leaflet-interactive {
          outline: none !important;
        }

        [data-map-root] .choropleth-tooltip-name {
          font-weight: 600;
          margin-bottom: 2px;
        }

        [data-map-root] .choropleth-tooltip-value {
          font-size: 12px;
          line-height: 1.25;
          opacity: 0.9;
        }

        path:focus {
          outline: none !important;
        }
      `}</style>
      <MapContainer
        center={[46.8182, 9.2]}
        zoom={8}
        minZoom={8}
        maxBounds={SWISS_BOUNDS_PADDED}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        scrollWheelZoom
      >
        {/* Utilitaires : export écran, resize, bouton recadrage Suisse */}
        <ExposeMapOnWindow />
        <InstallScreenshoter showButton={true} hideElementsWithSelectors={['.leaflet-control-container', '[data-no-export]']} />
        <MapSizeFixer host={hostRef.current} />
        <TooltipZoomGuard />
        <ResetSwissControl position="topleft" />

        {/* Raster en fond (zIndex le plus bas) */}
        <Pane name="pane-raster" style={{ zIndex: 100 }}>
          {activeTileConfig && (
            <TileLayer
              key={basemap}
              url={activeTileConfig.url}
              attribution={activeTileConfig.attribution}
              {...(activeTileConfig.subdomains != null ? { subdomains: activeTileConfig.subdomains } : {})}
              noWrap={true}
              pane="pane-raster"
              crossOrigin="anonymous"
            />
          )}
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
              key={`choropleth-${choropleth.question_uid}-${choropleth.year_requested}-${choropleth.granularity}-${basemap !== "none" ? "bm" : "no-bm"}`}
              data={choropleth.feature_collection as any}
              pane="choropleth"
              style={(feat: any) => {
                const props = feat?.properties ?? {};
                const fill = props.fill_color ?? "#cccccc";
                const pat = props.fill_pattern;
                const map = (window as any).__leafletMap;

                const uid = props.unit_uid;

                const isSelected =
                  selectedArea &&
                  selectedArea.uid === uid &&
                  selectedArea.level === choropleth.granularity;

                const base: any = {
                  weight: isSelected ? 3 : 1,
                  opacity: 1,
                  color: isSelected ? selectionColor : borderColor, // couleur jaune
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
                  fillOpacity: choroplethFillOpacity,
                  fillColor: fill,
                };
              }}
              onEachFeature={(feature: any, layer: any) => {
                const props = feature?.properties ?? {};
                const v = props.value ?? null;

                const uid = props.unit_uid;
                const level = choropleth.granularity;

                const isSelected = () =>
                  selectedArea &&
                  selectedArea.uid === uid &&
                  selectedArea.level === level;

                layer.on("click", () => {
                  if (level === "federal") return;

                  onSelectArea?.({
                    uid,
                    name: props.name,
                    level,
                  });

                  const map = layer._map;
                  if (!map || !layer.getBounds) return;

                  const bounds = layer.getBounds();

                  // largeur du panel
                  const panelWidth = panelOpen ? Math.min(window.innerWidth * 0.9, 448) : 0;

                  map.fitBounds(bounds, {
                    paddingTopLeft: [20, 20],
                    paddingBottomRight: [panelWidth + 20, 20], // décalage ici
                    maxZoom: 10,
                    animate: true,
                    duration: 0.8,
                    easeLinearity: 0.25,
                  });
                });

                layer.on("mouseover", () => {
                  if (isSelected()) return;

                  // effet visuel
                  layer.setStyle({
                    weight: 4,
                    fillOpacity: 0.9,
                    opacity: 1,
                  });

                  // FORCE redraw 
                  if (layer._path) {
                    layer._path.style.transition = "all 0.15s ease";
                    layer._path.style.filter = "brightness(1.1)";
                  }

                  layer.bringToFront?.();
                });

              layer.on("mouseout", () => {
                if (isSelected()) return;

                layer.setStyle({
                  weight: 1,
                  fillOpacity: choroplethFillOpacity,
                  opacity: 1,
                });

                if (layer._path) {
                  layer._path.style.filter = "";
                }
              });

                const name = props.name ?? props.code ?? "";
                const displayValue = getLegendDisplayValue(v);

                layer.bindTooltip(
                  `
                    <div class="choropleth-tooltip-name">
                      ${escapeHtml(name)}
                    </div>
                    <div class="choropleth-tooltip-value">
                      ${escapeHtml(displayValue)}
                    </div>
                  `,
                  {
                    sticky: true,
                    opacity: 1,
                    className: "choropleth-tooltip",
                    offset: [12, 0],
                  }
                );
              }}
            />

            {/* Légende */}
            <MapLegendOverlay choropleth={choropleth} panelOpen={panelOpen} />
          </>
        )}
        {/* Points villes et labels */}
        <PlaceOfInterestLayer
          communes={communes}
          districts={districts}
          cantons={cantons}
          selectedBasemap={basemap}
          onBasemapChange={setBasemap}
        />
      </MapContainer>
      </div>{/* end Leaflet visibility wrapper */}

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

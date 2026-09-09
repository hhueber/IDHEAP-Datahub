/**
 * ChoroplethDeckLayer — standalone deck.gl canvas for 3D extrusion mode.
 *
 * Rendered as a full-screen absolute div that is shown/hidden by GeoJsonMap
 * depending on the active mode (2D / 3D).  Leaflet is kept mounted underneath
 * but hidden; this component owns its own WebGL context via deck.gl's Deck class.
 */

import { useEffect, useRef, useMemo } from 'react';
import { Deck, MapView } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { ChoroplethResponse } from '@/features/geo/geoApi';
import {
  PITCH_3D,
  BEARING_3D,
  MAX_ELEVATION,
  MAX_PITCH_3D,
  BACKGROUND_3D,
} from './choropleth3dConstants';

export type ViewState3D = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

export type ChoroplethDeckLayerProps = {
  choropleth: ChoroplethResponse;
  /** Leaflet map centre (lng) captured at the moment 3D was activated */
  initialLng: number;
  /** Leaflet map centre (lat) captured at the moment 3D was activated */
  initialLat: number;
  /** Leaflet zoom captured at the moment 3D was activated */
  initialZoom: number;
  /**
   * Mutable ref owned by GeoJsonMap.  Updated on every deck.gl viewState change
   * (no React state, no re-render).  Read by the parent when the user manually
   * clicks the 2D toggle button.
   */
  viewStateRef: React.MutableRefObject<ViewState3D>;
  selectedArea: { uid: number; level: string } | null;
  onSelectArea: (area: { uid: number; name?: string; level: string }) => void;
  /**
   * Maximum positive numeric value found in the current choropleth features.
   * Pre-computed by GeoJsonMap (single pass) so this component never iterates
   * the feature array again. Used as the elevation denominator:
   *   elevation = (value / maxPositiveValue) * MAX_ELEVATION
   * Zero means no exploitable numeric value exists (3D unavailable).
   */
  maxPositiveValue: number;
};

/** Convert a #rrggbb hex string to a deck.gl [R, G, B, A] tuple. */
function hexToCssRgba(hex: string, alpha = 230): [number, number, number, number] {
  if (!hex || hex.length < 7) return [204, 204, 204, alpha];
  try {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
      alpha,
    ];
  } catch {
    return [204, 204, 204, alpha];
  }
}

export default function ChoroplethDeckLayer({
  choropleth,
  initialLng,
  initialLat,
  initialZoom,
  viewStateRef,
  selectedArea,
  onSelectArea,
  maxPositiveValue,
}: ChoroplethDeckLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<Deck<any> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const onSelectAreaRef = useRef(onSelectArea);
  const granularityRef = useRef(choropleth.granularity);

  useEffect(() => { onSelectAreaRef.current = onSelectArea; }, [onSelectArea]);
  useEffect(() => { granularityRef.current = choropleth.granularity; }, [choropleth.granularity]);

  // Label lookup maps raw feature value -> legend label string.
  // Mirrors 2D getLegendDisplayValue: null/empty -> "No data", categorical
  // numeric values (e.g. 1 -> "Deutsch") resolved via legend items.
  const labelLookupRef = useRef<Map<string, string>>(new Map());

  const labelLookup = useMemo(() => {
    const map = new Map<string, string>();
    const items = (choropleth.legend as any)?.items;
    if (!Array.isArray(items)) return map;
    for (const it of items) {
      const key = String(it?.value ?? it?.label ?? '');
      if (key) map.set(key, String(it?.label ?? key));
    }
    return map;
  }, [choropleth.legend]);

  useEffect(() => { labelLookupRef.current = labelLookup; }, [labelLookup]);

  // GeoJsonLayer rebuilt only when choropleth data, maxPositiveValue,
  // or selectedArea changes.  deck.gl diffs layers by id: same id +
  // updateTriggers means GPU attribute buffers are patched without
  // re-triangulating the geometry from scratch.
  const layer = useMemo(() => {
    const selectedUid = selectedArea?.uid ?? null;
    const selectedLevel = selectedArea?.level ?? null;
    const granularity = choropleth.granularity;

    return new GeoJsonLayer({
      id: 'choropleth-3d',
      data: choropleth.feature_collection as any,

      // ---- geometry ----
      extruded: true,
      filled: true,
      stroked: false,
      wireframe: false,

      // ---- elevation ----
      // Normalisation: elevation = (value / maxPositiveValue) * MAX_ELEVATION
      // so that 0 is always the true base and every positive value is visible.
      // Rules:
      //   value <= 0  -> 0
      //   null / no_data / no_response → 0
      //   non-numeric string -> 0
      //   value > 0 -> proportional height (clamped to MAX_ELEVATION)
      getElevation: (f: any) => {
        const p = f?.properties ?? {};
        if (p.value_kind !== 'value' || p.value == null) return 0;
        const v = parseFloat(String(p.value));
        if (isNaN(v) || v <= 0 || maxPositiveValue <= 0) return 0;
        return Math.min(v / maxPositiveValue, 1) * MAX_ELEVATION;
      },

      // colour (reuses fill_color precomputed by the backend unchanged)
      getFillColor: (f: any) => {
        const uid = f?.properties?.unit_uid;
        const isSelected =
          uid != null &&
          uid === selectedUid &&
          granularity === selectedLevel;
        if (isSelected) return [255, 215, 0, 255] as [number, number, number, number];
        return hexToCssRgba(f?.properties?.fill_color ?? '#cccccc');
      },

      // interaction
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 50] as [number, number, number, number],

      // lighting
      material: {
        ambient: 0.4,
        diffuse: 0.6,
        shininess: 20,
      },

      updateTriggers: {
        getElevation: [choropleth.question_uid, choropleth.year_requested, maxPositiveValue],
        getFillColor: [choropleth.question_uid, choropleth.year_requested, selectedUid, selectedLevel],
      },
    });
  }, [choropleth, maxPositiveValue, selectedArea]);

  // Push layer updates to the Deck instance whenever the memoized layer changes
  useEffect(() => {
    deckRef.current?.setProps({ layers: [layer] });
  }, [layer]);

  // Deck initialisation runs once on mount, cleaned up on unmount.
  // `layer` is captured via closure from the first render; subsequent
  // changes are handled by the effect above.
  useEffect(() => {
    if (!containerRef.current || deckRef.current) return;

    const initialViewState: ViewState3D = {
      longitude: initialLng,
      latitude: initialLat,
      zoom: initialZoom,
      pitch: PITCH_3D,
      bearing: BEARING_3D,
    };
    viewStateRef.current = initialViewState;

    const deck = new Deck({
      parent: containerRef.current,

      views: new MapView({
        id: 'main',
        controller: {
          scrollZoom: true,
          dragPan: true,
          dragRotate: true,   // right-drag to change pitch; see note on bearing below
          doubleClickZoom: true,
          touchRotate: false, // avoid accidental rotation on touch
          keyboard: false,
          // minPitch / maxPitch are MapController-specific options
          minPitch: 0,
          maxPitch: MAX_PITCH_3D,
        } as any,
      }),

      initialViewState,

      // Initial layer captured from first render's closure.
      // The separate layer-update effect covers all subsequent changes.
      layers: [layer],

      getCursor: ({ isHovering }: any) => (isHovering ? 'pointer' : 'grab'),

      // viewState change
      // Updates the shared ref (no React setState)
      // when pitch falls below the threshold.
      onViewStateChange: ({ viewState }: any) => {
        viewStateRef.current = viewState as ViewState3D;
      },

      // hover imperative DOM update, zero React re-renders
      onHover: (info: any) => {
        const el = tooltipRef.current;
        if (!el) return;

        if (!info.object) {
          el.hidden = true;
          return;
        }

        el.hidden = false;
        // Use CSS transform for position (GPU-composited, no layout reflow)
        el.style.transform = `translate(${info.x + 14}px, ${info.y - 10}px)`;

        const p = info.object.properties ?? {};
        const nameEl = el.querySelector<HTMLElement>('.tt-name');
        const valueEl = el.querySelector<HTMLElement>('.tt-value');
        if (nameEl) nameEl.textContent = p.name ?? p.code ?? '';
        if (valueEl) {
          const raw = p.value;
          let displayValue: string;
          if (raw == null || raw === '') {
            displayValue = 'No data';
          } else {
            const lookup = labelLookupRef.current;
            const key = String(raw);
            displayValue = lookup.has(key) ? lookup.get(key)! : key;
          }
          valueEl.textContent = displayValue;
          valueEl.hidden = false;
        }
      },

      // click delegates to the parent's onSelectArea
      onClick: (info: any) => {
        if (!info.object) return;
        const p = info.object.properties ?? {};
        const uid = p.unit_uid;
        const level = granularityRef.current;
        if (!uid || level === 'federal') return;
        onSelectAreaRef.current({ uid, name: p.name, level });
      },
    });

    deckRef.current = deck;

    return () => {
      deck.finalize();
      deckRef.current = null;
    };
    // Intentionally empty deps: Deck is created once on mount.
    // layer is captured from first render; onViewStateChange / onHover / onClick
    // read from stable refs so they never go stale.
  }, []);

  // Render
  return (
    <div
      className="absolute inset-0"
      style={{ background: BACKGROUND_3D }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* deck.gl injects its canvas here */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/*
       * Tooltip always in the DOM but hidden by default.
       * Updated imperatively via tooltipRef to avoid React re-renders
       * on every mouse-move event.
       */}
      <div
        ref={tooltipRef}
        hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'translate(0,0)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          borderRadius: 6,
          padding: '5px 9px',
          pointerEvents: 'none',
          fontSize: 13,
          lineHeight: 1.4,
          maxWidth: 220,
          zIndex: 1000,
          willChange: 'transform',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        <div className="tt-name" style={{ fontWeight: 600 }} />
        <div className="tt-value" style={{ fontSize: 12, opacity: 0.8 }} />
      </div>
    </div>
  );
}

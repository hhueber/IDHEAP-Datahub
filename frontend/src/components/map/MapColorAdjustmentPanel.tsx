import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/theme/useTheme";
import {
  CHOROPLETH_INTENSITY_DEFAULT,
  CHOROPLETH_INTENSITY_MAX,
  CHOROPLETH_INTENSITY_MIN,
} from "@/features/geo/choropleth/choroplethColorAdjustment";

type Position = { x: number; y: number };

type Props = {
  open: boolean;
  value: number;
  onChange: (value: number) => void;
  onReset: () => void;
  boundaryRef: RefObject<HTMLDivElement | null>;
};

type DragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

const POSITION_STORAGE_KEY = "map_choropleth_color_panel_position";
const DEFAULT_POSITION: Position = { x: 64, y: 390 };

function readStoredPosition(): Position {
  if (typeof window === "undefined") return DEFAULT_POSITION;

  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return DEFAULT_POSITION;

    const parsed = JSON.parse(raw);

    return Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)
      ? { x: parsed.x, y: parsed.y }
      : DEFAULT_POSITION;
  } catch {
    return DEFAULT_POSITION;
  }
}

export default function MapColorAdjustmentPanel({
  open,
  value,
  onChange,
  onReset,
  boundaryRef,
}: Props) {
  const { t } = useTranslation();
  const { primary, adaptiveTextColorPrimary } = useTheme();

  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>(readStoredPosition);
  const positionRef = useRef(position);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    positionRef.current = position;

    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
      } catch {
        // La position reste valable pour la session courante.
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [position]);

  const clampPosition = (next: Position): Position => {
    const boundary = boundaryRef.current;
    const panel = panelRef.current;

    if (!boundary || !panel) return next;

    const boundaryRect = boundary.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    return {
      x: Math.min(
        Math.max(0, boundaryRect.width - panelRect.width),
        Math.max(0, next.x)
      ),
      y: Math.min(
        Math.max(0, boundaryRect.height - panelRect.height),
        Math.max(0, next.y)
      ),
    };
  };

  useEffect(() => {
    if (!open) return;

    const ensureVisible = () =>
      setPosition((current) => clampPosition(current));

    const frame = requestAnimationFrame(ensureVisible);
    window.addEventListener("resize", ensureVisible);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", ensureVisible);
    };
  }, [open]);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: positionRef.current.x,
      startY: positionRef.current.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    setPosition(
      clampPosition({
        x: drag.startX + event.clientX - drag.startClientX,
        y: drag.startY + event.clientY - drag.startClientY,
      })
    );
  };

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    dragRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Le pointer capture peut déjà avoir été libéré.
    }
  };

  if (!open) return null;

  const isDefault = value === CHOROPLETH_INTENSITY_DEFAULT;

  const valueDescription = isDefault
    ? t("map.choroplethColor.original")
    : value < CHOROPLETH_INTENSITY_DEFAULT
        ? t("map.choroplethColor.lighter")
        : t("map.choroplethColor.stronger");

  const stopPropagation = (event: React.SyntheticEvent) =>
    event.stopPropagation();

  return (
    <div
      ref={panelRef}
      data-no-export
      className="absolute w-[280px] overflow-hidden rounded-lg bg-white text-[#111827]"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 2200,
        border: "2px solid rgba(0, 0, 0, 0.2)",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
      }}
      onPointerDown={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
      onWheel={stopPropagation}
    >
      {/* Zone utilisée uniquement pour déplacer la popup */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex cursor-move select-none items-center gap-2 border-b border-black/10 px-3 py-2"
        style={{ touchAction: "none" }}
      >
        <span aria-hidden="true" className="text-[15px] leading-none opacity-55">
          ⠿
        </span>

        <span className="text-[13px] font-semibold">
          {t("map.choroplethColor.title")}
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="mb-2 flex items-center justify-between text-[11px] opacity-70">
          <span>{t("map.choroplethColor.light")}</span>
          <span>{t("map.choroplethColor.original")}</span>
          <span>{t("map.choroplethColor.strong")}</span>
        </div>

        <input
          type="range"
          min={CHOROPLETH_INTENSITY_MIN}
          max={CHOROPLETH_INTENSITY_MAX}
          step={5}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={t("map.choroplethColor.ariaLabel")}
          className="w-full cursor-pointer"
          style={{ accentColor: primary }}
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-semibold">{value} %</span>
            <span className="ml-1.5 opacity-65">{valueDescription}</span>
          </div>

          <button
            type="button"
            onClick={onReset}
            disabled={isDefault}
            className="rounded px-2 py-1 text-xs transition hover:opacity-90"
            style={{
              border: "none",
              backgroundColor: isDefault ? "#E5E7EB" : primary,
              color: isDefault ? "#6B7280" : adaptiveTextColorPrimary,
              cursor: isDefault ? "default" : "pointer",
            }}
          >
            {t("map.choroplethColor.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}

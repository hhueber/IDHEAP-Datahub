import { useMemo, useState, useRef, useEffect } from "react";
import { ChoroplethResponse } from "@/features/geo/geoApi";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "react-i18next";

type Props = {
  choropleth: ChoroplethResponse;
  panelOpen?: boolean;
};

type StatItem = {
  label: string;
  color: string;
  count: number;
  pct: number;
};

function fmtTick(x: number): string {
  if (!Number.isFinite(x)) return "";
  if (Math.abs(x) >= 1000) return Math.round(x).toLocaleString("fr-CH");
  if (Math.abs(x) >= 10) return x.toFixed(0);
  return x.toFixed(2);
}

function fmtPct(x: number): string {
  if (!Number.isFinite(x)) return "0%";
  if (x >= 10) return `${x.toFixed(0)}%`;
  return `${x.toFixed(1)}%`;
}

function MiniDonut({
  items,
  size = 96,
  stroke = 12,
  trackColor = "rgba(120,120,120,0.15)",
}: {
  items: StatItem[];
  size?: number;
  stroke?: number;
  trackColor?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let acc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />

      {items.map((it, idx) => {
        const frac = it.pct / 100;
        const dash = circumference * frac;
        const gap = circumference - dash;
        const offset = circumference * (1 - acc);
        acc += frac;

        return (
          <circle
            key={idx}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={it.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
    </svg>
  );
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [enabled, onClose, ref]);
}

export default function MapLegendOverlay({ choropleth, panelOpen = false }: Props) {
  const {
    background,
    borderColor,
    textColor,
    hoverText07,
    hoverPrimary04,
  } = useTheme();

  const legend = choropleth.legend as any;
  const { t } = useTranslation();
  const isGradient = legend?.type === "gradient";
  const g = legend?.gradient;

  const drawerShift = "calc(-1 * min(90vw, 28rem))";

  const [statsOpen, setStatsOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useOutsideClick(popRef, () => setStatsOpen(false), statsOpen);

  const stats = useMemo(() => {
    if (isGradient) return null;
    if (!Array.isArray(legend?.items) || !Array.isArray(choropleth?.feature_collection?.features)) {
      return null;
    }

    const features = choropleth.feature_collection.features;

    // On compte uniquement les vraies valeurs catégorielles
    const validFeatures = features.filter((f: any) => {
      const props = f?.properties ?? {};
      return props.value_kind === "value" && props.value != null;
    });

    const total = validFeatures.length;

    const counts = new Map<string, number>();
    validFeatures.forEach((f: any) => {
      const key = String(f?.properties?.value ?? "");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const items: StatItem[] = legend.items
      .map((it: any) => {
        const key = String(it.value ?? it.label ?? "");
        const count = counts.get(key) ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return {
          label: it.label,
          color: it.color,
          count,
          pct,
        };
      })
      .filter((it: StatItem) => it.count > 0)
      .sort((a: StatItem, b: StatItem) => b.count - a.count);

    const noData = features.filter((f: any) => f?.properties?.value_kind === "no_data").length;
    const noResponse = features.filter((f: any) => f?.properties?.value_kind === "no_response").length;

    return {
      totalFeatures: features.length,
      totalValid: total,
      noData,
      noResponse,
      items,
    };
  }, [choropleth, isGradient, legend]);

  return (
    <div
      className="
        absolute z-[1200]
        right-4 top-4
        w-[220px]
        rounded-2xl shadow-lg
        p-3
        overflow-visible
        transition-transform duration-300 ease-out
      "
      style={{
        transform: panelOpen ? `translate(${drawerShift})` : "translate(0)",
        backgroundColor: background,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: borderColor,
        color: textColor,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: 0.97,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="text-base font-semibold leading-tight">{legend.title}</div>

        {!isGradient && stats && (
          <div className="relative" ref={popRef}>
            <button
              type="button"
              onClick={() => setStatsOpen((v) => !v)}
              className="h-8 w-8 rounded-xl border grid place-items-center shadow-sm transition"
              style={{
                borderColor,
                backgroundColor: statsOpen ? hoverPrimary04 : background,
                color: textColor,
              }}
              aria-label={t("map.legend.showStats")}
              aria-expanded={statsOpen}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path
                  d="M5 19V10M12 19V5M19 19v-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {statsOpen && (
              <div
                className="absolute right-0 top-10 w-[320px] rounded-2xl p-4 shadow-2xl"
                style={{
                  backgroundColor: background,
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                }}
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="text-sm font-semibold">{t("map.legend.distribution")}</div>
                    <div className="text-xs" style={{ color: hoverText07 }}>
                      {t("map.legend.unitsWithResponse", { count: stats.totalValid })}
                    </div>
                  </div>

                  <div className="shrink-0 relative">
                    <MiniDonut items={stats.items} trackColor={hoverText07} />
                    <div className="absolute inset-0 grid place-items-center text-xs font-semibold">
                      {stats.totalValid}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {stats.items.map((it, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-md shrink-0"
                            style={{
                              backgroundColor: it.color,
                              border: `1px solid ${borderColor}`,
                            }}
                          />
                          <span className="text-sm truncate">{it.label}</span>
                        </div>

                        <div className="text-xs tabular-nums whitespace-nowrap" style={{ color: hoverText07 }}>
                          {it.count} · {fmtPct(it.pct)}
                        </div>
                      </div>

                      <div
                        className="h-2.5 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(127,127,127,0.14)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(it.pct, 2)}%`,
                            backgroundColor: it.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {(stats.noData > 0 || stats.noResponse > 0) && (
                  <div
                    className="mt-4 pt-3 text-xs space-y-1"
                    style={{ borderTop: `1px solid ${borderColor}`, color: hoverText07 }}
                  >
                    {stats.noData > 0 && <div>{t("map.legend.noData")} : {stats.noData}</div>}
                    {stats.noResponse > 0 && <div>{t("map.legend.noResponse")} : {stats.noResponse}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gradient */}
      {isGradient && g ? (
        <>
          <div className="flex gap-4">
            <div className="relative h-72 w-20">
              {Array.isArray(g.ticks) &&
                g.ticks.map((t: number, i: number) => {
                  const ratio = g.vmax === g.vmin ? 0 : (t - g.vmin) / (g.vmax - g.vmin);
                  const y = (1 - ratio) * 100;

                  return (
                    <div
                      key={i}
                      className="absolute left-0 flex items-center gap-2 text-sm"
                      style={{ top: `${y}%`, transform: "translateY(-50%)", color: hoverText07 }}
                    >
                      <span className="tabular-nums">{fmtTick(t)}</span>
                      <span
                        className="h-[1px] w-3"
                        style={{ backgroundColor: hoverText07, opacity: 0.6 }}
                      />
                    </div>
                  );
                })}
            </div>

            <div
              className="h-72 w-8 rounded-xl"
              style={{
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: borderColor,
                background: `linear-gradient(to top, ${g.start}, ${g.end})`,
              }}
            />
          </div>

          {Array.isArray(legend.items) && legend.items.length > 0 && (
            <div
              className="mt-4 pt-3 space-y-2"
              style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: borderColor }}
            >
              {legend.items.map((it: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span
                    className="inline-block h-4 w-4 rounded-md"
                    style={{
                      backgroundColor: it.color,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: borderColor,
                    }}
                  />
                  <span className="truncate">{it.label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          {Array.isArray(legend.items) &&
            legend.items.map((it: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <span
                  className="inline-block h-4 w-4 rounded-md shrink-0"
                  style={{
                    backgroundColor: it.color,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: borderColor,
                  }}
                />
                <span className="truncate">{it.label}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

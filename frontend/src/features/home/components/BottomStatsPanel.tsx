import { useEffect, useMemo, useRef, useState } from "react";
import { statsApi } from "@/features/home/services/statsApi";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { useTheme } from "@/theme/useTheme";

function DistributionChart({
  title,
  data,
  currentValue,
  valueLabelMap,
}: {
  title: string;
  data: Array<{ value: string | number; count: number }>;
  currentValue: string | number;
  valueLabelMap?: Record<string, string>;
}) {
  const { t } = useTranslation();
  const {background, borderColor, textColor, hoverText07, hoverPrimary06, primary} = useTheme();
  const [tooltip, setTooltip] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Helpers
  const getLabel = (val: string | number): string => {
    const key = String(val);
    return valueLabelMap?.[key] ?? key;
  };

  // Transform data
  function transformData(data: any[]) {
    if (data.length <= 8) return data;

    const sorted = [...data].sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6);

    const otherCount = rest.reduce((acc, d) => acc + d.count, 0);

    return [...top, { value: "Other", count: otherCount }];
  }

  function createBins(data: any[], binCount = 6) {
    const numeric = data
      .map((d) => ({ ...d, num: Number(d.value) }))
      .filter((d) => !isNaN(d.num));

    if (numeric.length === 0) return data;

    const min = Math.min(...numeric.map((d) => d.num));
    const max = Math.max(...numeric.map((d) => d.num));

    if (min === max) return data;

    const step = (max - min) / binCount;

    const bins: any[] = [];

    for (let i = 0; i < binCount; i++) {
      const start = min + i * step;
      const end = start + step;

      const count = numeric
        .filter((d) => d.num >= start && d.num < end)
        .reduce((acc, d) => acc + d.count, 0);

      bins.push({
        value: `${Math.round(start)}–${Math.round(end)}`,
        count,
      });
    }

    return bins;
  }

  // Modulable data mode
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const numericRatio =
      data.filter((d) => !isNaN(Number(d.value))).length / data.length;

    // gradient-like -> bins
    if (numericRatio > 0.7 && data.length > 8) {
      return createBins(data);
    }

    // trop de catégories -> top + other
    return transformData(data);
  }, [data]);

  // Computed
  const total = processedData.reduce((acc, d) => acc + d.count, 0);
  const max = Math.max(...processedData.map((d) => d.count), 1);

  const hasLongLabels = processedData.some(
    (d) => getLabel(d.value).length > 10
  );

  const compactMode =
    processedData.length > 8 || hasLongLabels;

  const gradientLike = processedData.some((d) =>
    String(d.value).includes("–")
  );

  const barWidth = useMemo(() => {
    const n = processedData.length;

    if (n <= 4) return 6;     // stick fines
    if (n <= 6) return 5;
    if (n <= 8) return 4;
    return 3;                // stick très fines
    }, [processedData]);

  function isValueInBin(binLabel: string, value: number) {
    if (!binLabel.includes("–")) return false;

    const [min, max] = binLabel.split("–").map(Number);

    return value >= min && value < max;
  }

  const getGradientTicks = () => {
    if (!gradientLike || processedData.length < 3) return null;

    const first = processedData[0];
    const mid = processedData[Math.floor(processedData.length / 2)];
    const last = processedData[processedData.length - 1];

    return { first, mid, last };
  };

  const truncateLabel = (label: string, maxLen = 12) => {
    if (label.length <= maxLen) return label;
    return label.slice(0, maxLen - 1) + "…";
  };

  // Render
  return (
    <div
      ref={containerRef}
      className="rounded-xl p-4 w-[240px] relative border"
        style={{
          backgroundColor: hoverPrimary06,
          borderColor: borderColor,
        }}
    >
      <div className="text-sm font-medium mb-3 text-center"
        style={{ color: textColor }}
      >
        {title}
      </div>

      <div
        className={`h-32 flex items-end justify-center relative ${
          compactMode ? "gap-1" : "gap-3"
        }`}
      >
        {processedData.map((d, i) => {
          let isCurrent = false;

          if (gradientLike) {
            const num = Number(currentValue);

            if (!isNaN(num)) {
              isCurrent = isValueInBin(String(d.value), num);
            }
          } else {
            isCurrent = String(d.value) === String(currentValue);
          }

          const rawHeight = (d.count / max) * 100;
          const height = Math.max(rawHeight, 8);

          const percentage =
            total > 0
              ? ((d.count / total) * 100).toFixed(1)
              : "0";

          const fullLabel = getLabel(d.value);

          return (
            <div
              key={`${title}-${String(d.value)}-${i}`}
              className="flex flex-col items-center justify-end h-full relative"
              onMouseMove={(e) => {
                if (!containerRef.current) return;

                const rect =
                  containerRef.current.getBoundingClientRect();

                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  value: d.value,
                  label: fullLabel,
                  count: d.count,
                  percentage,
                  isCurrent,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="rounded-lg transition-all duration-300 mt-auto"
                style={{
                width: `${barWidth * 4}px`,
                height: `${height}%`,
                minHeight: "6px",
                backgroundColor: isCurrent ? primary : borderColor,
                }}
              />

              {!gradientLike && (
                <div
                    className={`
                      mt-2 text-center flex items-start justify-center
                      ${compactMode ? "text-[10px] w-[40px]" : "text-xs w-[60px]"}
                    `}
                    title={fullLabel}
                    style={{
                      minHeight: compactMode ? "20px" : "28px",
                      lineHeight: 1.1,
                      color: hoverText07,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                >
                    {truncateLabel(fullLabel, compactMode ? 10 : 14)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gradient min/max */}
      {gradientLike && (() => {
        const ticks = getGradientTicks();
        if (!ticks) return null;

        return (
            <div className="relative mt-3 h-4 text-[10px]"
              style={{ color: hoverText07 }}>

            {/* Min */}
            <div className="absolute left-0 text-left">
                {getLabel(ticks.first.value)}
            </div>

            {/* Mid */}
            <div className="absolute left-1/2 -translate-x-1/2 text-center">
                {getLabel(ticks.mid.value)}
            </div>

            {/* Max */}
            <div className="absolute right-0 text-right">
                {getLabel(ticks.last.value)}
            </div>

            </div>
        );
      })()}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 rounded-xl px-4 py-3 text-xs backdrop-blur-md"
          style={{
            backgroundColor: background,
            border: `1px solid ${borderColor}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            color: textColor,
            left: tooltip.x,
            top: tooltip.y - 110,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold mb-1"
            style={{ color: textColor }}>
            {tooltip.label}
          </div>

          <div>{t("stats.value")} {tooltip.value}</div>
          <div>{t("stats.count")} {tooltip.count}</div>
          <div>{t("stats.share")} {tooltip.percentage}{"\u0025"}</div> { /* Unicode du pourcentage */}
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs mt-4" style={{ color: hoverText07 }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: primary }}></div>
          <span style={{ color: hoverText07 }}>{t("stats.selected")}</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: borderColor }}></div>
          <span style={{ color: hoverText07 }}>{t("stats.others")}</span>
        </div>
      </div>
    </div>
  );
}

export default function BottomStatsPanel({
  selectedArea,
  onClose,
  questionUid,
  year,
  scope,
}: any) {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const {background, borderColor, textColor, hoverText07, hoverPrimary06, primary} = useTheme();

  const valueLabelMap = useMemo(() => {
    const map: Record<string, string> = {};

    if (data?.options?.length) {
        data.options.forEach((opt: any) => {
        map[String(opt.value)] = opt.label;
        });
    }

    return map;
  }, [data]);

  useEffect(() => {
    if (!selectedArea || !questionUid || !year) return;

    setLoading(true);
    setData(null);

    statsApi
      .getComparison({
        scope,
        question_uid: questionUid,
        year,
        area_uid: selectedArea.uid,
        level: selectedArea.level,
      })
      .then((res) => setData(res.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedArea, questionUid, year, scope]);

  if (!selectedArea || !questionUid || !year) return null;

  const unitLabel =
    selectedArea.level === "commune"
      ? "communes"
      : selectedArea.level === "district"
      ? "districts"
      : "cantons";

  const getLabel = (val: any) => {
    const str = String(val);
    return valueLabelMap[str] ?? str;
  };

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-[40]
        rounded-t-3xl shadow-2xl
        border-t
        px-6 py-5
        max-h-[30vh]
        overflow-y-auto
      "
      style={{
        backgroundColor: background,
        borderColor: borderColor,
      }}
    >
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-xs uppercase" style={{ color: hoverText07 }}>
            {selectedArea.level}
          </div>
          <div className="text-xl font-semibold" style={{ color: textColor }}>
            {selectedArea.name}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xl transition-colors"
          style={{
            color: hoverText07,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
          onMouseLeave={(e) => (e.currentTarget.style.color = hoverText07)}
        >
          {"\u2715"} {/* Unicode croix */}
        </button>
      </div>

      {loading && (
        <div className="text-center text-sm py-6" style={{ color: hoverText07 }}>
          <LoadingDots label={t("stats.loading")} />
        </div>
      )}

      {!loading && !data && (
        <div className="text-center text-sm py-6" style={{ color: textColor }}>
          {t("stats.noData")}
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">

          {/* Ligne du haut : contexte + stats */}
          <div className="flex flex-col md:flex-row gap-4">

            {/* Context card */}
            {data.context && (
                <div
                  className="rounded-xl p-4 text-sm space-y-1 flex-1 border"
                  style={{
                    backgroundColor: hoverPrimary06,
                    borderColor: borderColor,
                    color: textColor,
                  }}
                >
                {data.context.commune && (
                  <div>
                    {t("stats.context.commune")}: <strong>{data.context.commune}</strong>
                  </div>
                )}

                {data.context.district && (
                  <div>
                    {t("stats.context.district")}: <strong>{data.context.district}</strong>
                  </div>
                )}

                {data.context.canton && (
                  <div>
                    {t("stats.context.canton")}: <strong>{data.context.canton}</strong>
                  </div>
                )}

                {data.context.nb_communes && (
                  <div>
                    {t("stats.context.communes", {count: data.context.nb_communes})}
                  </div>
                )}
                </div>
            )}

            {/* Stats card */}
            <div
              className="rounded-xl p-4 flex-1 shadow-sm border"
              style={{
                backgroundColor: hoverPrimary06,
                borderColor: borderColor,
              }}
            >
                <div className="text-xs" style={{ color: hoverText07 }}>
                  {t("stats.selectedValue")}
                </div>

                <div
                  className="text-2xl font-bold mb-2"
                  style={{ color: textColor }}
                >
                  {getLabel(data.value)}
                </div>

                <div
                  className="text-sm font-semibold mb-1"
                  style={{ color: primary }}
                >
                  {data.percentage_same}{"\u0025"} {t("stats.sameAnswer")} {/* Unicode du pourcentage */}
                </div>

                <div className="text-sm" style={{ color: hoverText07 }}>
                  {t("stats.countText", {
                    count: data.same_count,
                    total: data.total,
                    unit: unitLabel,
                  })}
                </div>
              </div>
            </div>

            {/* Ligne du bas : graphiques */}
            {data.distribution && (
            <div className="flex justify-center gap-4 flex-wrap">
                <DistributionChart
                title="Commune"
                data={data.distribution.commune}
                currentValue={data.value}
                valueLabelMap={valueLabelMap}
                />

                <DistributionChart
                title="District"
                data={data.distribution.district}
                currentValue={data.value}
                valueLabelMap={valueLabelMap}
                />

                <DistributionChart
                title="Canton"
                data={data.distribution.canton}
                currentValue={data.value}
                valueLabelMap={valueLabelMap}
                />
            </div>
            )}
        </div>
      )}
    </div>
  );
}

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";

type Props = {
  allYears: number[];
  enabledYears: number[];
  selectedYear: number | null;
  onSelect: (year: number) => void;
  loading?: boolean;
  questionSelected?: boolean;
  visible?: boolean;
  isGlobal: boolean;
};

export default function GlobalQuestionTimeline({
  allYears,
  enabledYears,
  selectedYear,
  onSelect,
  loading = false,
  questionSelected = false,
  visible = true,
  isGlobal,
}: Props) {
  const { t } = useTranslation();
  const {textColor, background, borderColor, hoverText07, hoverText30, primary, hoverPrimary04, hoverPrimary06} = useTheme();

  const sortedYears = useMemo(
    () => [...allYears].filter((y) => Number.isFinite(y)).sort((a, b) => a - b),
    [allYears]
  );

  const enabledSet = useMemo(() => new Set(enabledYears), [enabledYears]);

  const minYear = sortedYears.length ? sortedYears[0] : 0;
  const maxYear = sortedYears.length ? sortedYears[sortedYears.length - 1] : 0;
  const range = Math.max(1, maxYear - minYear);
  const shouldScroll = sortedYears.length > 6;
  const disabled = !isGlobal || !questionSelected;

  const getLeftPercent = (year: number) => {
    if (sortedYears.length <= 1) return 50;
    return ((year - minYear) / range) * 100;
  };

  return (
    <div
      className={`relative transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      style={{
        minHeight: 160,
        visibility: visible ? "visible" : "hidden",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
      aria-hidden={!visible}
    >
      <div
        className="rounded-2xl px-4 py-4 relative"
        style={{
          backgroundColor: background,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor,
          minHeight: 160,
        }}
      >

        {sortedYears.length === 0 ? (
          <div
            className="rounded-xl text-sm px-3 py-3"
            style={{
              backgroundColor: background,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor,
              color: hoverText07,
            }}
          >
            {t("home.noAvailableYears")}
          </div>
        ) : (
          <div className={`relative pt-2 pb-2 ${shouldScroll ? "overflow-x-auto" : ""}`}>
            <div
                className="relative"
                style={{
                    minWidth: shouldScroll ? `${sortedYears.length * 70}px` : "100%",
                }}
            >
            
            {/* Ligne principale */}
            <div
              className="absolute left-3 right-3 top-[58px] h-[4px] rounded-full"
              style={{ backgroundColor: hoverText30 }}
            />

            {/* Segment actif entre min et max année sélectionnable */}
            {enabledYears.length > 0 && (
              <div
                className="absolute top-[58px] h-[4px] rounded-full"
                style={{
                  left: `${getLeftPercent(Math.min(...enabledYears))}%`,
                  width: `calc(${getLeftPercent(Math.max(...enabledYears)) - getLeftPercent(Math.min(...enabledYears))}% )`,
                  backgroundColor: hoverPrimary04,
                }}
              />
            )}

            {/* Points / repères */}
            <div className="relative h-[90px]">
              {sortedYears.map((year, index) => {
                const enabled = questionSelected && enabledSet.has(year) && !loading;
                const selected = selectedYear === year;
                const left = getLeftPercent(year);

                return (
                  <div
                    key={year}
                    className="absolute"
                    style={{
                        left: `${left}%`,
                        top: 0,
                        minWidth: 40,
                        transform:
                            index === 0
                            ? "translateX(0%)"            //  premier -> collé à gauche
                            : index === sortedYears.length - 1
                            ? "translateX(-100%)"         // dernier -> collé à droite
                            : "translateX(-50%)",         // autres -> centrés
                    }}
                  >
                    {/* petit tick */}
                    <div
                      className="mx-auto mb-2 h-4 w-[2px] rounded-full"
                      style={{
                        backgroundColor: enabled ? primary : hoverText30,
                        opacity: enabled ? 1 : 0.75,
                      }}
                    />

                    <button
                      type="button"
                      disabled={!enabled}
                      onClick={() => enabled && onSelect(year)}
                      className="relative block transition-all duration-150 disabled:cursor-not-allowed"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        border: `2px solid ${selected ? primary : enabled ? hoverPrimary04 : hoverText30}`,
                        backgroundColor: selected ? primary : enabled ? background : hoverText30,
                        boxShadow: selected ? `0 0 0 5px ${hoverPrimary06}` : "none",
                        transform: selected ? "scale(1.08)" : "scale(1)",
                        margin: "0 auto",
                      }}
                      aria-pressed={selected}
                      aria-label={`${t("home.selectYear")} ${year}`}
                      title={String(year)}
                    >
                      <span className="sr-only">{year}</span>
                    </button>

                    <div
                        className="mt-3 text-center text-[10px] font-medium whitespace-nowrap"
                        style={{
                            color: selected ? textColor : enabled ? textColor : hoverText07,
                            opacity: selected ? 1 : enabled ? 0.95 : 0.7,
                            transform: index % 2 === 0 ? "translateY(0)" : "translateY(10px)",
                            maxWidth: 50,
                        }}
                        >
                        {year}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Légende d’état */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs" style={{ color: hoverText07 }}>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: primary }}
                />
                <span>{t("home.timelineAvailable")}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: hoverText30 }}
                />
                <span>{t("home.timelineUnavailable")}</span>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

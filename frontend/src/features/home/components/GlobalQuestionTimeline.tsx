import { useEffect, useMemo, useState } from "react";
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

  const {
    textColor,
    background,
    borderColor,
    hoverText07,
    hoverText30,
    primary,
  } = useTheme();

  const sortedYears = useMemo(
    () =>
      [...allYears]
        .filter((year) => Number.isFinite(year))
        .sort((a, b) => a - b),
    [allYears]
  );

  const enabledSet = useMemo(
    () => new Set(enabledYears),
    [enabledYears]
  );

  const enabledSortedYears = useMemo(
    () => sortedYears.filter((year) => enabledSet.has(year)),
    [sortedYears, enabledSet]
  );

  const minYear = sortedYears.length ? sortedYears[0] : 0;

  const maxYear = sortedYears.length
    ? sortedYears[sortedYears.length - 1]
    : 0;

  const range = Math.max(1, maxYear - minYear);

  // Année sélectionnée, ou année disponible la plus récente par défaut
  const defaultYear =
    selectedYear ??
    enabledSortedYears[enabledSortedYears.length - 1] ??
    maxYear;

  const [sliderYear, setSliderYear] = useState(defaultYear);

  useEffect(() => {
    setSliderYear(
      selectedYear ??
        enabledSortedYears[enabledSortedYears.length - 1] ??
        maxYear
    );
  }, [selectedYear, enabledSortedYears, maxYear]);

  const disabled =
    !questionSelected ||
    loading ||
    enabledSortedYears.length === 0;

  // Scroll uniquement lorsque beaucoup de dates doivent être affichées
  const shouldScroll = sortedYears.length > 8;

  // Position réelle de l'année sur la timeline
  const getLeftPercent = (year: number) => {
    if (sortedYears.length <= 1) return 50;

    return ((year - minYear) / range) * 100;
  };

  // Retourne l'année disponible la plus proche
  const getClosestEnabledYear = (year: number) => {
    if (!enabledSortedYears.length) return year;

    return enabledSortedYears.reduce((closest, current) => {
      const currentDistance = Math.abs(current - year);
      const closestDistance = Math.abs(closest - year);

      // En cas d'égalité, on sélectionne l'année suivante
      return currentDistance <= closestDistance
        ? current
        : closest;
    });
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Le curseur reste uniquement sur une année disponible.
    // Aucun chargement n'est déclenché pendant le drag.
    const year = Number(event.target.value);

    setSliderYear(getClosestEnabledYear(year));
  };

  const handleCommit = () => {
    if (disabled) return;

    if (sliderYear !== selectedYear) {
      onSelect(sliderYear);
    }
  };

  // Timeline uniquement pour les questions globales
  if (!isGlobal) return null;

  return (
    <div
      className={`
        relative
        transition-opacity
        duration-200
        ${
          visible
            ? disabled
              ? "opacity-50"
              : "opacity-100"
            : "opacity-0"
        }
      `}
      style={{
        visibility: visible ? "visible" : "hidden",
        pointerEvents:
          visible && !disabled
            ? "auto"
            : "none",
      }}
      aria-hidden={!visible}
    >
      <div
        className="relative rounded-2xl px-4 py-4"
        style={{
          backgroundColor: background,
          border: `1px solid ${borderColor}`,
        }}
      >
        {sortedYears.length === 0 ? (
          <div
            className="rounded-xl px-3 py-3 text-sm"
            style={{
              border: `1px solid ${borderColor}`,
              color: hoverText07,
            }}
          >
            {t("home.noAvailableYears")}
          </div>
        ) : (
          <div
            className={
              shouldScroll
                ? "overflow-x-auto pb-1"
                : ""
            }
          >
            <div
              className="relative px-2"
              style={{
                minWidth: shouldScroll
                  ? `${sortedYears.length * 52}px`
                  : "100%",
              }}
            >
              {/* Année actuellement sélectionnée */}
              <div
                className="mb-6 text-center text-sm font-semibold"
                style={{
                  color: primary,
                }}
              >
                {sliderYear}
              </div>

              <div className="relative h-[68px]">
                {/* Ligne principale */}
                <div
                  className="
                    absolute
                    left-[7px]
                    right-[7px]
                    top-[22px]
                    h-[3px]
                    rounded-full
                  "
                  style={{
                    backgroundColor: hoverText30,
                  }}
                />

                {/* Repères des années */}
                <div className="absolute left-[7px] right-[7px] top-0 bottom-0">
                  {sortedYears.map((year, index) => {
                    const enabled = enabledSet.has(year);
                    const selected = sliderYear === year;
                    const labelAbove = index % 2 === 0;

                    const isFirst = index === 0;
                    const isLast =
                      index === sortedYears.length - 1;

                    return (
                      <div
                        key={year}
                        className="
                          absolute
                          top-[18px]
                          pointer-events-none
                        "
                        style={{
                          left: `${getLeftPercent(year)}%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {/* Petit repère */}
                        <div
                          className="
                            rounded-full
                            transition-colors
                            duration-100
                          "
                          style={{
                            width: selected ? 9 : 7,
                            height: selected ? 9 : 7,

                            backgroundColor: enabled
                              ? primary
                              : hoverText30,

                            border: `1px solid ${background}`,

                            opacity: enabled
                              ? 1
                              : 0.5,
                          }}
                        />

                        {/* Année */}
                        <span
                          className="
                            absolute
                            whitespace-nowrap
                            text-[10px]
                          "
                          style={{
                            top: labelAbove
                              ? "-21px"
                              : "17px",

                            left: isFirst
                              ? "-1px"
                              : isLast
                                ? "auto"
                                : "50%",

                            right: isLast
                              ? "-1px"
                              : "auto",

                            transform:
                              isFirst || isLast
                                ? "none"
                                : "translateX(-50%)",

                            color: enabled
                              ? textColor
                              : hoverText07,

                            fontWeight: selected
                              ? 600
                              : 400,

                            opacity: enabled
                              ? 1
                              : 0.55,
                          }}
                        >
                          {year}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={minYear}
                  max={maxYear}
                  step={1}
                  value={sliderYear}
                  disabled={disabled}
                  onChange={handleChange}
                  onPointerUp={handleCommit}
                  onKeyUp={handleCommit}
                  aria-label={t("home.selectYear")}
                  aria-valuetext={String(sliderYear)}
                  className="
                    timeline-range
                    absolute
                    left-0
                    top-[12px]
                    z-20
                    h-[24px]
                    w-full
                    cursor-pointer
                    appearance-none
                    bg-transparent
                    disabled:cursor-not-allowed
                  "
                  style={{
                    ["--timeline-primary" as string]:
                      primary,

                    ["--timeline-background" as string]:
                      background,
                  }}
                />
              </div>

              {/* Légende d’état */}
              <div
                className="
                  mt-1
                  flex
                  flex-wrap
                  items-center
                  gap-4
                  text-xs
                "
                style={{
                  color: hoverText07,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: primary,
                    }}
                  />

                  <span>
                    {t("home.timelineAvailable")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: hoverText30,
                    }}
                  />

                  <span>
                    {t("home.timelineUnavailable")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            .timeline-range::-webkit-slider-runnable-track {
              height: 3px;
              background: transparent;
            }

            .timeline-range::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;

              width: 14px;
              height: 14px;
              margin-top: -5.5px;

              border-radius: 9999px;

              background: var(--timeline-primary);

              border:
                2px solid
                var(--timeline-background);

              cursor: grab;
            }

            .timeline-range:active::-webkit-slider-thumb {
              cursor: grabbing;
            }

            .timeline-range::-moz-range-track {
              height: 3px;
              background: transparent;
            }

            .timeline-range::-moz-range-thumb {
              width: 12px;
              height: 12px;

              border-radius: 9999px;

              background: var(--timeline-primary);

              border:
                2px solid
                var(--timeline-background);

              cursor: grab;
            }

            .timeline-range:active::-moz-range-thumb {
              cursor: grabbing;
            }
          `}
        </style>
      </div>
    </div>
  );
}

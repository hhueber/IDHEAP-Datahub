import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import YearSelector from "@/features/home/components/YearSelector";
import type { HomeBootstrap } from "@/features/home/services/homeApi";
import { useSurveyQuestions } from "@/features/questions/hooks/useSurveyQuestions";
import MapExportButtons from "@/features/home/components/MapExportButtons";
import { useTheme } from "@/theme/useTheme";
import { DropdownList } from "@/utils/DropdownList";
import { useQuestionYears } from "@/features/questions/hooks/useQuestionYears";
import type { ChoroplethGranularity } from "@/features/geo/geoApi";

const GLOBAL_UID = -1;

type Props = {
  data: HomeBootstrap | null;
  loading: boolean;
  error: Error | null;
  errorKey?: string | null;
  selectedSurveyUid: number;
  onSurveyChange: (uid: number) => void;
  selectedQuestionUid: number | null;
  onQuestionSelect: (uid: number) => void;
  globalYear: number | null;
  onGlobalYearChange: (y: number | null) => void;
  granularity: ChoroplethGranularity;
  onGranularityChange: (g: ChoroplethGranularity) => void;
};

/** Panneau de contrôle pour choix des question */
export default function HomeInfoPanel({
  data,
  loading,
  error,
  errorKey,
  selectedSurveyUid,
  onSurveyChange,
  selectedQuestionUid,
  onQuestionSelect,
  globalYear,
  onGlobalYearChange,
  granularity,
  onGranularityChange,
}: Props) {
  const { t } = useTranslation();

  const { textColor, background, borderColor, hoverPrimary04, hoverText07 } = useTheme();

  const surveysWithGlobal = useMemo(
    () => [{ uid: GLOBAL_UID, year: Number.NaN }, ...(data?.surveys ?? [])],
    [data?.surveys]
  );

  const showGlobals = selectedSurveyUid === GLOBAL_UID;

  const { data: bySurvey, loading: loadingS, errorKey: errorKeyS } = useSurveyQuestions(
    showGlobals ? null : selectedSurveyUid
  );

  // années dispo pour la question globale sélectionnée
  const yearsQuestionUid = showGlobals ? selectedQuestionUid : null;
  const yearsScope: "global" | "per_survey" = showGlobals ? "global" : "per_survey";

  const { years, loading: loadingYears } = useQuestionYears(yearsQuestionUid, yearsScope);
  
  const yearItems = useMemo(() => {
    const list = [...years].sort((a, b) => a - b);
    return list.map((y) => ({ year: y }));
  }, [years]);

  const selectedYearItem = useMemo(() => {
    if (typeof globalYear !== "number") return null;
    return { year: globalYear };
  }, [globalYear]);

  // auto-set globalYear sur la dernière année dispo si vide
  const latestYear = years.length ? years[years.length - 1] : null;
  if (showGlobals && selectedQuestionUid != null && globalYear == null && latestYear != null) {
  }

  const granularityItems = [
    { key: "commune" as const, label: "Communal" },
    { key: "district" as const, label: "District" },
    { key: "canton" as const, label: "Cantonal" },
    { key: "federal" as const, label: "Federal" },
  ];

  return (
    <div className="space-y-4">
      {/* État global */}
      {(loading || error) && (
        <section className="rounded-2xl shadow-sm  p-3" 
          style={{
            backgroundColor: background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: borderColor,
          }}>
          {loading && <p className="text-sm" style={{ color: hoverPrimary04 }}>{t("common.loading")}</p>}
          {error && (
            <p className="text-red-600">
              {t(errorKey ?? "home.bootstrapError")}
            </p>
          )}
        </section>
      )}

      {/* Carte sélection année */}
      <section className="rounded-2xl shadow-sm p-4"
          style={{
            backgroundColor: background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: borderColor,
          }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: textColor }}>
          {t("home.sectionDates")}
        </h2>
        <div className="max-w-sm">
          <YearSelector
            surveys={surveysWithGlobal}
            valueUid={selectedSurveyUid}
            onChange={(s) => onSurveyChange(s.uid)}
            placeholder={t("home.chooseYear")}
            globalLabel={t("home.globalOption")}
          />
        </div>
      </section>

      {/* Carte questions */}
      <section className="rounded-2xl shadow-sm p-4"
          style={{
            backgroundColor: background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: borderColor,
          }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: textColor }}>
          {t("home.sectionQuestions")}
        </h2>

        <div className="max-h-72 overflow-y-auto grid grid-cols-1 gap-2">
          {showGlobals ? (
            !loading && !error && (
              data?.globals?.items?.length ? (
                data.globals.items.map((q) => (
                  <QuestionCard
                    key={q.uid}
                    primary={q.text || q.label}
                    selected={selectedQuestionUid === q.uid}
                    onClick={() => onQuestionSelect(q.uid)}
                  />
                ))
              ) : (
                <EmptyHint text={t("home.noGlobalQuestions")} />
              )
            )
          ) : (
            <>
              {loadingS && <p className="text-sm" style={{ color: hoverPrimary04 }}>{t("common.loading")}</p>}
              {errorKeyS && (
                <p className="text-red-600">
                  {t(errorKeyS)}
                </p>
              )}
              {!loadingS && !errorKeyS && (
                bySurvey?.length ? (
                  bySurvey.map((q) => (
                    <QuestionCard
                      key={q.uid}
                      primary={q.text || q.label}
                      selected={selectedQuestionUid === q.uid}
                      onClick={() => onQuestionSelect(q.uid)}
                    />
                  ))
                ) : (
                  <EmptyHint text={t("home.noQuestionsForSelection")} />
                )
              )}
            </>
          )}
        </div>
      </section>

      {/* Carte granularité */}
      <section
        className="rounded-2xl shadow-sm p-4"
        style={{ backgroundColor: background, borderWidth: 1, borderStyle: "solid", borderColor }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: textColor }}>
          {t("home.granularity")}
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {granularityItems.map((it) => {
            const active = granularity === it.key;

            return (
              <button
                key={it.key}
                type="button"
                onClick={() => onGranularityChange(it.key)}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = hoverPrimary04;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = background;
                }}
                className="
                  rounded-xl px-3 py-2 border text-sm font-medium
                  transition-colors duration-150
                  active:translate-y-[1px]
                "
                style={{
                  borderColor,
                  backgroundColor: active ? hoverPrimary04 : background,
                  color: textColor,
                }}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Controls choropleth a refaire mieux */}
      <section
        className="rounded-2xl shadow-sm p-4 relative overflow-visible"
        style={{ backgroundColor: background, borderWidth: 1, borderStyle: "solid", borderColor }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: textColor }}>
          {t("home.choropleth")}
        </h2>

        {/* Année global uniquement */}
        {showGlobals && selectedQuestionUid != null && (
          <div className="mb-3 relative overflow-visible">
            <div className="text-xs mb-1 opacity-80">{t("home.availableYears")}</div>

            {loadingYears ? (
              <div className="text-xs opacity-70">
                {t("common.loading")}
              </div>
            ) : years.length === 0 ? (
              <div
                className="rounded-xl text-sm px-3 py-2"
                style={{
                  backgroundColor: background,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: borderColor,
                  color: hoverText07,
                }}
              >
                {t("home.noAvailableYears")}
              </div>
            ) : (
              <DropdownList<{ year: number }>
                items={yearItems}
                selected={selectedYearItem}
                onSelect={(it) => onGlobalYearChange(it.year)}
                labelFor={(it) => String(it.year)}
                placeholder={t("home.selectYear")}
                keyFor={(it) => String(it.year)}
                isSelected={(it, sel) => it.year === sel?.year}
              />
            )}
          </div>
        )}
      </section>

      <MapExportButtons />
    </div>
  );
}

function QuestionCard({ primary, selected, onClick, }: { primary: string; selected: boolean; onClick: () => void; }) {
  const { textColor, background, borderColor, hoverPrimary06 } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        text-left w-full
        rounded-xl px-3 py-2
        shadow-sm
        active:translate-y-[1px]
        transition
        border
        hover:shadow-md
        bg-[var(--qc-bg)]
        hover:bg-[var(--qc-hover-bg)]
      `}
      style={
        {
          // on passe les couleurs au CSS via des variables
          "--qc-bg": selected ? hoverPrimary06 : background,
          "--qc-hover-bg": hoverPrimary06,
          borderColor: selected ? hoverPrimary06 : borderColor,
          color: textColor,
          boxShadow: selected ? "0 0 0 2px rgba(0,0,0,0.06)" : undefined,
        } as React.CSSProperties
      }
    >
      {/* Texte localisé (ou label si fallback déjà fait côté API) */}
      <div className="text-sm font-medium">
        {primary}
      </div>
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  const { background, borderColor, hoverText07 } = useTheme();
  return (
    <div className="rounded-xl text-sm px-3 py-2"
      style={{
        backgroundColor: background,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: borderColor,
        color: hoverText07,
      }}>
      {text}
    </div>
  );
}

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import YearSelector from "@/features/home/components/YearSelector";
import type { HomeBootstrap } from "@/features/home/services/homeApi";
import { useSurveyQuestions } from "@/features/questions/hooks/useSurveyQuestions";
import MapExportButtons from "@/features/home/components/MapExportButtons";
import { loadThemeConfig } from "@/theme/themeStorage";
import { hexToRgba } from "@/utils/color";
import { useThemeMode } from "@/theme/ThemeContext";

const GLOBAL_UID = -1;

type Props = {
  data: HomeBootstrap | null;
  loading: boolean;
  error: Error | null;
  errorKey?: string | null;
};
/** Panneau de contrôle pour choix des question */
export default function HomeInfoPanel({ data, loading, error, errorKey }: Props) {
  const { t } = useTranslation();
  const [selectedUid, setSelectedUid] = useState<number>(GLOBAL_UID);

  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();

  const cardBg = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  const cardBorder = (mode === "dark" ? cfg.colour_dark_secondary : cfg.colour_light_secondary) ?? cfg.colour_light_secondary;
  const textColor = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;

  const subtitleColor = hexToRgba(textColor, 0.7); // text sous le titre
  const mutedColor = hexToRgba(textColor, 0.6);

  const surveysWithGlobal = useMemo(
    () => [{ uid: GLOBAL_UID, year: Number.NaN }, ...(data?.surveys ?? [])],
    [data?.surveys]
  );

  const showGlobals = selectedUid === GLOBAL_UID;
  const {
    data: bySurvey,
    loading: loadingS,
    errorKey: errorKeyS,
  } = useSurveyQuestions(showGlobals ? null : selectedUid);

  return (
    <div className="space-y-4">
      {/* Carte entête */}
      <section className="rounded-2xl backdrop-blur shadow-sm  p-4"
        style={{
          backgroundColor: cardBg,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: cardBorder,
        }}
      >
        <h1 className="text-xl font-bold" style={{ color: textColor }}>
          {t("home.heroTitle")}
        </h1>
        <p className="mt-2  text-sm leading-relaxed" style={{ color: subtitleColor }}>
          {t("home.heroSubtitle")}
        </p>
      </section>

      {/* État global */}
      {(loading || error) && (
        <section className="rounded-2xl shadow-sm  p-3" 
          style={{
            backgroundColor: cardBg,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: cardBorder,
          }}>
          {loading && <p className="text-sm" style={{ color: mutedColor }}>{t("common.loading")}</p>}
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
            backgroundColor: cardBg,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: cardBorder,
          }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: textColor }}>
          {t("home.sectionDates")}
        </h2>
        <div className="max-w-sm">
          <YearSelector
            surveys={surveysWithGlobal}
            valueUid={selectedUid}
            onChange={(s) => setSelectedUid(s.uid)}
            placeholder={t("home.chooseYear")}
            globalLabel={t("home.globalOption")}
          />
        </div>
      </section>

      {/* Carte questions */}
      <section className="rounded-2xl shadow-sm p-4"
          style={{
            backgroundColor: cardBg,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: cardBorder,
          }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: textColor }}>
          {t("home.sectionQuestions")}
        </h2>

        <div className="max-h-72 overflow-y-auto grid grid-cols-1 gap-2">
          {showGlobals ? (
            !loading && !error && (
              data?.globals?.items?.length ? (
                data.globals.items.map((q) => (
                  <QuestionCard key={q.uid} primary={q.text || q.label} />
                ))
              ) : (
                <EmptyHint text={t("home.noGlobalQuestions")} />
              )
            )
          ) : (
            <>
              {loadingS && <p className="text-sm" style={{ color: mutedColor }}>{t("common.loading")}</p>}
              {errorKeyS && (
                <p className="text-red-600">
                  {t(errorKeyS)}
                </p>
              )}
              {!loadingS && !errorKeyS && (
                bySurvey?.length ? (
                  bySurvey.map((q) => (
                    <QuestionCard key={q.uid} primary={q.text || q.label} />
                  ))
                ) : (
                  <EmptyHint text={t("home.noQuestionsForSelection")} />
                )
              )}
            </>
          )}
        </div>
      </section>
      {/* Carte export */}
      <MapExportButtons />
    </div>
  );
}

function QuestionCard({ primary, secondary }: { primary: string; secondary?: string }) {
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();

  const primaryColor = (mode === "dark" ? cfg.colour_dark_primary : cfg.colour_light_primary) ?? cfg.colour_light_primary;
  const cardBg = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  const borderColor = (mode === "dark" ? cfg.colour_dark_secondary : cfg.colour_light_secondary) ?? cfg.colour_light_secondary;
  const textColor = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;

  const hoverBg = hexToRgba(primaryColor, 0.06);
  return (
    <button
      type="button"
      className={`
        text-left w-full
        rounded-xl px-3 py-2
        shadow-sm
        active:translate-y-[1px]
        transition
        border
        bg-[var(--question-card-bg)]
        hover:bg-[var(--question-card-hover-bg)]
        hover:shadow-md
      `}
      style={
        {
          // on passe les couleurs au CSS via des variables
          "--question-card-bg": cardBg,
          "--question-card-hover-bg": hoverBg,
          borderColor: borderColor,
          color: textColor,
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
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const cardBg = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  const borderColor = (mode === "dark" ? cfg.colour_dark_secondary : cfg.colour_light_secondary) ?? cfg.colour_light_secondary;
  const textColors = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;
  const textColor = hexToRgba(textColors, 0.7);
  return (
    <div className="rounded-xl text-sm px-3 py-2"
      style={{
        backgroundColor: cardBg,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: borderColor,
        color: textColor,
      }}>
      {text}
    </div>
  );
}

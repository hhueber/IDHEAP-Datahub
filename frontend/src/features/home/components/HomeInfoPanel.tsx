import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import YearSelector from "@/features/home/components/YearSelector";
import type { HomeBootstrap } from "@/features/home/services/homeApi";
import { useSurveyQuestions } from "@/features/questions/hooks/useSurveyQuestions";

const GLOBAL_UID = -1;

type Props = {
  data: HomeBootstrap | null;
  loading: boolean;
  error: Error | null;
};

export default function HomeInfoPanel({ data, loading, error }: Props) {
  const { t } = useTranslation();
  const [selectedUid, setSelectedUid] = useState<number>(GLOBAL_UID);

  const surveysWithGlobal = useMemo(
    () => [{ uid: GLOBAL_UID, year: Number.NaN }, ...(data?.surveys ?? [])],
    [data?.surveys]
  );

  const showGlobals = selectedUid === GLOBAL_UID;
  const {
    data: bySurvey,
    loading: loadingS,
    error: errorS,
  } = useSurveyQuestions(showGlobals ? null : selectedUid);

  return (
    <div className="space-y-4">
      {/* Carte entête */}
      <section className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-black/5 shadow-sm shadow-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-900">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-2 text-gray-600 text-sm leading-relaxed">
          {t("home.heroSubtitle")}
        </p>
      </section>

      {/* État global */}
      {(loading || error) && (
        <section className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm shadow-gray-200 p-3">
          {loading && <p className="text-gray-500">{t("common.loading")}</p>}
          {error && (
            <p className="text-red-600">
              {t("common.error")}: {error.message}
            </p>
          )}
        </section>
      )}

      {/* Carte sélection année */}
      <section className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm shadow-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
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
      <section className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm shadow-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
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
              {loadingS && <p className="text-gray-500">{t("common.loading")}</p>}
              {errorS && (
                <p className="text-red-600">
                  {t("common.error")}: {errorS.message}
                </p>
              )}
              {!loadingS && !errorS && (
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
    </div>
  );
}

function QuestionCard({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <button
      type="button"
      className="
        text-left w-full
        rounded-xl ring-1 ring-indigo-100 bg-white
        px-3 py-2
        shadow-sm shadow-indigo-50
        hover:bg-indigo-50/60 hover:ring-indigo-200
        active:translate-y-[1px]
        transition
      "
    >
      {/* Texte localisé (ou label si fallback déjà fait côté API) */}
      <div className="text-sm text-gray-800 font-medium">
        {primary}
      </div>
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl ring-1 ring-gray-200 bg-gray-50 text-gray-600 text-sm px-3 py-2">
      {text}
    </div>
  );
}
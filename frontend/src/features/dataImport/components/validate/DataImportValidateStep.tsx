import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type {
  DataImportAnalyzeResponse,
  DataImportJobSummary,
} from "@/features/dataImport/dataImportTypes";

type DataImportValidateStepProps = {
  analysis: DataImportAnalyzeResponse["data"];
  currentJob: DataImportJobSummary | null;
  loading: boolean;
  submitted: boolean;
  onSubmit: () => Promise<void>;
};

export function DataImportValidateStep({
  analysis,
  currentJob,
  loading,
  submitted,
  onSubmit,
}: DataImportValidateStepProps) {
  const { t } = useTranslation();
  const {
    textColor,
    background,
    borderColor,
    hoverPrimary04,
    primary,
  } = useTheme();

  const totalIssues = analysis.total_issues;
  const hasIssues = totalIssues > 0;

  const filesCount =
    analysis.files_count ??
    analysis.resources_count ??
    currentJob?.files_count ??
    currentJob?.resources_count ??
    1;

  return (
    <section
      className="overflow-hidden rounded-3xl border"
      style={{
        backgroundColor: background,
        borderColor,
        color: textColor,
      }}
    >
      <div
        className="border-b p-4 sm:p-5"
        style={{ borderColor }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div
              className="mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor,
                backgroundColor: hoverPrimary04,
                color: primary,
              }}
            >
              {t("dataImport.validate.badge")}
            </div>

            <h2 className="text-lg font-semibold">
              {t("dataImport.validate.title")}
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 opacity-70">
              {t("dataImport.validate.description")}
            </p>
          </div>

          <div
            className={[
              "w-fit rounded-full px-3 py-1.5 text-xs font-semibold",
              hasIssues
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700",
            ].join(" ")}
          >
            {hasIssues
              ? t("dataImport.validate.status.withIssues")
              : t("dataImport.validate.status.ready")}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">
              {t("dataImport.validate.summary.title")}
            </h3>

            <p className="mt-1 text-sm opacity-65">
              {t("dataImport.validate.summary.description")}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <ValidateMetric
              label={t("dataImport.validate.metrics.files")}
              value={filesCount}
            />

            <ValidateMetric
              label={t("dataImport.validate.metrics.rows")}
              value={analysis.rows}
            />

            <ValidateMetric
              label={t("dataImport.validate.metrics.columns")}
              value={analysis.columns}
            />

            <ValidateMetric
              label={t("dataImport.validate.metrics.cells")}
              value={analysis.cells}
            />

            <ValidateMetric
              label={t("dataImport.validate.metrics.issues")}
              value={totalIssues}
              warning={hasIssues}
            />
          </div>

          <div
            className="rounded-2xl border"
            style={{ borderColor }}
          >
            <ValidationCheckRow
              label={t(
                "dataImport.validate.checks.analysis"
              )}
              description={t(
                "dataImport.validate.checks.analysisDescription"
              )}
              valid
            />

            <ValidationCheckRow
              label={t(
                "dataImport.validate.checks.data"
              )}
              description={t(
                "dataImport.validate.checks.dataDescription"
              )}
              valid={analysis.rows > 0 && analysis.columns > 0}
            />

            <ValidationCheckRow
              label={t(
                "dataImport.validate.checks.issues"
              )}
              description={
                hasIssues
                  ? t(
                      "dataImport.validate.checks.issuesRemaining",
                      {
                        count: totalIssues,
                      }
                    )
                  : t(
                      "dataImport.validate.checks.noIssues"
                    )
              }
              valid={!hasIssues}
              warning={hasIssues}
            />

            <ValidationCheckRow
              label={t(
                "dataImport.validate.checks.database"
              )}
              description={t(
                "dataImport.validate.checks.databaseDescription"
              )}
              valid={false}
              pending
              last
            />
          </div>
        </div>

        <aside
          className="flex flex-col justify-between rounded-2xl border p-4"
          style={{
            borderColor,
            backgroundColor: hoverPrimary04,
          }}
        >
          <div>
            <h3 className="font-semibold">
              {t("dataImport.validate.action.title")}
            </h3>

            <p className="mt-2 text-sm leading-6 opacity-70">
              {t("dataImport.validate.action.description")}
            </p>

            {hasIssues && (
              <div className="mt-4 rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
                {t("dataImport.validate.action.issuesWarning", {
                  count: totalIssues,
                })}
              </div>
            )}

            {submitted && (
              <div className="mt-4 rounded-xl border border-green-500 bg-green-50 p-3 text-sm text-green-700">
                {t(
                  "dataImport.validate.action.endpointReached"
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              type="button"
              disabled={loading || submitted}
              onClick={() => void onSubmit()}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: primary,
                color: "#ffffff",
              }}
            >
              {loading
                ? t(
                    "dataImport.validate.action.submitting"
                  )
                : submitted
                  ? t(
                      "dataImport.validate.action.submitted"
                    )
                  : t(
                      "dataImport.validate.action.submit"
                    )}
            </button>

            <p className="mt-3 text-center text-xs leading-5 opacity-55">
              {t("dataImport.validate.action.helper")}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ValidateMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  const {
    background,
    borderColor,
    hoverPrimary04,
  } = useTheme();

  return (
    <div
      className="rounded-2xl border px-3 py-3"
      style={{
        borderColor: warning
          ? "#f59e0b"
          : borderColor,
        backgroundColor: warning
          ? "#fef3c7"
          : hoverPrimary04 || background,
      }}
    >
      <div
        className={[
          "text-[11px] uppercase tracking-wide",
          warning
            ? "text-amber-700"
            : "opacity-60",
        ].join(" ")}
      >
        {label}
      </div>

      <div
        className={[
          "mt-1 text-lg font-bold",
          warning
            ? "text-amber-700"
            : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function ValidationCheckRow({
  label,
  description,
  valid,
  warning = false,
  pending = false,
  last = false,
}: {
  label: string;
  description: string;
  valid: boolean;
  warning?: boolean;
  pending?: boolean;
  last?: boolean;
}) {
  const {
    borderColor,
    hoverPrimary04,
  } = useTheme();

  const indicator = pending
    ? "\u2026"  // Unicode pour ce symbole …
    : valid
      ? "\u2713"    // Unicode pour ce symbole ✓
      : warning
        ? "\u0021"  // Unicode pour ce symbole !
        : "\u00d7"; // Unicode pour ce symbole ×

  return (
    <div
      className={[
        "flex items-start gap-3 p-4",
        last ? "" : "border-b",
      ].join(" ")}
      style={{
        borderColor,
        backgroundColor:
          warning || pending
            ? hoverPrimary04
            : undefined,
      }}
    >
      <div
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          pending
            ? "bg-slate-100 text-slate-600"
            : valid
              ? "bg-green-100 text-green-700"
              : warning
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700",
        ].join(" ")}
      >
        {indicator}
      </div>

      <div>
        <div className="text-sm font-semibold">
          {label}
        </div>

        <p className="mt-1 text-xs leading-5 opacity-65">
          {description}
        </p>
      </div>
    </div>
  );
}
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type {
  ImportColumnSummary,
  ImportMostCommonValue,
} from "@/features/dataImport/dataImportTypes";

type DataImportColumnProfilePanelProps = {
  column: ImportColumnSummary | null;
  onClose: () => void;
};

type SafeColumnProfile = {
  emptyCount: number;
  nonEmptyCount: number;
  uniqueCount: number;
  sampleValues: string[];
  mostCommonValues: ImportMostCommonValue[];
};

export function DataImportColumnProfilePanel({
  column,
  onClose,
}: DataImportColumnProfilePanelProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  if (!column) {
    return null;
  }

  const profile = getSafeProfile(column);
  const totalValues = profile.emptyCount + profile.nonEmptyCount;
  const filledRatio =
    totalValues > 0 ? Math.round((profile.nonEmptyCount / totalValues) * 100) : 0;

  return (
    <div
      className="border-t rounded-2xl p-4 sm:p-5"
      style={{ borderColor, background: hoverPrimary04, color: textColor }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: primary, color: primary, background: background }}
            >
              {t("dataImport.columnProfile.badge")}
            </span>

            <span className="text-xs opacity-60">
              {"\u0023"} {/* Signe Unicode pour ce symbole # */}
              {column.index} · {t(`dataImport.sections.${column.section}`)}
            </span>
          </div>

          <h3
            className="mt-2 truncate text-lg font-semibold"
            title={column.original_name || column.normalized_name}
          >
            {column.original_name || column.normalized_name}
          </h3>

          <p className="mt-1 max-w-3xl text-sm leading-6 opacity-70">
            {t("dataImport.columnProfile.description")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor, background, color: primary }}
          >
            {t(`dataImport.types.${column.detected_type}`)}
          </span>

          {column.issue_count > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {column.issue_count} {t("dataImport.summary.issues")}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ borderColor, background }}
          >
            {t("common.close")}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <ProfileMetric
          label={t("dataImport.columnProfile.metrics.completeness")}
          value={`${filledRatio}%`}
        />
        <ProfileMetric
          label={t("dataImport.columnProfile.metrics.empty")}
          value={profile.emptyCount}
          warning={profile.emptyCount > 0}
        />
        <ProfileMetric
          label={t("dataImport.columnProfile.metrics.unique")}
          value={profile.uniqueCount}
        />
        <ProfileMetric
          label={t("dataImport.columnProfile.metrics.nonEmpty")}
          value={profile.nonEmptyCount}
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium opacity-70">
            {t("dataImport.columnProfile.metrics.completeness")}
          </span>

          <span className="opacity-60">
            {profile.nonEmptyCount}/{totalValues}
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: background }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${filledRatio}%`,
              backgroundColor: primary,
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ValuePreview
          title={t("dataImport.columnProfile.sampleValues")}
          emptyLabel={t("dataImport.columnProfile.noSampleValues")}
          values={profile.sampleValues}
        />

        <MostCommonPreview
          title={t("dataImport.columnProfile.mostCommonValues")}
          emptyLabel={t("dataImport.columnProfile.noMostCommonValues")}
          values={profile.mostCommonValues}
        />
      </div>
    </div>
  );
}

function getSafeProfile(column: ImportColumnSummary): SafeColumnProfile {
  return {
    emptyCount: safeNumber(column.empty_count),
    nonEmptyCount: safeNumber(column.non_empty_count),
    uniqueCount: safeNumber(column.unique_count),
    sampleValues: Array.isArray(column.sample_values)
      ? column.sample_values.filter((value) => typeof value === "string")
      : [],
    mostCommonValues: Array.isArray(column.most_common_values)
      ? column.most_common_values
          .filter((item) => item && typeof item.count === "number")
          .map((item) => ({
            value: item.value ?? "",
            count: item.count,
          }))
      : [],
  };
}

function safeNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function ProfileMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string | number;
  warning?: boolean;
}) {
  const { background, borderColor, hoverPrimary04 } = useTheme();

  return (
    <div
      className="rounded-2xl border px-3 py-2"
      style={{
        borderColor: warning ? "#f59e0b" : borderColor,
        backgroundColor: warning ? "#fef3c7" : background,
      }}
    >
      <div
        className={[
          "text-[11px] uppercase tracking-wide",
          warning ? "text-amber-700" : "opacity-60",
        ].join(" ")}
      >
        {label}
      </div>

      <div
        className={[
          "mt-0.5 text-lg font-bold",
          warning ? "text-amber-700" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function ValuePreview({
  title,
  emptyLabel,
  values,
}: {
  title: string;
  emptyLabel: string;
  values: string[];
}) {
  const { borderColor, background } = useTheme();

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">
        {title}
      </h4>

      {values.length === 0 ? (
        <div className="text-xs opacity-50">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="max-w-full truncate rounded-full border px-2 py-1 text-xs"
              style={{ borderColor, backgroundColor: background }}
              title={value}
            >
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MostCommonPreview({
  title,
  emptyLabel,
  values,
}: {
  title: string;
  emptyLabel: string;
  values: ImportMostCommonValue[];
}) {
  const { borderColor, background } = useTheme();

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">
        {title}
      </h4>

      {values.length === 0 ? (
        <div className="text-xs opacity-50">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-1.5">
          {values.map((item, index) => (
            <div
              key={`${item.value ?? ""}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border px-2.5 py-1.5 text-xs"
              style={{ borderColor, backgroundColor: background }}
            >
              <span
                className="min-w-0 truncate"
                title={item.value ?? ""}
              >
                {item.value || "—"}
              </span>

              <span className="shrink-0 font-semibold opacity-70">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

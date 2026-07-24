import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type {
  DetectedType,
  ImportColumnSummary,
  ImportMostCommonValue,
  ImportSection,
} from "@/features/dataImport/dataImportTypes";

type DataImportColumnProfilesProps = {
  columns: ImportColumnSummary[];
  selectedSection: ImportSection;
  loading: boolean;
};

type ColumnProfileFilter = {
  search: string;
  detectedType: DetectedType | "all";
  issuesOnly: boolean;
};

type SafeColumnProfile = {
  emptyCount: number;
  nonEmptyCount: number;
  uniqueCount: number;
  sampleValues: string[];
  mostCommonValues: ImportMostCommonValue[];
};

const TYPE_OPTIONS: (DetectedType | "all")[] = [
  "all",
  "integer",
  "float",
  "boolean",
  "date",
  "datetime",
  "text",
  "empty",
  "mixed",
];

export function DataImportColumnProfiles({
  columns,
  selectedSection,
  loading,
}: DataImportColumnProfilesProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  const [expanded, setExpanded] = React.useState(false);
  const [filters, setFilters] = React.useState<ColumnProfileFilter>({
    search: "",
    detectedType: "all",
    issuesOnly: false,
  });

  React.useEffect(() => {
    setFilters({
      search: "",
      detectedType: "all",
      issuesOnly: false,
    });
    setExpanded(false);
  }, [selectedSection]);

  const sectionColumns = React.useMemo(() => {
    return columns.filter((column) => column.section === selectedSection);
  }, [columns, selectedSection]);

  const filteredColumns = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return sectionColumns.filter((column) => {
      const name = `${column.original_name} ${column.normalized_name}`.toLowerCase();

      if (search && !name.includes(search)) {
        return false;
      }

      if (
        filters.detectedType !== "all" &&
        column.detected_type !== filters.detectedType
      ) {
        return false;
      }

      if (filters.issuesOnly && column.issue_count <= 0) {
        return false;
      }

      return true;
    });
  }, [filters, sectionColumns]);

  const profileSummary = React.useMemo(() => {
    return sectionColumns.reduce(
      (summary, column) => {
        const profile = getSafeProfile(column);

        return {
          emptyValues: summary.emptyValues + profile.emptyCount,
          nonEmptyValues: summary.nonEmptyValues + profile.nonEmptyCount,
          uniqueValues: summary.uniqueValues + profile.uniqueCount,
          columnsWithIssues:
            summary.columnsWithIssues + (column.issue_count > 0 ? 1 : 0),
        };
      },
      {
        emptyValues: 0,
        nonEmptyValues: 0,
        uniqueValues: 0,
        columnsWithIssues: 0,
      }
    );
  }, [sectionColumns]);

  const visibleColumns = expanded ? filteredColumns : filteredColumns.slice(0, 4);

  return (
    <section
      className="overflow-hidden rounded-3xl border"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div
        className="border-b p-4 sm:p-5"
        style={{ borderColor }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-full border px-3 py-1 text-xs font-medium"
                style={{ borderColor, backgroundColor: hoverPrimary04, color: primary }}
              >
                {t("dataImport.columnProfiles.badge")}
              </div>

              <span className="text-xs opacity-60">
                {t(`dataImport.sections.${selectedSection}`)}
              </span>
            </div>

            <h2 className="mt-2 text-lg font-semibold">
              {t("dataImport.columnProfiles.title")}
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 opacity-70">
              {t("dataImport.columnProfiles.description")}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[520px]">
            <ProfileSummaryPill
              label={t("dataImport.columnProfiles.stats.columns")}
              value={sectionColumns.length}
            />
            <ProfileSummaryPill
              label={t("dataImport.columnProfiles.stats.withIssues")}
              value={profileSummary.columnsWithIssues}
              danger={profileSummary.columnsWithIssues > 0}
            />
            <ProfileSummaryPill
              label={t("dataImport.columnProfiles.stats.emptyValues")}
              value={profileSummary.emptyValues}
              warning={profileSummary.emptyValues > 0}
            />
            <ProfileSummaryPill
              label={t("dataImport.columnProfiles.stats.uniqueValues")}
              value={profileSummary.uniqueValues}
            />
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl border p-3"
          style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
          <div className="mb-3 text-xs leading-5 opacity-75">
            {t("dataImport.columnProfiles.helper")}
          </div>

          <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_170px_auto_auto] lg:items-end">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-55">
                {t("common.search")}
              </span>

              <input
                value={filters.search}
                disabled={loading}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                placeholder={t("dataImport.columnProfiles.searchPlaceholder")}
                className="h-10 rounded-xl border px-3 text-sm outline-none disabled:opacity-40"
                style={{ borderColor, backgroundColor: background, color: textColor }}
              />
            </label>

            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-55">
                {t("dataImport.columnProfiles.type")}
              </span>

              <select
                value={filters.detectedType}
                disabled={loading}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    detectedType: event.target.value as DetectedType | "all",
                  }))
                }
                className="h-10 rounded-xl border px-3 text-sm outline-none disabled:opacity-40"
                style={{ borderColor, backgroundColor: background, color: textColor }}
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type === "all"
                      ? t("dataImport.columnProfiles.allTypes")
                      : t(`dataImport.types.${type}`)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  issuesOnly: !current.issuesOnly,
                }))
              }
              className="h-10 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: filters.issuesOnly ? primary : borderColor,
                backgroundColor: filters.issuesOnly ? background : hoverPrimary04,
                color: filters.issuesOnly ? primary : textColor,
              }}
            >
              {filters.issuesOnly
                ? t("dataImport.columnProfiles.showAll")
                : t("dataImport.columnProfiles.showIssuesOnly")}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                setFilters({
                  search: "",
                  detectedType: "all",
                  issuesOnly: false,
                })
              }
              className="h-10 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
              style={{ borderColor, backgroundColor: background }}
            >
              {t("dataImport.columnProfiles.reset")}
            </button>
          </div>
        </div>
      </div>

      {filteredColumns.length === 0 ? (
        <div className="p-8 text-center text-sm opacity-70">
          {t("dataImport.columnProfiles.noResults")}
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">
            {visibleColumns.map((column) => (
              <ColumnProfileRow
                key={column.index}
                column={column}
              />
            ))}
          </div>

          {filteredColumns.length > 4 && (
            <div
              className="border-t px-4 py-3 text-center sm:px-5"
              style={{ borderColor }}
            >
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80"
                style={{ borderColor, backgroundColor: hoverPrimary04 }}
              >
                {expanded
                  ? t("dataImport.columnProfiles.showLess")
                  : t("dataImport.columnProfiles.showMore", {
                      count: filteredColumns.length - 4,
                    })}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ColumnProfileRow({
  column,
}: {
  column: ImportColumnSummary;
}) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  const profile = getSafeProfile(column);
  const totalValues = profile.emptyCount + profile.nonEmptyCount;
  const filledRatio =
    totalValues > 0 ? Math.round((profile.nonEmptyCount / totalValues) * 100) : 0;

  return (
    <article
      className="rounded-2xl border p-4"
      style={{ borderColor, backgroundColor: background, color: textColor }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3
              className="truncate font-semibold"
              title={column.original_name || column.normalized_name}
            >
              {column.original_name || column.normalized_name}
            </h3>

            {column.issue_count > 0 && (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                {column.issue_count}
              </span>
            )}
          </div>

          <div className="mt-1 text-xs opacity-60">
            {"\u0023"} {/* Signe Unicode pour ce symbole # */}
            {column.index} · {t(`dataImport.sections.${column.section}`)}
          </div>
        </div>

        <div
          className="w-fit rounded-full border px-2.5 py-1 text-xs font-medium"
          style={{ borderColor: primary, color: primary, backgroundColor: hoverPrimary04 }}
        >
          {t(`dataImport.types.${column.detected_type}`)}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium opacity-70">
            {t("dataImport.columnProfiles.metrics.completeness")}
          </span>

          <span className="opacity-60">
            {profile.nonEmptyCount}/{totalValues} · {filledRatio}{"\u0025"} {/* Signe Unicode pour ce symbole % */}
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: hoverPrimary04 }}
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

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ProfileMetric
          label={t("dataImport.columnProfiles.metrics.empty")}
          value={profile.emptyCount}
          warning={profile.emptyCount > 0}
        />
        <ProfileMetric
          label={t("dataImport.columnProfiles.metrics.unique")}
          value={profile.uniqueCount}
        />
        <ProfileMetric
          label={t("dataImport.columnProfiles.metrics.common")}
          value={profile.mostCommonValues.length}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ValuePreview
          title={t("dataImport.columnProfiles.sampleValues")}
          emptyLabel={t("dataImport.columnProfiles.noSampleValues")}
          values={profile.sampleValues}
        />

        <MostCommonPreview
          title={t("dataImport.columnProfiles.mostCommonValues")}
          emptyLabel={t("dataImport.columnProfiles.noMostCommonValues")}
          values={profile.mostCommonValues}
        />
      </div>
    </article>
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

function ProfileSummaryPill({
  label,
  value,
  danger = false,
  warning = false,
}: {
  label: string;
  value: React.ReactNode;
  danger?: boolean;
  warning?: boolean;
}) {
  const { background, borderColor, hoverPrimary04 } = useTheme();

  return (
    <div
      className="rounded-2xl border px-3 py-2"
      style={{
        borderColor: danger ? "#ef4444" : warning ? "#f59e0b" : borderColor,
        backgroundColor: danger
          ? "#fee2e2"
          : warning
            ? "#fef3c7"
            : hoverPrimary04 || background,
      }}
    >
      <div
        className={[
          "text-[11px] uppercase tracking-wide",
          danger ? "text-red-700" : warning ? "text-amber-700" : "opacity-60",
        ].join(" ")}
      >
        {label}
      </div>

      <div
        className={[
          "mt-0.5 text-base font-bold",
          danger ? "text-red-700" : warning ? "text-amber-700" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function ProfileMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: React.ReactNode;
  warning?: boolean;
}) {
  const { background, borderColor, hoverPrimary04 } = useTheme();

  return (
    <div
      className="rounded-xl border px-3 py-2"
      style={{
        borderColor: warning ? "#f59e0b" : borderColor,
        backgroundColor: warning ? "#fef3c7" : hoverPrimary04 || background,
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
          "mt-0.5 text-base font-bold",
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
  const { borderColor, hoverPrimary04 } = useTheme();

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
              style={{ borderColor, backgroundColor: hoverPrimary04 }}
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
  const { borderColor, hoverPrimary04 } = useTheme();

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
              style={{ borderColor, backgroundColor: hoverPrimary04 }}
            >
              <span
                className="min-w-0 truncate"
                title={item.value ?? ""}
              >
                {item.value || "\u2014"} {/* Signe Unicode pour ce symbole - */}
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

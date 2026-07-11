import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import { fetchDataImportIssues } from "@/features/dataImport/dataImportApi";
import type {
  DataImportIssuesResponse,
  ImportIssueGroup,
} from "@/features/dataImport/dataImportTypes";
import LoadingDots from "@/utils/LoadingDots";
import Pagination from "@/utils/Pagination";

type DataImportImproveStepProps = {
  importId: string;
  loading: boolean;
  onOpenIssueGroup: (group: ImportIssueGroup) => Promise<void>;
  onConfirmColumnIssue: (group: ImportIssueGroup) => Promise<void>;
  onConfirmColumnIssues: (groups: ImportIssueGroup[]) => Promise<void>;
};

type IssueSeverityFilter = "all" | "error" | "warning";

const GROUPS_PER_PAGE = 20;

export function DataImportImproveStep({
  importId,
  loading,
  onOpenIssueGroup,
  onConfirmColumnIssue,
  onConfirmColumnIssues,
}: DataImportImproveStepProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  const [data, setData] =
    React.useState<DataImportIssuesResponse["data"] | null>(null);
  const [severityFilter, setSeverityFilter] =
    React.useState<IssueSeverityFilter>("all");
  const [search, setSearch] = React.useState("");
  const [localLoading, setLocalLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<Set<string>>(
    () => new Set()
  );

  const loadIssues = React.useCallback(async () => {
    setLocalLoading(true);
    setError(null);

    try {
      const json = await fetchDataImportIssues(importId);

      if (!json.success) {
        throw new Error(json.detail || t("common.error"));
      }

      setData(json.data);

      setSelectedGroupIds((current) => {
        const validIds = new Set(json.data.groups.map((group) => group.id));

        return new Set(
          Array.from(current).filter((groupId) => validIds.has(groupId))
        );
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || t("common.error"));
    } finally {
      setLocalLoading(false);
    }
  }, [importId, t]);

  React.useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  const filteredGroups = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (data?.groups ?? []).filter((group) => {
      if (severityFilter !== "all" && group.severity !== severityFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        group.column_name,
        group.code,
        group.detected_type,
        group.expected_type ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [data?.groups, search, severityFilter]);

  const totalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil(filteredGroups.length / GROUPS_PER_PAGE));
  }, [filteredGroups.length]);

    const currentPage = Math.min(page, totalPages);

  const paginatedGroups = React.useMemo(() => {
    const start = (currentPage - 1) * GROUPS_PER_PAGE;
    const end = start + GROUPS_PER_PAGE;

    return filteredGroups.slice(start, end);
  }, [currentPage, filteredGroups]);

  const selectedGroups = React.useMemo(() => {
    const groupsById = new Map(
        (data?.groups ?? []).map((group) => [group.id, group])
    );

    return Array.from(selectedGroupIds)
        .map((groupId) => groupsById.get(groupId))
        .filter((group): group is ImportIssueGroup => !!group);
  }, [data?.groups, selectedGroupIds]);

  const selectedConfirmableGroups = React.useMemo(() => {
    return selectedGroups.filter(
        (group) => group.code === "SECTION_NEEDS_CONFIRMATION"
    );
  }, [selectedGroups]);

  React.useEffect(() => {
    setPage(1);
  }, [search, severityFilter]);

  React.useEffect(() => {
    if (page > totalPages) {
        setPage(totalPages);
    }
  }, [page, totalPages]);

  const isConfirmableGroup = React.useCallback((group: ImportIssueGroup) => {
    return group.code === "SECTION_NEEDS_CONFIRMATION";
  }, []);

  const toggleGroupSelection = React.useCallback(
    (group: ImportIssueGroup) => {
        if (!isConfirmableGroup(group)) return;

        setSelectedGroupIds((current) => {
        const next = new Set(current);

        if (next.has(group.id)) {
            next.delete(group.id);
        } else {
            next.add(group.id);
        }

        return next;
        });
    },
    [isConfirmableGroup]
  );

  const clearSelection = React.useCallback(() => {
    setSelectedGroupIds(new Set());
  }, []);

  const confirmSelectedGroups = React.useCallback(async () => {
    if (selectedConfirmableGroups.length === 0) return;

    setLocalLoading(true);
    setError(null);

    try {
        await onConfirmColumnIssues(selectedConfirmableGroups);
        setSelectedGroupIds(new Set());
        await loadIssues();
    } catch (err: any) {
        console.error(err);
        setError(err?.message || t("common.error"));
    } finally {
        setLocalLoading(false);
    }
  }, [loadIssues, onConfirmColumnIssues, selectedConfirmableGroups, t]);

  const handlePageChange = React.useCallback(
    (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages) return;

        setPage(nextPage);
    },
    [totalPages]
  );

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
          <div>
            <div
              className="mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor, backgroundColor: hoverPrimary04, color: primary }}
            >
              {t("dataImport.improve.badge")}
            </div>

            <h2 className="text-lg font-semibold">
              {t("dataImport.improve.title")}
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 opacity-70">
              {t("dataImport.improve.description")}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[420px]">
            <IssueStat
              label={t("dataImport.improve.stats.groups")}
              value={data?.total_groups ?? 0}
            />
            <IssueStat
              label={t("dataImport.improve.stats.errors")}
              value={data?.blocking_issues ?? 0}
              danger={(data?.blocking_issues ?? 0) > 0}
            />
            <IssueStat
              label={t("dataImport.improve.stats.warnings")}
              value={data?.warning_issues ?? 0}
              warning={(data?.warning_issues ?? 0) > 0}
            />
          </div>
        </div>

        <div
          className="mt-4 grid gap-2 rounded-2xl border p-3 lg:grid-cols-[minmax(220px,1fr)_180px_auto] lg:items-end"
          style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide opacity-55">
              {t("common.search")}
            </span>

            <input
              value={search}
              disabled={loading || localLoading}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("dataImport.improve.searchPlaceholder")}
              className="h-10 rounded-xl border px-3 text-sm outline-none disabled:opacity-40"
              style={{ backgroundColor: background, borderColor, color: textColor }}
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide opacity-55">
              {t("dataImport.improve.severity")}
            </span>

            <select
              value={severityFilter}
              disabled={loading || localLoading}
              onChange={(event) =>
                setSeverityFilter(event.target.value as IssueSeverityFilter)
              }
              className="h-10 rounded-xl border px-3 text-sm outline-none disabled:opacity-40"
              style={{ backgroundColor: background, borderColor, color: textColor }}
            >
              <option value="all">
                {t("dataImport.improve.filters.all")}
              </option>
              <option value="error">
                {t("dataImport.improve.filters.errors")}
              </option>
              <option value="warning">
                {t("dataImport.improve.filters.warnings")}
              </option>
            </select>
          </label>

          <button
            type="button"
            disabled={loading || localLoading}
            onClick={() => void loadIssues()}
            className="h-10 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: background, borderColor }}
          >
            {t("common.refresh")}
          </button>
        </div>
      </div>

      {selectedGroupIds.size > 0 && (
        <div
            className="m-4 mb-0 flex flex-col gap-3 rounded-2xl border p-3 text-sm sm:m-5 sm:mb-0 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
            <div className="opacity-75">
            {t("dataImport.improve.selection.selected", {
                count: selectedConfirmableGroups.length,
            })}
            </div>

            <div className="flex flex-wrap gap-2">
            <button
                type="button"
                disabled={loading || localLoading}
                onClick={clearSelection}
                className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
                style={{ backgroundColor: background, borderColor, color: textColor }}
            >
                {t("dataImport.improve.selection.clear")}
            </button>

            <button
                type="button"
                disabled={
                loading ||
                localLoading ||
                selectedConfirmableGroups.length === 0
                }
                onClick={() => void confirmSelectedGroups()}
                className="rounded-xl border px-3 py-2 text-sm font-semibold transition hover:opacity-80 disabled:opacity-40"
                style={{ backgroundColor: primary, borderColor: primary, color: background }}
            >
                {t("dataImport.improve.selection.confirm", {
                count: selectedConfirmableGroups.length,
                })}
            </button>
            </div>
        </div>
      )}

      {(loading || localLoading) && (
        <div className="flex items-center gap-3 p-5 text-sm opacity-75">
          <LoadingDots />
          <span>{t("dataImport.improve.loading")}</span>
        </div>
      )}

      {error && (
        <div className="m-4 rounded-2xl border border-red-500 bg-red-50 p-4 text-sm text-red-700 sm:m-5">
          {error}
        </div>
      )}

      {!localLoading && !error && data && data.groups.length === 0 && (
        <EmptyIssuesState />
      )}

      {!localLoading && !error && data && data.groups.length > 0 && (
        <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">
          {filteredGroups.length === 0 ? (
            <div className="col-span-full rounded-2xl border p-6 text-center text-sm opacity-70" style={{ borderColor }}>
              {t("dataImport.improve.noFilteredResults")}
            </div>
          ) : (
            <>
                {paginatedGroups.map((group) => (
                <IssueGroupCard
                    key={group.id}
                    group={group}
                    disabled={loading || localLoading}
                    selected={selectedGroupIds.has(group.id)}
                    selectable={isConfirmableGroup(group)}
                    onToggleSelected={toggleGroupSelection}
                    onOpenIssueGroup={onOpenIssueGroup}
                    onConfirmColumnIssue={async (group) => {
                    await onConfirmColumnIssue(group);

                    setSelectedGroupIds((current) => {
                        const next = new Set(current);
                        next.delete(group.id);
                        return next;
                    });

                    await loadIssues();
                    }}
                />
                ))}

                <div className="col-span-full flex flex-col gap-3 pt-2">
                <div className="text-sm opacity-65">
                    {t("dataImport.improve.pagination.summary", {
                    shown: paginatedGroups.length,
                    total: filteredGroups.length,
                    page: currentPage,
                    pages: totalPages,
                    })}
                </div>

                <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onChange={handlePageChange}
                />
                </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function IssueGroupCard({
  group,
  disabled,
  selected,
  selectable,
  onToggleSelected,
  onOpenIssueGroup,
  onConfirmColumnIssue,
}: {
  group: ImportIssueGroup;
  disabled: boolean;
  selected: boolean;
  selectable: boolean;
  onToggleSelected: (group: ImportIssueGroup) => void;
  onOpenIssueGroup: (group: ImportIssueGroup) => Promise<void>;
  onConfirmColumnIssue: (group: ImportIssueGroup) => Promise<void>;
}) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  const isError = group.severity === "error";

  return (
    <article
      className="rounded-2xl border p-4"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {selectable && (
                <label
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium"
                    style={{ borderColor, backgroundColor: hoverPrimary04 }}
                >
                    <input
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => onToggleSelected(group)}
                    className="h-4 w-4"
                    />

                    <span>{t("dataImport.improve.selection.select")}</span>
                </label>
                )}
            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                isError
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700",
              ].join(" ")}
            >
              {isError
                ? t("dataImport.improve.severities.error")
                : t("dataImport.improve.severities.warning")}
            </span>

            <span className="text-xs opacity-60">
              {t(`dataImport.sections.${group.section}`)} · #{group.column_index}
            </span>
          </div>

          <h3
            className="mt-2 truncate font-semibold"
            title={group.column_name}
          >
            {group.column_name}
          </h3>

          <p className="mt-1 text-sm leading-6 opacity-75">
            {t(group.message_key, {
              expected: group.expected_type ?? group.detected_type,
              value: "",
            })}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <button
                type="button"
                disabled={disabled}
                onClick={() => void onOpenIssueGroup(group)}
                className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:opacity-80 disabled:opacity-40"
                style={{ borderColor: primary, backgroundColor: hoverPrimary04, color: primary }}
            >
                {t("dataImport.improve.openInPreview")}
            </button>

            {group.code === "SECTION_NEEDS_CONFIRMATION" && (
                <button
                type="button"
                disabled={disabled}
                onClick={() => void onConfirmColumnIssue(group)}
                className="inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-40"
                style={{ borderColor, backgroundColor: hoverPrimary04, color: textColor }}
                >
                {t("dataImport.improve.confirmColumn")}
                </button>
            )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <IssueMiniMetric
          label={t("dataImport.improve.metrics.issues")}
          value={group.count}
          danger={isError}
        />
        <IssueMiniMetric
          label={t("dataImport.improve.metrics.rows")}
          value={group.affected_rows}
        />
        <IssueMiniMetric
          label={t("dataImport.improve.metrics.expected")}
          value={group.expected_type ?? group.detected_type}
        />
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">
          {t("dataImport.improve.sampleValues")}
        </h4>

        {group.sample_values.length === 0 ? (
          <div className="text-xs opacity-50">
            {t("dataImport.improve.noSampleValues")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {group.sample_values.map((sample, index) => (
              <span
                key={`${sample.value ?? ""}-${index}`}
                className="max-w-full truncate rounded-full border px-2 py-1 text-xs"
                style={{ borderColor, backgroundColor: hoverPrimary04 }}
                title={sample.value ?? ""}
              >
                {sample.value || "\u2014"} · {sample.count} {/* Signe Unicode pour ce symbole - */}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function IssueStat({
  label,
  value,
  danger = false,
  warning = false,
}: {
  label: string;
  value: number;
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
          "mt-0.5 text-lg font-bold",
          danger ? "text-red-700" : warning ? "text-amber-700" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function IssueMiniMetric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: React.ReactNode;
  danger?: boolean;
}) {
  const { background, borderColor, hoverPrimary04 } = useTheme();

  return (
    <div
      className="rounded-xl border px-3 py-2"
      style={{
        borderColor: danger ? "#ef4444" : borderColor,
        backgroundColor: danger ? "#fee2e2" : hoverPrimary04 || background,
      }}
    >
      <div
        className={[
          "text-[11px] uppercase tracking-wide",
          danger ? "text-red-700" : "opacity-60",
        ].join(" ")}
      >
        {label}
      </div>

      <div
        className={[
          "mt-0.5 truncate text-sm font-bold",
          danger ? "text-red-700" : "",
        ].join(" ")}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyIssuesState() {
  const { t } = useTranslation();
  const { background, borderColor, hoverPrimary04, textColor } = useTheme();

  return (
    <div className="p-4 sm:p-5">
      <div
        className="rounded-2xl border p-6 text-center"
        style={{ backgroundColor: hoverPrimary04 || background, borderColor, color: textColor }}
      >
        <div className="text-lg font-semibold">
          {t("dataImport.improve.emptyTitle")}
        </div>

        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 opacity-70">
          {t("dataImport.improve.emptyDescription")}
        </p>
      </div>
    </div>
  );
}

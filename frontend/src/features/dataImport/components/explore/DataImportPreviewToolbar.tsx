import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type {
  DataImportPreviewDetectedTypeFilter,
  DataImportPreviewFilters,
  DetectedType,
  ImportColumnSummary,
  ImportSection,
} from "@/features/dataImport/dataImportTypes";

type DataImportPreviewToolbarProps = {
  section: ImportSection;
  columns: ImportColumnSummary[];
  filters: DataImportPreviewFilters;
  issuesOnly: boolean;
  loading: boolean;
  onFiltersChange: (filters: DataImportPreviewFilters) => Promise<void>;
  onToggleIssuesOnly: () => Promise<void>;
  onResetFilters: () => Promise<void>;
};

const TYPE_OPTIONS: DataImportPreviewDetectedTypeFilter[] = [
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

export function DataImportPreviewToolbar({
  section,
  columns,
  filters,
  issuesOnly,
  loading,
  onFiltersChange,
  onToggleIssuesOnly,
  onResetFilters,
}: DataImportPreviewToolbarProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  const [draftSearch, setDraftSearch] = React.useState(filters.search);

  React.useEffect(() => {
    setDraftSearch(filters.search);
  }, [filters.search]);

  const sectionColumns = React.useMemo(() => {
    return columns.filter((column) => column.section === section);
  }, [columns, section]);

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.detectedType !== "all" ||
    filters.columnIndex !== null ||
    filters.sortColumnIndex !== null ||
    issuesOnly;

  const submitSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onFiltersChange({
      ...filters,
      search: draftSearch.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <form
          onSubmit={submitSearch}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <div
            className="flex min-h-10 min-w-0 flex-1 items-center rounded-xl border px-3"
            style={{ borderColor, backgroundColor: background }}
          >
            <span className="mr-2 text-sm opacity-45">
              {"\u2315"} {/* Signe Unicode pour ce symbole ⌕ */}
            </span>

            <input
              value={draftSearch}
              disabled={loading}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder={t("dataImport.previewToolbar.searchPlaceholder")}
              className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-40"
              style={{ color: textColor }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
          >
            {t("common.search")}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void onToggleIssuesOnly()}
            className="h-10 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
            style={{
              borderColor: issuesOnly ? primary : borderColor,
              backgroundColor: issuesOnly ? hoverPrimary04 : background,
              color: issuesOnly ? primary : textColor,
            }}
          >
            {issuesOnly
              ? t("dataImport.actions.showAllRows")
              : t("dataImport.actions.showIssuesOnly")}
          </button>

          <button
            type="button"
            disabled={loading || !hasActiveFilters}
            onClick={() => void onResetFilters()}
            className="h-10 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
          >
            {t("dataImport.previewToolbar.reset")}
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <CompactSelect
          label={t("dataImport.previewToolbar.type")}
          value={filters.detectedType}
          disabled={loading}
          onChange={(value) =>
            void onFiltersChange({
              ...filters,
              detectedType: value as DetectedType | "all",
              columnIndex: null,
            })
          }
        >
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type === "all"
                ? t("dataImport.previewToolbar.allTypes")
                : t(`dataImport.types.${type}`)}
            </option>
          ))}
        </CompactSelect>

        <CompactSelect
          label={t("dataImport.previewToolbar.column")}
          value={filters.columnIndex ?? ""}
          disabled={loading}
          onChange={(value) =>
            void onFiltersChange({
              ...filters,
              columnIndex: value === "" ? null : Number(value),
            })
          }
        >
          <option value="">
            {t("dataImport.previewToolbar.allColumns")}
          </option>

          {sectionColumns.map((column) => (
            <option key={column.index} value={column.index}>
              {column.original_name || column.normalized_name}
            </option>
          ))}
        </CompactSelect>

        <CompactSelect
          label={t("dataImport.previewToolbar.sortBy")}
          value={filters.sortColumnIndex ?? ""}
          disabled={loading}
          onChange={(value) =>
            void onFiltersChange({
              ...filters,
              sortColumnIndex: value === "" ? null : Number(value),
            })
          }
        >
          <option value="">
            {t("dataImport.previewToolbar.noSort")}
          </option>

          {sectionColumns.map((column) => (
            <option key={column.index} value={column.index}>
              {column.original_name || column.normalized_name}
            </option>
          ))}
        </CompactSelect>

        <CompactSelect
          label={t("dataImport.previewToolbar.order")}
          value={filters.sortDirection}
          disabled={loading || filters.sortColumnIndex === null}
          onChange={(value) =>
            void onFiltersChange({
              ...filters,
              sortDirection: value as "asc" | "desc",
            })
          }
        >
          <option value="asc">
            {t("dataImport.previewToolbar.asc")}
          </option>
          <option value="desc">
            {t("dataImport.previewToolbar.desc")}
          </option>
        </CompactSelect>
      </div>
    </div>
  );
}

function CompactSelect({
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  disabled: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const { textColor, background, borderColor } = useTheme();

  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide opacity-55">
        {label}
      </span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-0 rounded-xl border px-3 text-sm outline-none transition disabled:opacity-40"
        style={{ backgroundColor: background, color: textColor, borderColor }}
      >
        {children}
      </select>
    </label>
  );
}

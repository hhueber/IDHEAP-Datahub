import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import { patchDataImportColumn, patchDataImportColumnTransform } from "@/features/dataImport/dataImportApi";
import type { ColumnTransformAction, DataImportAnalyzeResponse, DataImportPreviewResponse, DetectedType, ImportSection } from "@/features/dataImport/dataImportTypes";
import { EditableImportCell } from "@/features/dataImport/components/EditableImportCell";

type DataImportPreviewTableProps = {
  importId: string;
  data: DataImportPreviewResponse["data"];
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onReload: () => Promise<void>;
  onAnalysisUpdated: (analysis: DataImportAnalyzeResponse["data"]) => void;
};

const TYPE_OPTIONS: DetectedType[] = [
  "integer",
  "float",
  "boolean",
  "date",
  "datetime",
  "text",
  "empty",
  "mixed",
];

const SECTION_OPTIONS: ImportSection[] = [
  "dataset",
  "questions",
  "responses",
  "choices",
  "municipalities",
  "metadata",
  "unclassified",
  "ignored",
];

export function DataImportPreviewTable({
  importId,
  data,
  page,
  perPage,
  onPageChange,
  onReload,
  onAnalysisUpdated,
}: DataImportPreviewTableProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  const totalPages = Math.max(1, Math.ceil(data.total_rows / perPage));

  const handleColumnTypeChange = async (
    columnIndex: number,
    detectedType: DetectedType
  ) => {
    const json = await patchDataImportColumn({
      importId,
      columnIndex,
      detectedType,
    });

    if (json.success) {
      onAnalysisUpdated(json.data);
    }

    await onReload();
  };

  const handleColumnSectionChange = async (
    columnIndex: number,
    section: ImportSection
  ) => {
    const json = await patchDataImportColumn({
      importId,
      columnIndex,
      section,
    });

    if (json.success) {
      onAnalysisUpdated(json.data);
    }

    await onReload();
  };

  const handleColumnTransform = async (
    columnIndex: number,
    action: ColumnTransformAction
  ) => {
    const json = await patchDataImportColumnTransform({
      importId,
      columnIndex,
      action,
    });

    if (json.success) {
      onAnalysisUpdated(json.data);
    }

    await onReload();
  };

  return (
    <section
      className="overflow-hidden rounded-3xl border"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div
        className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between"
        style={{ borderColor }}
      >
        <div>
          <div
            className="mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor, backgroundColor: hoverPrimary04, color: primary }}
          >
            {t(`dataImport.sections.${data.section}`)}
          </div>

          <h2 className="text-lg font-semibold">
            {t("dataImport.preview.title")}
          </h2>

          <p className="mt-1 text-sm opacity-70">
            {data.total_rows} {t("dataImport.summary.rows")} ·{" "}
            {data.columns.length} {t("dataImport.summary.columns")} ·{" "}
            {data.issues_count} {t("dataImport.summary.issues")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
          >
            {t("common.previous")}
          </button>

          <div
            className="rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor }}
          >
            {page} / {totalPages}
          </div>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
          >
            {t("common.next")}
          </button>
        </div>
      </div>

      <div className="max-h-[72vh] overflow-auto">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="sticky left-0 top-0 z-30 w-16 border-b border-r px-3 py-3 text-left"
                style={{ backgroundColor: background, borderColor }}
              >
                {"\u0023"} {/* Signe Unicode pour ce symbole # */}
              </th>

              {data.columns.map((column) => (
                <th
                  key={column.index}
                  className="sticky top-0 z-20 min-w-56 border-b border-r p-3 text-left align-top"
                  style={{ backgroundColor: background, borderColor }}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold" title={column.name}>
                          {column.name}
                        </div>

                        <div className="mt-1 text-[11px] opacity-60">
                          {"\u0023"}{column.index} {/* Signe Unicode pour ce symbole # */}
                        </div>
                      </div>

                      {column.issue_count > 0 && (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                          {column.issue_count}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <select
                        value={column.section}
                        onChange={(event) =>
                          void handleColumnSectionChange(
                            column.index,
                            event.target.value as ImportSection
                          )
                        }
                        className="rounded-xl border px-2 py-2 text-xs outline-none"
                        style={{ backgroundColor: background, color: textColor, borderColor }}
                      >
                        {SECTION_OPTIONS.map((section) => (
                          <option key={section} value={section}>
                            {t(`dataImport.sections.${section}`)}
                          </option>
                        ))}
                      </select>

                      <select
                        value={column.detected_type}
                        onChange={(event) =>
                          void handleColumnTypeChange(
                            column.index,
                            event.target.value as DetectedType
                          )
                        }
                        className="rounded-xl border px-2 py-2 text-xs outline-none"
                        style={{ backgroundColor: background, color: textColor, borderColor }}
                      >
                        {TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {t(`dataImport.types.${type}`)}
                          </option>
                        ))}
                      </select>

                      <select
                        defaultValue=""
                        onChange={(event) => {
                          const action = event.target.value as ColumnTransformAction | "";
                          if (!action) return;

                          void handleColumnTransform(column.index, action);
                          event.target.value = "";
                        }}
                        className="rounded-xl border px-2 py-2 text-xs outline-none"
                        style={{ backgroundColor: background, color: textColor, borderColor }}
                      >
                        <option value="">
                          {t("dataImport.columnActions.title")}
                        </option>
                        <option value="trim">
                          {t("dataImport.columnActions.trim")}
                        </option>
                        <option value="comma_to_dot">
                          {t("dataImport.columnActions.commaToDot")}
                        </option>
                        <option value="dot_to_comma">
                          {t("dataImport.columnActions.dotToComma")}
                        </option>
                        <option value="empty_to_null">
                          {t("dataImport.columnActions.emptyToNull")}
                        </option>
                        <option value="normalize_datetime">
                          {t("dataImport.columnActions.normalizeDatetime")}
                        </option>
                        <option value="datetime_to_date">
                          {t("dataImport.columnActions.datetimeToDate")}
                        </option>
                      </select>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.rows.map((row) => (
              <tr key={row.row_index}>
                <td
                  className="sticky left-0 z-10 border-r border-b px-3 py-2 text-xs font-medium"
                  style={{ backgroundColor: hoverPrimary04, borderColor }}
                >
                  {row.row_index + 1}
                </td>

                {data.columns.map((column) => {
                  const cell = row.cells[String(column.index)];

                  return (
                    <EditableImportCell
                      key={`${row.row_index}-${column.index}`}
                      importId={importId}
                      rowIndex={row.row_index}
                      columnIndex={column.index}
                      value={cell?.value ?? ""}
                      hasIssue={!!cell?.issue}
                      issueMessage={
                        cell?.issue
                          ? t(cell.issue.message_key, {
                              expected: cell.issue.expected_type,
                              value: cell.issue.actual_value,
                            })
                          : null
                      }
                      onSaved={onReload}
                      onAnalysisUpdated={onAnalysisUpdated}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

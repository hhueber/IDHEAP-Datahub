import React from "react";
import Pagination from "@/utils/Pagination";
import { apiFetch } from "@/shared/apiFetch";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "react-i18next";
import type {
  Entity,
  ShowChildColumn,
  ShowChildMeta,
  ShowChildrenResponse,
} from "@/features/pageShow/show_type";
import { useNavigate } from "react-router-dom";
import { getPageAllLang } from "@/features/pageAll/pageAllLang";
import type { TFunction } from "i18next";

type Props = {
  parentEntity: Entity;
  parentId: number;
  child: ShowChildMeta;
};

function getColumnLabel(column: ShowChildColumn): string {
  const labelByKey: Record<string, string> = {
    uid: "UID",
    commune_uid: "Commune",
    district_uid: "District",
    canton_uid: "Canton",
    survey_uid: "Survey",
    question_uid: "Question",
    question_global_uid: "Global question",
    question_category_uid: "Category",
    option_uid: "Option",
  };

  return labelByKey[column.key] ?? column.label;
}

function getRelatedDisplayValue(row: Record<string, any>, key: string): any {
  const displayKeyByUidKey: Record<string, string[]> = {
    commune_uid: ["commune_name", "commune"],
    district_uid: ["district_name", "district"],
    canton_uid: ["canton_name", "canton"],
    survey_uid: ["survey_name", "survey"],
    question_uid: ["question_name", "question"],
    question_global_uid: ["question_global_name", "question_global"],
    question_category_uid: ["question_category_name", "question_category"],
    option_uid: ["option_name", "option"],
  };

  const displayKeys = displayKeyByUidKey[key];

  if (!displayKeys) {
    return undefined;
  }

  for (const displayKey of displayKeys) {
    const value = row[displayKey];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return undefined;
}

function formatChildValue(
  row: Record<string, any>,
  column: ShowChildColumn,
  t: TFunction
): React.ReactNode {
  const relatedDisplayValue = getRelatedDisplayValue(row, column.key);
  const value = relatedDisplayValue ?? row[column.key];

  if (value === null || value === undefined) {
    return "—";
  }

  if (column.kind === "bool") {
    if (value === true || value === "true" || value === 1 || value === "1") {
      return t("dashboardSidebar.pageShow.visibility.private");
    }

    if (value === false || value === "false" || value === 0 || value === "0") {
      return t("dashboardSidebar.pageShow.visibility.public");
    }

    return "—";
  }

  if (typeof value === "boolean") {
    return value
      ? t("dashboardSidebar.pageShow.visibility.private")
      : t("dashboardSidebar.pageShow.visibility.public");
  }

  if (typeof value === "string" && value.trim() === "") {
    return "—";
  }

  return String(value);
}

function getAlignClass(column: ShowChildColumn): string {
  if (column.align === "center") {
    return "text-center";
  }

  if (column.align === "right") {
    return "text-right";
  }

  return "text-left";
}

export default function ChildrenTable({
  parentEntity,
  parentId,
  child,
}: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const {
    textColor,
    background,
    borderColor,
    hoverPrimary04,
    hoverText07,
  } = useTheme();

  const [page, setPage] = React.useState(1);
  const perPage = child.per_page ?? 10;

  const [items, setItems] = React.useState<Record<string, any>[]>([]);
  const [pages, setPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const lang = React.useMemo(
    () => getPageAllLang(i18n.language),
    [i18n.language]
  );

  const visibleColumns = React.useMemo(
    () => child.columns.filter((column) => column.key !== "uid"),
    [child.columns]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const json = await apiFetch<ShowChildrenResponse>(
        `/show/${parentEntity}/${parentId}/children/${child.key}`,
        {
          method: "GET",
          auth: true,
          query: {
            page,
            per_page: perPage,
            lang,
          },
        }
      );

      if (!json.success) {
        throw new Error(json.detail || "Error");
      }

      const d = json.data;

      setItems(d?.items ?? []);
      setPages(d?.pages ?? 1);
    } catch (e: any) {
      setError(e?.message ?? t("common.error"));
      setItems([]);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }, [child.key, page, perPage, parentEntity, parentId, lang, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handlePageChange = (p: number) => {
    if (p < 1 || p > pages) {
      return;
    }

    setPage(p);
  };

  const hasShow = child.actions?.show ?? true;
  const colSpan = visibleColumns.length + 1 + (hasShow ? 1 : 0);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor,
        backgroundColor: background,
      }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor }}>
        <div className="text-sm font-semibold">{child.title}</div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="text-sm" style={{ color: hoverText07 }}>
            {t("dashboardSidebar.pageShow.loading")}
          </div>
        )}

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div
          className="overflow-x-auto border rounded mt-3"
          style={{ borderColor }}
        >
          <table className="min-w-max w-full text-sm border-collapse">
            <thead style={{ backgroundColor: hoverPrimary04 }}>
              <tr>
                <th
                  className="border-b px-3 py-2 text-left font-medium whitespace-nowrap"
                  style={{
                    borderColor,
                    color: textColor,
                  }}
                >
                  {"\u0023"} {/* Unicode pour ce symbole # */}
                </th>

                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`border-b px-3 py-2 font-medium whitespace-nowrap ${getAlignClass(
                      column
                    )}`}
                    style={{
                      borderColor,
                      color: textColor,
                    }}
                  >
                    {getColumnLabel(column)}
                  </th>
                ))}

                {hasShow && (
                  <th
                    className="border-b px-3 py-2 text-left font-medium whitespace-nowrap"
                    style={{
                      borderColor,
                      color: textColor,
                    }}
                  >
                    {t("dashboardSidebar.pageAll.actions")}
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-3 py-4 text-center"
                    style={{ color: hoverText07 }}
                  >
                    {t("dashboardSidebar.pageAll.noData")}
                  </td>
                </tr>
              ) : (
                items.map((row, index) => (
                  <tr
                    key={row.uid ?? `${child.key}-${page}-${index}`}
                    className="transition-colors hover:[background-color:var(--row-hover)]"
                    style={
                      {
                        "--row-hover": hoverPrimary04,
                      } as React.CSSProperties
                    }
                  >
                    <td
                      className="border-b px-3 py-2 whitespace-nowrap text-left"
                      style={{
                        borderColor,
                        color: textColor,
                      }}
                    >
                      {(page - 1) * perPage + index + 1}
                    </td>

                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`border-b px-3 py-2 whitespace-nowrap ${getAlignClass(
                          column
                        )}`}
                        style={{
                          borderColor,
                          color: textColor,
                        }}
                      >
                        {formatChildValue(row, column, t)}
                      </td>
                    ))}

                    {hasShow && (
                      <td
                        className="border-b px-3 py-2 whitespace-nowrap"
                        style={{ borderColor }}
                      >
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded border hover:[background-color:var(--child-btn-hover-bg)]"
                          style={
                            {
                              backgroundColor: background,
                              borderColor,
                              color: textColor,
                              "--child-btn-hover-bg": hoverPrimary04,
                            } as React.CSSProperties
                          }
                          onClick={() => {
                            if (!row.uid) {
                              return;
                            }

                            navigate(
                              `/admin/places/show/${child.entity}/${row.uid}`
                            );
                          }}
                        >
                          {t("dashboardSidebar.pageAll.show")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <Pagination
            page={page}
            totalPages={pages}
            onChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}

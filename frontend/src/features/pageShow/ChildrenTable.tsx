import React from "react";
import Pagination from "@/utils/Pagination";
import { apiFetch } from "@/shared/apiFetch";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "react-i18next";
import type { Entity, ShowChildMeta, ShowChildrenResponse } from "@/features/pageShow/show_type";
import { useNavigate } from "react-router-dom";

type Props = {
  parentEntity: Entity;
  parentId: number;
  child: ShowChildMeta;
};

export default function ChildrenTable({ parentEntity, parentId, child }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { textColor, background, borderColor, hoverPrimary04, hoverText07 } = useTheme();

  const [page, setPage] = React.useState(1);
  const perPage = child.per_page ?? 10;
  const [items, setItems] = React.useState<Record<string, any>[]>([]);
  const [pages, setPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const json = await apiFetch<ShowChildrenResponse>(
        `/show/${parentEntity}/${parentId}/children/${child.key}`,
        {
          method: "GET",
          auth: true,
          query: { page, per_page: perPage },
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
  }, [child.key, page, perPage, parentEntity, parentId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const hasShow = child.actions?.show ?? true;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor, backgroundColor: background }}>
      <div className="px-4 py-3 border-b" style={{ borderColor }}>
        <div className="text-sm font-semibold">{child.title}</div>
      </div>

      <div className="p-4">
        {loading && <div className="text-sm" style={{ color: hoverText07 }}>{t("dashboardSidebar.pageShow.loading")}</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="overflow-x-auto border rounded mt-3" style={{ borderColor }}>
          <table className="min-w-max w-full text-sm border-collapse">
            <thead style={{ backgroundColor: hoverPrimary04 }}>
              <tr>
                {child.columns.map((c) => (
                  <th
                    key={c.key}
                    className="border-b px-3 py-2 text-left font-medium whitespace-nowrap"
                    style={{ borderColor, color: textColor }}
                  >
                    {c.label}
                  </th>
                ))}
                {hasShow && (
                  <th className="border-b px-3 py-2 text-left font-medium whitespace-nowrap" style={{ borderColor, color: textColor }}>
                    {t("dashboardSidebar.pageAll.actions")}
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={child.columns.length + (hasShow ? 1 : 0)} className="px-3 py-4 text-center" style={{ color: hoverText07 }}>
                    {t("dashboardSidebar.pageAll.noData")}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.uid ?? JSON.stringify(row)} className="hover:[background-color:var(--row-hover)]"
                      style={{ ["--row-hover" as any]: hoverPrimary04 }}>
                    {child.columns.map((c) => (
                      <td key={c.key} className="border-b px-3 py-2 whitespace-nowrap" style={{ borderColor, color: textColor }}>
                        {row[c.key] ?? "—"}
                      </td>
                    ))}

                    {hasShow && (
                      <td className="border-b px-3 py-2 whitespace-nowrap" style={{ borderColor }}>
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded border"
                          style={{ backgroundColor: background, borderColor, color: textColor }}
                          onClick={() => navigate(`/admin/places/show/${child.entity}/${row.uid}`)}
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
          <Pagination page={page} totalPages={pages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
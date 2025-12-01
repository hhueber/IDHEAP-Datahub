import React from "react";
import Pagination from "@/utils/Pagination";
import { apiFetch } from "@/shared/apiFetch";
import type { AllItem, AllResponse, Entity } from "@/features/pageAll/all_types";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";

type PageAllProps = {
  title: string;
  entity: Entity;
  initialPerPage?: number;
};

export default function PageAll({ title, entity, initialPerPage = 20 }: PageAllProps) {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(initialPerPage);
  const [items, setItems] = React.useState<AllItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // État de tri
  const [sortBy, setSortBy] = React.useState<"uid" | "name">("uid");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const loadPage = React.useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const json = await apiFetch<AllResponse>("/pageAll/all", {
          method: "GET",
          auth: true,
          query: {
            entity,
            page: p,
            per_page: perPage,
            order_by: sortBy,
            order_dir: sortDir,
          },
        });

        if (!json.success) {
          throw new Error(json.detail || t("common.unknown"));
        }

        setItems(json.data.items);
        setTotalPages(json.data.pages);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || t("common.error"));
      } finally {
        setLoading(false);
      }
    },
    [entity, perPage, sortBy, sortDir]
  );

  React.useEffect(() => {
    void loadPage(page);
  }, [page, loadPage]);

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // quand on change le tri, on revient à la page 1
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "uid" | "name";
    setSortBy(value);
    setPage(1);
  };

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  return (
    <div className="p-6 flex flex-col h-full">
      <h1 className="text-xl font-semibold mb-4">{title}</h1>

      {/* barre de tri, responsive (colonne sur mobile, rangée sur desktop) */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-700">{t("dashboardSidebar.places.commune.pageAll.sort")}</span>
          <select
            value={sortBy}
            onChange={handleSortByChange}
            className="h-9 rounded border px-2 text-sm bg-white"
          >
            <option value="uid">{t("dashboardSidebar.places.commune.pageAll.uid")}</option>
            <option value="name">{t("dashboardSidebar.places.commune.pageAll.name")}</option>
          </select>
          <button
            type="button"
            onClick={toggleSortDir}
            className="h-9 px-3 rounded border text-sm flex items-center gap-1 bg-white hover:bg-gray-50"
          >
            {sortDir === "asc" ? (
              <>
                <span>{t("dashboardSidebar.places.commune.pageAll.asc")}</span>
                <span aria-hidden>↑</span>
              </>
            ) : (
              <>
                <span>{t("dashboardSidebar.places.commune.pageAll.desc")}</span>
                <span aria-hidden>↓</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {loading && <div className="text-sm text-gray-500 mb-2"><LoadingDots label={t("dashboardSidebar.places.commune.pageAll.loading")}/></div>}
        {error && (
          <div className="text-sm text-red-500 mb-2">
            {t("dashboardSidebar.places.commune.pageAll.error")} {error}
          </div>
        )}

        {/* table avec scroll horizontal si besoin */}
        <div className="flex-1 overflow-auto border rounded">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b px-3 py-2 text-left font-medium whitespace-nowrap">{t("dashboardSidebar.places.commune.pageAll.uid")}</th>
                  <th className="border-b px-3 py-2 text-left font-medium whitespace-nowrap">{t("dashboardSidebar.places.commune.pageAll.code")}</th>
                  <th className="border-b px-3 py-2 text-left font-medium whitespace-nowrap">{t("dashboardSidebar.places.commune.pageAll.name")}</th>
                  <th className="border-b px-3 py-2 text-left font-medium whitespace-nowrap">{t("dashboardSidebar.places.commune.pageAll.entity")}</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      {t("dashboardSidebar.places.commune.pageAll.noData")}
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.uid} className="hover:bg-gray-50">
                      <td className="border-b px-3 py-2 whitespace-nowrap">{row.uid}</td>
                      <td className="border-b px-3 py-2 whitespace-nowrap">{row.code}</td>
                      <td className="border-b px-3 py-2 whitespace-nowrap">{row.name}</td>
                      <td className="border-b px-3 py-2 whitespace-nowrap">{row.entity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
      </div>
    </div>
  );
}

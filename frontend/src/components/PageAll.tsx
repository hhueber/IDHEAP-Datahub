import React from "react";
import Pagination from "@/utils/Pagination";
import { apiFetch } from "@/shared/apiFetch";
import type {
  AllItem,
  AllResponse,
  Entity,
  ColumnConfig,
  ActionsConfig,
  SortBy,
  SortDir,
} from "@/features/pageAll/all_types";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { usePageAllSearch } from "@/features/pageAll/usePageAllSearch";
import { SearchBar } from "@/utils/SearchBar";
import type { FindPageResponse } from "@/features/pageAll/all_types";
import { useDelete } from "@/shared/useDelete";
import { ConfirmModal } from "@/utils/ConfirmModal";

type PageAllProps = {
  title: string;
  entity: Entity;
  initialPerPage?: number;
  columns: ColumnConfig[];
  actions?: ActionsConfig;
};

export default function PageAll({
  title,
  entity,
  initialPerPage = 20,
  columns,
  actions,
}: PageAllProps) {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(initialPerPage);
  const [items, setItems] = React.useState<AllItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // État de tri générique (uid / name pour l’instant)
  const [sortBy, setSortBy] = React.useState<SortBy>("uid");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const {
    search,
    searchLoading,
    suggestions,
    selectedUid,
    handleSearchChange,
    handleSuggestionClick,
    clearSearch,
  } = usePageAllSearch(entity);

  const {
    target: deleteTarget,
    loading: deleteLoading,
    error: deleteError,
    openConfirm: openDeleteConfirm,
    confirm: confirmDelete,
    cancel: cancelDelete,
  } = useDelete<AllItem>((row) => ({
    entity,
    filters: [
      {
        field: "uid",
        value: row.uid,
      },
    ],
    // pas de clear_fields ici -> DELETE complet de la ligne
  }));

  const findPageForUid = React.useCallback(
    async (uid: number): Promise<number> => {
      try {
        const json = await apiFetch<FindPageResponse>("/pageAll/find_page", {
          method: "GET",
          auth: true,
          query: {
            entity,
            uid,
            per_page: perPage,
            order_by: sortBy,
            order_dir: sortDir,
          },
        });

        if (!json.success) {
          throw new Error(json.detail || t("common.unknown"));
        }

        return json.data.page;
      } catch (e) {
        console.error(e);
        // fallback : page 1 si problème
        return 1;
      }
    },
    [entity, perPage, sortBy, sortDir, t]
  );

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
    [entity, perPage, sortBy, sortDir, t]
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
    const value = e.target.value as SortBy;
    setSortBy(value);
    setPage(1);
  };

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const hasActions = !!actions && (actions.show || actions.edit || actions.delete);

  return (
    <div className="p-6 flex flex-col h-full">
      <h1 className="text-xl font-semibold mb-4">{title}</h1>

      {/* Barre supérieure : recherche + tri, responsive */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Bloc recherche (logique déportée dans usePageAllSearch) */}
        <SearchBar
          search={search}
          searchLoading={searchLoading}
          suggestions={suggestions}
          onSearchChange={handleSearchChange}
          onClearSearch={() => {
            clearSearch();
          }}
          onSuggestionClick={async (item) => {
            handleSuggestionClick(item);        // met à jour selectedUid
            const targetPage = await findPageForUid(item.uid);
            setPage(targetPage);                // déclenche loadPage(targetPage)
          }}
        />

        {/* Bloc tri */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-700">
            {t("dashboardSidebar.pageAll.sortBy")}
          </span>
          <select
            value={sortBy}
            onChange={handleSortByChange}
            className="h-9 rounded border px-2 text-sm bg-white"
          >
            <option value="uid">{t("dashboardSidebar.pageAll.uid")}</option>
            <option value="name">{t("dashboardSidebar.pageAll.name")}</option>
          </select>
          <button
            type="button"
            onClick={toggleSortDir}
            className="h-9 px-3 rounded border text-sm flex items-center gap-1 bg-white hover:bg-gray-50"
          >
            {sortDir === "asc" ? (
              <>
                <span>{t("dashboardSidebar.pageAll.asc")}</span>
                <span aria-hidden>↑</span>
              </>
            ) : (
              <>
                <span>{t("dashboardSidebar.pageAll.desc")}</span>
                <span aria-hidden>↓</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {loading && (
          <div className="text-sm text-gray-500 mb-2">
            <LoadingDots label={t("dashboardSidebar.pageAll.loading")} />
          </div>
        )}
        {error && (
          <div className="text-sm text-red-500 mb-2">
            {t("dashboardSidebar.pageAll.error")} {error}
          </div>
        )}
        {deleteError && (
          <div className="text-sm text-red-500 mb-2">
            {t("dashboardSidebar.pageAll.deleteError")}{" "}
            {deleteError}
          </div>
        )}

        {/* table avec scroll horizontal si besoin */}
        <div className="flex-1 overflow-auto border rounded">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="border-b px-3 py-2 text-left font-medium whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  {hasActions && (
                    <th className="border-b px-3 py-2 text-left font-medium whitespace-nowrap">
                      {t("dashboardSidebar.pageAll.actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={columns.length + (hasActions ? 1 : 0)}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      {t("dashboardSidebar.pageAll.noData")}
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    // quand element chercher met la ligne en jaune
                    <tr key={row.uid}
                        className={[
                        "hover:bg-gray-50",
                        selectedUid === row.uid ? "bg-yellow-50" : "",
                        ].join(" ")}>
                      {columns.map((col) => {
                        const value = (row as any)[col.key];
                        const content = col.render ? col.render(row) : value;
                        const alignClass =
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : "text-left";

                        return (
                          <td
                            key={col.key}
                            className={`border-b px-3 py-2 whitespace-nowrap ${alignClass}`}
                          >
                            {content}
                          </td>
                        );
                      })}

                      {hasActions && (
                        <td className="border-b px-3 py-2 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {actions?.show && (
                              <button
                                type="button"
                                className="px-2 py-1 text-xs rounded border hover:bg-gray-100"
                                onClick={() => {
                                  // TODO: Wiring réel plus tard
                                  console.log("Show", entity, row.uid);
                                }}
                              >
                                {t("dashboardSidebar.pageAll.show")}
                              </button>
                            )}
                            {actions?.edit && (
                              <button
                                type="button"
                                className="px-2 py-1 text-xs rounded border hover:bg-gray-100"
                                onClick={() => {
                                  // TODO: Wiring réel plus tard
                                  console.log("Edit", entity, row.uid);
                                }}
                              >
                                {t("dashboardSidebar.pageAll.edit")}
                              </button>
                            )}
                            {actions?.delete && (
                              <button
                                type="button"
                                className="px-2 py-1 text-xs rounded border text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => openDeleteConfirm(row)}
                              >
                                {t("dashboardSidebar.pageAll.delete")}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
        <ConfirmModal
        open={!!deleteTarget}
        title={t("dashboardSidebar.pageAll.confirmDeleteTitle")}
        message={t(
          "dashboardSidebar.pageAll.confirmDeleteMessage",
          {
            name: deleteTarget?.name ?? "",
          }
        )}
        confirmLabel={
          deleteLoading
            ? t("dashboardSidebar.pageAll.deleting")
            : t("dashboardSidebar.pageAll.delete")
        }
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={async () => {
          const ok = await confirmDelete();
          if (!ok) return;
          if (items.length === 1 && page > 1) {
            setPage((prev) => Math.max(1, prev - 1));
          } else {
             void loadPage(page);
          }
        }}
        onCancel={cancelDelete}
      />
      </div>
    </div>
  );
}

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
import { useTheme } from "@/theme/useTheme";
import { useNavigate } from "react-router-dom";
import { getPageAllLang } from "@/features/pageAll/pageAllLang";
import { usePageAllInlineEdit } from "@/features/pageAll/edit/usePageAllInlineEdit";
import PageAllEditableCell from "@/features/pageAll/edit/PageAllEditableCell";
import { getColumnEditKey } from "@/features/pageAll/edit/pageAllEditUtils";

type PageAllProps = {
  title: string;
  entity: Entity;
  initialPerPage?: number;
  columns: ColumnConfig[];
  actions?: ActionsConfig;
  defaultSortBy?: SortBy;
  defaultSortDir?: SortDir;
};

export default function PageAll({
  title,
  entity,
  initialPerPage = 20,
  columns,
  actions,
  defaultSortBy,
  defaultSortDir = "asc",
}: PageAllProps) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(initialPerPage);
  const [items, setItems] = React.useState<AllItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // État de tri générique basé sur les colonnes affichées
  const firstSortableColumn = columns.find((col) => col.sortable !== false);
  const [sortBy, setSortBy] = React.useState<SortBy>(
    defaultSortBy ??
      ((firstSortableColumn?.sortKey ?? firstSortableColumn?.key ?? "name") as SortBy)
  );
  const [sortDir, setSortDir] = React.useState<SortDir>(defaultSortDir);

  const lang = React.useMemo(() => getPageAllLang(i18n.language), [i18n.language]);

  const [activeSearch, setActiveSearch] = React.useState("");
  const [editConfirmTarget, setEditConfirmTarget] = React.useState<AllItem | null>(null);

  const sortableColumns = React.useMemo(
    () => columns.filter((col) => col.sortable !== false),
    [columns]
  );

  React.useEffect(() => {
    const availableSortKeys = sortableColumns.map((col) => col.sortKey ?? col.key);

    if (!availableSortKeys.includes(sortBy)) {
      const fallback = availableSortKeys[0] as SortBy | undefined;
      if (fallback) {
        setSortBy(fallback);
        setPage(1);
      }
    }
  }, [sortableColumns, sortBy]);

  const {
    search,
    searchLoading,
    suggestions,
    selectedUid,
    handleSearchChange,
    handleSuggestionClick,
    clearSearch,
    clearSuggestions,
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

  const navigate = useNavigate();
  const { textColor, background, borderColor, hoverPrimary04, hoverPrimary15, hoverText07 } = useTheme();

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
            lang,
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
    [entity, perPage, sortBy, sortDir, lang, t]
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
            lang,
            q: activeSearch || undefined,
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
    [entity, perPage, sortBy, sortDir, lang, activeSearch, t]
  );

  const inlineEdit = usePageAllInlineEdit({
    entity,
    columns,
    lang,
    onSuccess: async () => {
      await loadPage(page);
    },
  });

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

  const hasActions = !!actions && (actions.show || actions.edit || actions.delete);

  // Constante pour UI
  const controlCls = "h-9 rounded-lg border px-3 text-sm transition inline-flex items-center gap-1";

  const controlStyle: React.CSSProperties = {
    backgroundColor: background,
    borderColor,
    color: textColor,
  };

  const hoverBgVars = {
    "--pageall-control-hover-bg": hoverPrimary04,
  } as React.CSSProperties;

  const getColumnLabel = (col: ColumnConfig) => {
    if (col.labelKey) return t(col.labelKey);
    return col.label;
  };

  return (
    <div className="p-6 flex flex-col h-full" 
      style={{
        backgroundColor: background,
        color: textColor,
      }}>
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
            // clearSearch();
            clearSearch();
            setActiveSearch("");
            setPage(1);
          }}
          onSuggestionClick={async (item) => {
            handleSuggestionClick(item);        // met à jour selectedUid
            const targetPage = await findPageForUid(item.uid);
            setPage(targetPage);                // déclenche loadPage(targetPage)
          }}
          onSearchSubmit={(term) => {
            clearSuggestions();
            setActiveSearch(term);
            setPage(1);
          }}
        />

        {/* Bloc tri */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm" style={{ color: hoverText07 }}>
            {t("dashboardSidebar.pageAll.sortBy")}
          </span>
          <select
            value={sortBy}
            onChange={handleSortByChange}
            className={`${controlCls} appearance-none pr-5`}
            style={controlStyle}
          >
            {sortableColumns.map((col) => {
              const value = (col.sortKey ?? col.key) as SortBy;

              return (
                <option key={`${col.key}-${value}`} value={value}>
                  {getColumnLabel(col)}
                </option>
              );
            })}
          </select>
          <select
            value={sortDir}
            onChange={(e) => {
              setSortDir(e.target.value as SortDir);
              setPage(1);
            }}
            className={`${controlCls} appearance-none pr-5`}
            style={controlStyle}
          >
            <option value="asc">
              {t("dashboardSidebar.pageAll.asc")}
            </option>
            <option value="desc">
              {t("dashboardSidebar.pageAll.desc")}
            </option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {loading && (
          <div className="text-sm mb-2" style={{ color: hoverText07 }}>
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
        {inlineEdit.error && (
          <div className="text-sm text-red-500 mb-2">
            {t("dashboardSidebar.pageAll.editError")}{" "}
            {inlineEdit.error}
          </div>
        )}

        {/* table avec scroll horizontal si besoin */}
        <div className="overflow-auto border rounded"
          style={{
            borderColor,
            backgroundColor: background,
            maxHeight: "calc(100vh - 260px)",
          }}>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-sm border-collapse">
              <thead style={{ backgroundColor: hoverPrimary04 }}>
                <tr>
                  <th
                    className="border-b px-3 py-2 text-left font-medium whitespace-nowrap text-sm"
                    style={{
                      borderColor,
                      color: textColor,
                    }}
                  >
                    {"\u0023"} {/* Signe Unicode pour ce symbole # */}
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="border-b px-3 py-2 text-left font-medium whitespace-nowrap text-sm"
                      style={{
                        borderColor,
                        color: textColor,
                      }}
                    >
                      {getColumnLabel(col)}
                    </th>
                  ))}
                  {hasActions && (
                    <th className="border-b px-3 py-2 text-left font-medium whitespace-nowrap text-sm"
                      style={{
                        borderColor,
                        color: textColor,
                      }}>
                      {t("dashboardSidebar.pageAll.actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1 + (hasActions ? 1 : 0)}
                      className="px-3 py-4 text-center"
                      style={{ color: hoverText07 }}
                    >
                      {t("dashboardSidebar.pageAll.noData")}
                    </td>
                  </tr>
                ) : (
                  items.map((row, index) => (
                    // quand element chercher met la ligne en jaune
                    <tr key={row.uid}
                        className={[
                          "transition-colors",
                          selectedUid === row.uid ? "bg-[var(--pageall-row-selected-bg)]" : "",
                          "hover:[background-color:var(--pageall-row-hover-bg)]",
                        ].join(" ")}
                        style={
                          {
                            "--pageall-row-hover-bg": hoverPrimary04,
                            "--pageall-row-selected-bg": hoverPrimary15,
                          } as React.CSSProperties
                        }>
                      <td
                        className="border-b px-3 py-2 whitespace-nowrap text-left"
                        style={{ borderColor, color: textColor }}
                      >
                        {(page - 1) * perPage + index + 1}
                      </td>

                      {columns.map((col) => {
                        const value = (row as any)[col.key];
                        const content = col.render ? col.render(row) : (value ?? "—");
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
                            style={{ borderColor, color: textColor }}
                          >
                            <PageAllEditableCell
                              row={row}
                              col={col}
                              lang={lang}
                              content={content}
                              isEditing={inlineEdit.isEditingRow(row) && inlineEdit.canEditColumn(col)}
                              draftValue={inlineEdit.draft[getColumnEditKey(col, lang)] ?? ""}
                              textColor={textColor}
                              background={background}
                              borderColor={borderColor}
                              hoverText07={hoverText07}
                              onChange={inlineEdit.updateDraft}
                            />
                          </td>
                        );
                      })}

                      {hasActions && (
                        <td className="border-b px-3 py-2 whitespace-nowrap" style={{ borderColor }}>
                          <div className="flex flex-wrap gap-1">
                            {actions?.show && (
                              <button
                                type="button"
                                className={`
                                  px-2 py-1 text-xs rounded border
                                  hover:[background-color:var(--pageall-btn-hover-bg)]
                                `}
                                style={
                                  {
                                    backgroundColor: background,
                                    borderColor,
                                    color: textColor,
                                    "--pageall-btn-hover-bg": hoverPrimary04,
                                  } as React.CSSProperties
                                }
                                onClick={() => {
                                  if (inlineEdit.isEditingRow(row)) {
                                    inlineEdit.cancelEditing();
                                  }

                                  navigate(`/admin/places/show/${entity}/${row.uid}`);
                                }}
                              >
                                {t("dashboardSidebar.pageAll.show")}
                              </button>
                            )}
                            {actions?.edit && (
                              <button
                                type="button"
                                disabled={
                                  inlineEdit.isEditingRow(row) &&
                                  (!inlineEdit.hasChanges(row) || inlineEdit.loading)
                                }
                                className={`
                                  px-2 py-1 text-xs rounded border
                                  hover:[background-color:var(--pageall-btn-hover-bg)]
                                  disabled:opacity-60
                                `}
                                style={
                                  {
                                    backgroundColor: background,
                                    borderColor,
                                    color: textColor,
                                    "--pageall-btn-hover-bg": hoverPrimary04,
                                  } as React.CSSProperties
                                }
                                onClick={() => {
                                  if (inlineEdit.isEditingRow(row)) {
                                    setEditConfirmTarget(row);
                                    return;
                                  }

                                  inlineEdit.startEditing(row);
                                }}
                              >
                                {inlineEdit.isEditingRow(row)
                                  ? inlineEdit.loading
                                    ? t("dashboardSidebar.pageAll.saving")
                                    : t("dashboardSidebar.pageAll.save")
                                  : t("dashboardSidebar.pageAll.edit")}
                              </button>
                            )}
                            {actions?.delete && (
                              <button
                                type="button"
                                className={
                                  inlineEdit.isEditingRow(row)
                                    ? "px-2 py-1 text-xs rounded border"
                                    : "px-2 py-1 text-xs rounded border text-red-600 border-red-300 hover:bg-red-50"
                                }
                                style={
                                  inlineEdit.isEditingRow(row)
                                    ? {
                                        backgroundColor: background,
                                        borderColor,
                                        color: textColor,
                                      }
                                    : undefined
                                }
                                onClick={() => {
                                  if (inlineEdit.isEditingRow(row)) {
                                    inlineEdit.cancelEditing();
                                    return;
                                  }

                                  openDeleteConfirm(row);
                                }}
                              >
                                {inlineEdit.isEditingRow(row)
                                  ? t("common.cancel")
                                  : t("dashboardSidebar.pageAll.delete")}
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
        <ConfirmModal
          open={!!editConfirmTarget}
          title={t("dashboardSidebar.pageAll.confirmEditTitle")}
          message={t("dashboardSidebar.pageAll.confirmEditMessage", {
            name: editConfirmTarget?.name ?? "",
          })}
          confirmLabel={
            inlineEdit.loading
              ? t("dashboardSidebar.pageAll.saving")
              : t("dashboardSidebar.pageAll.save")
          }
          cancelLabel={t("common.cancel", "Cancel")}
          onConfirm={async () => {
            if (!editConfirmTarget) return;

            const ok = await inlineEdit.confirmEditing(editConfirmTarget);
            if (!ok) return;

            setEditConfirmTarget(null);
          }}
          onCancel={() => {
            setEditConfirmTarget(null);
          }}
        />
      </div>
    </div>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/shared/apiFetch";
import { useTheme } from "@/theme/useTheme";
import type { Entity, ShowResponse, ShowMetaField } from "@/features/pageShow/show_type";
import ChildrenTable from "@/features/pageShow/ChildrenTable";
import { useDelete } from "@/shared/useDelete";
import { ConfirmModal } from "@/utils/ConfirmModal";
import { useEdit } from "@/shared/useEdit";

type Props = {
  id: number;
  entity: Entity;
  onEdit?: (entity: Entity, id: number) => void;
  onDelete?: (entity: Entity, id: number) => void;
};

const LANGS: { key: "de" | "fr" | "en" | "it" | "ro"; label: string }[] = [
  { key: "de", label: "Deutsch" },
  { key: "fr", label: "Français" },
  { key: "en", label: "English" },
  { key: "it", label: "Italiano" },
  { key: "ro", label: "Rumantsch" },
];

function renderEmpty(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.trim().length > 0 ? v : "—";
  return String(v);
}

function formatValue(kind: ShowMetaField["kind"], value: any) {
  if (value === null || value === undefined) return "—";
  if (kind === "bool") return value ? "Yes" : "No";
  return String(value);
}

function normalizeToString(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export default function EntityShow({ id, entity, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, hoverText07 } = useTheme();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<ShowResponse["meta"]>(null);
  const [data, setData] = React.useState<ShowResponse["data"]>(null);

  const canEdit = meta?.actions?.can_edit ?? false;
  const canDelete = meta?.actions?.can_delete ?? false;

  // DELETE (clear fields)
  const [deleteMode, setDeleteMode] = React.useState(false);
  const [selectedFieldsToClear, setSelectedFieldsToClear] = React.useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // INLINE EDIT
  const [editMode, setEditMode] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [confirmEditOpen, setConfirmEditOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const json = await apiFetch<ShowResponse>(`/show/${entity}/${id}`, {
        method: "GET",
        auth: true,
      });

      setMeta(json.meta ?? null);

      if (!json.success) {
        setData(null);
        setError(json.detail || t("common.error"));
        return;
      }

      setData(json.data ?? null);
    } catch (e: any) {
      setMeta(null);
      setData(null);
      setError(e?.message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [entity, id, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Hook edit -> /edit
  const {
    loading: editLoading,
    error: editError,
    confirmWith: confirmEditWith,
    cancel: cancelEdit,
  } = useEdit<{ entity: Entity; id: number; updates: Record<string, string> }>((tgt) => ({
    entity: tgt.entity,
    filters: [{ field: "uid", value: tgt.id }],
    updates: tgt.updates,
  }));

  // Hook delete -> /delete (DELETE)
  const {
    loading: clearLoading,
    error: clearError,
    openConfirm: openClearConfirm,
    confirm: confirmClear,
    cancel: cancelClear,
  } = useDelete<{ entity: Entity; id: number; clear_fields: string[] }>((tgt) => ({
    entity: tgt.entity,
    filters: [{ field: "uid", value: tgt.id }],
    clear_fields: tgt.clear_fields,
  }));

  const title =
    meta?.title_key && data?.[meta.title_key]
      ? String(data[meta.title_key])
      : `${entity} #${id}`;

  const fields = meta?.fields ?? [];

  const toggleClearField = (key: string) => {
    setSelectedFieldsToClear((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // --- EDIT helpers
  const isProtectedField = (key: string) => key === "uid" || key === "id";

  const enterEditMode = () => {
    if (!data) return;

    // initialise draft avec les valeurs actuelles (only for fields we show + languages)
    const next: Record<string, string> = {};

    for (const f of fields) {
      if (data[f.key] === undefined) continue;
      if (isProtectedField(f.key)) continue;
      next[f.key] = normalizeToString(data[f.key]);
    }

    // langues (meta.languages -> keys)
    if (meta?.languages) {
      for (const l of LANGS) {
        const k = meta.languages?.[l.key];
        if (!k) continue;
        if (data[k] === undefined) continue;
        if (isProtectedField(k)) continue;
        next[k] = normalizeToString(data[k]);
      }
    }

    setDraft(next);
    setEditMode(true);

    // Si delete mode actif, on le coupe (évite conflits UI)
    setDeleteMode(false);
    setSelectedFieldsToClear([]);
    cancelClear();
    setConfirmOpen(false);
  };

  const exitEditMode = () => {
    setEditMode(false);
    setDraft({});
    setConfirmEditOpen(false);
    cancelEdit();
  };

  const updateDraft = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const getChangedUpdates = (): Record<string, string> => {
    if (!data) return {};

    const updates: Record<string, string> = {};

    for (const [key, value] of Object.entries(draft)) {
      if (isProtectedField(key)) continue;

      // compare avec valeur d'origine (en string)
      const original = normalizeToString(data[key]);

      // si identique => ignore
      if (value === original) continue;

      // refuse vide
      if (value.trim() === "") continue;

      updates[key] = value;
    }

    return updates;
  };

  const hasAnyValidChange = () => {
    const updates = getChangedUpdates();
    return Object.keys(updates).length > 0;
  };

  // Styles UI pour l’édition inline : donnent des indices visuels clairs (fond léger, bordure, icône)
  // indiquant qu’un champ est modifiable, tout en conservant une mise en page stable
  const editableBoxClass =
    "inline-flex items-center gap-2 rounded-md border px-2 py-1 min-h-[30px] w-full";
  const editableBoxIdle =
    "border-black/10 bg-black/3";
  const editableBoxFocus =
    "focus-within:border-black/30 focus-within:bg-black/5";
  const editableInputClass =
    "w-full bg-transparent outline-none text-sm leading-tight";
  const pencilIconClass =
    "text-xs opacity-70 select-none";

  return (
    <div className="w-full h-full" style={{ backgroundColor: background, color: textColor }}>
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* LEFT */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* MAIN CARD */}
          <div
            className="rounded-2xl border shadow-sm"
            style={{ borderColor, backgroundColor: background }}
          >
            <div
              className="px-6 py-5 border-b flex items-start justify-between gap-4"
              style={{ borderColor }}
            >
              <div className="min-w-0">
                <h2 className="text-3xl font-semibold truncate">{title}</h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Confirm clear (delete mode) */}
                {deleteMode && (
                  <button
                    type="button"
                    disabled={selectedFieldsToClear.length === 0}
                    className="h-9 px-3 rounded-lg border text-sm transition disabled:opacity-60"
                    style={{
                      backgroundColor: background,
                      borderColor,
                      color: textColor,
                    }}
                    onClick={() => {
                      openClearConfirm({ entity, id, clear_fields: selectedFieldsToClear });
                      setConfirmOpen(true);
                    }}
                  >
                    {t("dashboardSidebar.pageShow.confirm")}
                  </button>
                )}

                {/* Confirm edit (edit mode) */}
                {editMode && (
                  <button
                    type="button"
                    disabled={!hasAnyValidChange()}
                    className="h-9 px-3 rounded-lg border text-sm transition disabled:opacity-60"
                    style={{ backgroundColor: background, borderColor, color: textColor }}
                    onClick={() => setConfirmEditOpen(true)}
                  >
                    {t("dashboardSidebar.pageShow.confirm")}
                  </button>
                )}

                {/* EDIT button -> toggles inline edit mode */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      if (editMode) {
                        exitEditMode();
                      } else {
                        enterEditMode();
                      }
                    }}
                    className="h-9 px-3 rounded-lg border text-sm transition-colors"
                    style={{ backgroundColor: background, borderColor, color: textColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverPrimary04; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = background; }}
                  >
                    {editMode ? t("common.cancel") : t("dashboardSidebar.pageShow.edit")}
                  </button>
                )}

                {/* DELETE button */}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteMode) {
                        // Cancel delete mode
                        setDeleteMode(false);
                        setSelectedFieldsToClear([]);
                        cancelClear();
                        setConfirmOpen(false);
                      } else {
                        setDeleteMode(true);
                        exitEditMode();
                      }
                    }}
                    className="h-9 px-3 rounded-lg border text-sm transition-colors"
                    style={{
                      backgroundColor: background,
                      borderColor: deleteMode
                        ? borderColor
                        : "rgba(239,68,68,0.35)", // couleur rouge
                      color: deleteMode
                        ? textColor
                        : "rgb(220,38,38)", // couleur rouge
                    }}
                    onMouseEnter={(e) => {
                      if (!deleteMode) {
                        e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; // rouge clair
                      } else {
                        e.currentTarget.style.backgroundColor = hoverPrimary04;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = background;
                    }}
                  >
                    {deleteMode ? t("common.cancel") : t("dashboardSidebar.pageShow.delete")}
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-5">
              {loading && (
                <div className="text-sm" style={{ color: hoverText07 }}>
                  {t("dashboardSidebar.pageShow.loading")}
                </div>
              )}

              {error && (
                <div className="text-sm" style={{ color: "rgb(220,38,38)" }}>
                  {t("dashboardSidebar.pageShow.error")} {error}
                </div>
              )}

              {!loading && !error && !data && (
                <div className="text-sm" style={{ color: hoverText07 }}>
                  {t("dashboardSidebar.pageShow.noData")}
                </div>
              )}

              {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MAIN */}
                  <div
                    className="rounded-xl border p-4"
                    style={{ borderColor, backgroundColor: hoverPrimary04 }}
                  >
                    <div className="text-sm font-medium mb-3">
                      {t("dashboardSidebar.pageShow.mainInfo")}
                    </div>

                    <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
                      {fields
                        .filter((f) => data[f.key] !== undefined)
                        .map((f) => {
                          const protectedField = isProtectedField(f.key);
                          const showClearCheckbox = deleteMode && !protectedField;
                          const showEditInput = editMode && !protectedField;

                          return (
                            <React.Fragment key={f.key}>
                              {/* label */}
                              <div className="font-medium flex items-center gap-2" style={{ color: hoverText07 }}>
                                <span className="inline-flex w-4 justify-center shrink-0">
                                  <input
                                    type="checkbox"
                                    className={[
                                      "h-4 w-4 transition-opacity",
                                      showClearCheckbox ? "opacity-100" : "opacity-0 pointer-events-none",
                                    ].join(" ")}
                                    checked={selectedFieldsToClear.includes(f.key)}
                                    onChange={() => toggleClearField(f.key)}
                                    tabIndex={showClearCheckbox ? 0 : -1}
                                    aria-hidden={!showClearCheckbox}
                                  />
                                </span>
                                {f.label}
                              </div>

                              {/* value / input */}
                              <div className="break-words">
                                {!showEditInput && (
                                  <span>{formatValue(f.kind, data[f.key])}</span>
                                )}

                                {showEditInput && (
                                  <div
                                    className={`${editableBoxClass} ${editableBoxIdle} ${editableBoxFocus}`}
                                    style={{
                                      borderColor,
                                      backgroundColor: background,
                                    }}
                                  >
                                    <input
                                      value={draft[f.key] ?? normalizeToString(data[f.key])}
                                      onChange={(e) => updateDraft(f.key, e.target.value)}
                                      className={editableInputClass}
                                      style={{ color: textColor }}
                                    />
                                    <span className={pencilIconClass} style={{ color: hoverText07 }}>
                                      {"\u270E"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </React.Fragment>
                          );
                        })}
                    </div>
                  </div>

                  {/* LANGUAGES */}
                  {meta?.languages && (
                    <div
                      className="rounded-xl border p-4"
                      style={{ borderColor, backgroundColor: hoverPrimary04 }}
                    >
                      <div className="text-sm font-medium mb-3">
                        {t("dashboardSidebar.pageShow.languages")}
                      </div>

                      <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
                        {LANGS.map((l) => {
                          const key = meta.languages?.[l.key];
                          if (!key) return null;
                          if (data[key] === undefined) return null;

                          const protectedField = isProtectedField(key);
                          const showClearCheckbox = deleteMode && !protectedField;
                          const showEditInput = editMode && !protectedField;

                          return (
                            <React.Fragment key={l.key}>
                              <div className="font-medium flex items-center gap-2" style={{ color: hoverText07 }}>
                                <span className="inline-flex w-4 justify-center shrink-0">
                                  <input
                                    type="checkbox"
                                    className={[
                                      "h-4 w-4 transition-opacity",
                                      showClearCheckbox ? "opacity-100" : "opacity-0 pointer-events-none",
                                    ].join(" ")}
                                    checked={selectedFieldsToClear.includes(key)}
                                    onChange={() => toggleClearField(key)}
                                    tabIndex={showClearCheckbox ? 0 : -1}
                                    aria-hidden={!showClearCheckbox}
                                  />
                                </span>
                                {t("dashboardSidebar.pageShow.text")} ({l.label})
                              </div>

                              <div>
                                {!showEditInput && (
                                  <div className="italic">{renderEmpty(data[key])}</div>
                                )}

                                {showEditInput && (
                                  <div
                                    className={`${editableBoxClass} ${editableBoxIdle} ${editableBoxFocus}`}
                                    style={{
                                      borderColor,
                                      backgroundColor: background,
                                    }}
                                  >
                                    <input
                                      value={draft[key] ?? normalizeToString(data[key])}
                                      onChange={(e) => updateDraft(key, e.target.value)}
                                      className={`${editableInputClass} italic`}
                                      style={{ color: textColor }}
                                    />
                                    <span className={pencilIconClass} style={{ color: hoverText07 }}>
                                      {"\u270E"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CHILDREN */}
          <div
            className="rounded-2xl border shadow-sm"
            style={{ borderColor, backgroundColor: background }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor }}>
              <h3 className="text-xl font-semibold">
                {t("dashboardSidebar.pageShow.children")}
              </h3>
              <div className="text-sm" style={{ color: hoverText07 }}>
                {t("dashboardSidebar.pageShow.childrenHint")}
              </div>
            </div>
            {meta?.children?.length ? (
              <div className="px-6 py-5 flex flex-col gap-6">
                {meta.children.map((child) => (
                  <ChildrenTable
                    key={child.key}
                    parentEntity={entity}
                    parentId={id}
                    child={child}
                  />
                ))}
              </div>
            ) : (
              <div className="px-6 py-5 text-sm" style={{ color: hoverText07 }}>
                {t("dashboardSidebar.pageShow.noChildren")}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <aside className="w-full lg:w-[360px] shrink-0">
          <div
            className="rounded-2xl border shadow-sm h-full"
            style={{ borderColor, backgroundColor: background }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor }}>
              <h3 className="text-xl font-semibold">
                {t("dashboardSidebar.pageShow.insights")}
              </h3>
              <div className="text-sm" style={{ color: hoverText07 }}>
                {t("dashboardSidebar.pageShow.insightsHint")}
              </div>
            </div>
            <div className="px-6 py-5 text-sm" style={{ color: hoverText07 }}>
              (À brancher plus tard)
            </div>
          </div>
        </aside>
      </div>

      {/* Errors */}
      {clearError && (
        <div className="text-sm mb-2" style={{ color: "rgb(220,38,38)" }}>
          {t("dashboardSidebar.pageShow.deleteError")} {clearError}
        </div>
      )}

      {editError && (
        <div className="text-sm mb-2" style={{ color: "rgb(220,38,38)" }}>
          {t("dashboardSidebar.pageShow.editError")} {editError}
        </div>
      )}

      {/* Confirm Delete modal */}
      <ConfirmModal
        open={confirmOpen}
        title={t("dashboardSidebar.pageShow.confirmDeleteTitle")}
        message={
          selectedFieldsToClear.length === 0
            ? t("dashboardSidebar.pageShow.noSelection")
            : t("dashboardSidebar.pageShow.confirmClearMessage", {
                fields: selectedFieldsToClear.join("\n- "),
              })
        }
        confirmLabel={
          clearLoading
            ? t("dashboardSidebar.pageShow.deleting")
            : t("dashboardSidebar.pageShow.delete")
        }
        cancelLabel={t("common.cancel")}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          const ok = await confirmClear();
          if (!ok) return;

          setConfirmOpen(false);
          setDeleteMode(false);
          setSelectedFieldsToClear([]);
          void load();
        }}
      />

      {/* Confirm EDIT modal */}
      <ConfirmModal
        open={confirmEditOpen}
        title={t("dashboardSidebar.pageShow.confirmEditTitle")}
        message={
          Object.keys(getChangedUpdates()).length === 0
            ? t("dashboardSidebar.pageShow.noSelection")
            : t("dashboardSidebar.pageShow.confirmEditMessage", {
                fields: Object.keys(getChangedUpdates()).join("\n- "),
              })
        }
        confirmLabel={
          editLoading 
            ? t("dashboardSidebar.pageShow.saving")
            : t("dashboardSidebar.pageShow.save")
        }
        cancelLabel={t("common.cancel")}
        onCancel={() => setConfirmEditOpen(false)}
        onConfirm={async () => {
          const updates = getChangedUpdates();
          if (Object.keys(updates).length === 0) return;

          const ok = await confirmEditWith({
            entity,
            filters: [{ field: "uid", value: id }],
            updates,
          });
          if (!ok) return;
          setConfirmEditOpen(false);
          exitEditMode();
          void load();
        }}
      />
    </div>
  );
}

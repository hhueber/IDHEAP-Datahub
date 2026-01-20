import React from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/shared/apiFetch";
import { useTheme } from "@/theme/useTheme";
import type { Entity, ShowResponse, ShowMetaField } from "@/features/pageShow/show_type";

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

export default function EntityShow({ id, entity, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, hoverText07, hoverPrimary06, } = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<ShowResponse["meta"]>(null);
  const [data, setData] = React.useState<ShowResponse["data"]>(null);
  const canEdit = meta?.actions?.can_edit ?? false;
  const canDelete = meta?.actions?.can_delete ?? false;

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

  const title =
    meta?.title_key && data?.[meta.title_key]
      ? String(data[meta.title_key])
      : `${entity} #${id}`;

  const fields = meta?.fields ?? [];

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
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit?.(entity, id)}
                    className="h-9 px-3 rounded-lg border text-sm transition-colors"
                    style={{
                      backgroundColor: background,
                      borderColor,
                      color: textColor,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = hoverPrimary04;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = background;
                    }}
                  >
                    {t("dashboardSidebar.pageShow.edit")}
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete?.(entity, id)}
                    className="h-9 px-3 rounded-lg border text-sm transition-colors"
                    style={{
                      backgroundColor: background,
                      borderColor: "rgba(239,68,68,0.35)",
                      color: "rgb(220,38,38)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = background;
                    }}
                  >
                    {t("dashboardSidebar.pageShow.delete")}
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
                        .map((f) => (
                          <React.Fragment key={f.key}>
                            <div className="font-medium" style={{ color: hoverText07 }}>
                              {f.label}
                            </div>
                            <div className="break-words">
                              {formatValue(f.kind, data[f.key])}
                            </div>
                          </React.Fragment>
                        ))}
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

                          return (
                            <React.Fragment key={l.key}>
                              <div className="font-medium" style={{ color: hoverText07 }}>
                                {t("dashboardSidebar.pageShow.text")} ({l.label})
                              </div>
                              <div className="italic">{renderEmpty(data[key])}</div>
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
            <div className="px-6 py-5 text-sm" style={{ color: hoverText07 }}>
              (À brancher plus tard via meta.children)
            </div>
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
    </div>
  );
}

import React, { useState } from "react";
import { PlaceOfInterestAPI, PlaceOfInterestDTO } from "@/services/placeOfInterest";
import PlaceOfInterestEditor from "./PlaceOfInterestEditor";
import { useConfigResource } from "../hooks/useConfigResource";
import { ConfirmModal } from "@/utils/ConfirmModal";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { loadThemeConfig } from "@/theme/themeStorage";
import { hexToRgba, getAdaptiveTextColor } from "@/utils/color";
import { useThemeMode } from "@/theme/ThemeContext";

const fmt4 = (x: number) => (Number.isFinite(x) ? x.toFixed(4) : "");

export default function ConfigPlaceOfInterestPage() {
  const { t } = useTranslation();
  const { items, loading, remove, reload } = useConfigResource<PlaceOfInterestDTO>(PlaceOfInterestAPI);
  const [editing, setEditing] = useState<PlaceOfInterestDTO | null>(null);
  const [creating, setCreating] = useState(false);

  const [placeOfInterestToDelete, setPlaceOfInterestToDelete] = useState<PlaceOfInterestDTO | null>(null);

  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const primary = (mode === "dark" ? cfg.colour_dark_primary : cfg.colour_light_primary) ?? cfg.colour_light_primary;
  const background = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  const textColor = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;
  const borderColor = (mode === "dark" ? cfg.colour_dark_secondary : cfg.colour_light_secondary) ?? cfg.colour_light_secondary;

  const submitTextColor = getAdaptiveTextColor(primary);
  const tableHeaderBg = hexToRgba(primary, 0.02);
  const rowBorderColor = borderColor;
  const emptyTextColor = hexToRgba(textColor, 0.7);
  const loadingTextColor = hexToRgba(textColor, 0.8);
  const editHoverBg = hexToRgba(primary, 0.06);

  const askDelete = (placeOfInterest: PlaceOfInterestDTO) => {
    if (!placeOfInterest.code) return;
    setPlaceOfInterestToDelete(placeOfInterest);
  };

  const confirmDelete = async () => {
    if (!placeOfInterestToDelete?.code) {
      setPlaceOfInterestToDelete(null);
      return;
    }
    await remove(placeOfInterestToDelete.code);
    setPlaceOfInterestToDelete(null);
  };

  const cancelDelete = () => {
    setPlaceOfInterestToDelete(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: textColor }}>{t("admin.config.placeOfInterestPage.title")}</h2>
        <button
          className="rounded-lg px-3 py-2 text-sm font-medium transition hover:opacity-90"
          style={{
            backgroundColor: primary,
            color: submitTextColor,
          }}
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          + {t("admin.config.placeOfInterestPage.addButton")}
        </button>
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: loadingTextColor }}><LoadingDots label={t("admin.config.placeOfInterestPage.loading")} /></div>
      ) : (
        <div className="overflow-x-auto border rounded-lg" 
          style={{
            backgroundColor: background,
            borderColor: borderColor,
          }}>
          <table className="min-w-full text-sm">
            <thead className="border-b"
              style={{
                backgroundColor: tableHeaderBg,
                borderColor: borderColor,
                color: textColor,
              }}>
              <tr>
                <th className="px-3 py-2 text-left">{t("admin.config.placeOfInterestPage.columns.name")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.placeOfInterestPage.columns.fr")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.placeOfInterestPage.columns.de")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.placeOfInterestPage.columns.it")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.placeOfInterestPage.columns.ro")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.placeOfInterestPage.columns.en")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.placeOfInterestPage.columns.position")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.code ?? c.default_name} className="border-t" style={{ borderColor: rowBorderColor }}>
                  <td className="px-3 py-2" style={{ color: textColor }}>{c.default_name}</td>
                  <td className="px-3 py-2" style={{ color: textColor }}>{c.name_fr || "—"}</td>
                  <td className="px-3 py-2" style={{ color: textColor }}>{c.name_de || "—"}</td>
                  <td className="px-3 py-2" style={{ color: textColor }}>{c.name_it || "—"}</td>
                  <td className="px-3 py-2" style={{ color: textColor }}>{c.name_ro || "—"}</td>
                  <td className="px-3 py-2" style={{ color: textColor }}>{c.name_en || "—"}</td>
                  <td className="px-3 py-2" style={{ color: textColor }}>
                    {fmt4(c.pos[0])}, {fmt4(c.pos[1])}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      className={`
                        px-2 py-1 rounded text-sm border transition
                        hover:[background-color:var(--poi-edit-hover-bg)]
                      `}
                      style={
                        {
                          backgroundColor: background,
                          borderColor: borderColor,
                          color: textColor,
                          "--poi-edit-hover-bg": editHoverBg,
                        } as React.CSSProperties
                      }
                      onClick={() => {
                        setEditing(c);
                        setCreating(false);
                      }}
                    >
                      {t("admin.config.placeOfInterestPage.edit")}
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white"
                      onClick={() => askDelete(c)}
                    >
                      {t("admin.config.placeOfInterestPage.delete")}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-6 text-center"
                    style={{ color: emptyTextColor }}
                  >
                    {t("admin.config.placeOfInterestPage.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <PlaceOfInterestEditor
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setCreating(false);
            setEditing(null);
            await reload();
          }}
        />
      )}

      {/* Modale de confirmation de suppression */}
      <ConfirmModal
        open={!!placeOfInterestToDelete}
        title={t("admin.config.placeOfInterestPage.titleConfirm")}
        message={
          placeOfInterestToDelete
            ? t("admin.config.placeOfInterestPage.deleteConfirm", {name: placeOfInterestToDelete.default_name,})
            : ""
        }
        confirmLabel={t("admin.config.placeOfInterestPage.confirmLabel")}
        cancelLabel={t("admin.config.placeOfInterestPage.cancelLabel")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

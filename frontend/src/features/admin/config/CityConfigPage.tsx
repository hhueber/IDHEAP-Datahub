import React, { useState } from "react";
import { CitiesAPI, CityDTO } from "@/services/cities";
import CityEditor from "./CityEditor";
import { useConfigResource } from "../hooks/useConfigResource";
import { ConfirmModal } from "@/utils/ConfirmModal";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";

const fmt4 = (x: number) => (Number.isFinite(x) ? x.toFixed(4) : "");

export default function ConfigCitiesPage() {
  const { t } = useTranslation();
  const { items, loading, remove, reload } = useConfigResource<CityDTO>(CitiesAPI);
  const [editing, setEditing] = useState<CityDTO | null>(null);
  const [creating, setCreating] = useState(false);

  const [cityToDelete, setCityToDelete] = useState<CityDTO | null>(null);

  const askDelete = (city: CityDTO) => {
    if (!city.code) return;
    setCityToDelete(city);
  };

  const confirmDelete = async () => {
    if (!cityToDelete?.code) {
      setCityToDelete(null);
      return;
    }
    await remove(cityToDelete.code);
    setCityToDelete(null);
  };

  const cancelDelete = () => {
    setCityToDelete(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("admin.config.citiesPage.title")}</h2>
        <button
          className="rounded-lg bg-black text-white px-3 py-2"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          + {t("admin.config.citiesPage.addButton")}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-700"><LoadingDots label={t("admin.config.citiesPage.loading")} /></div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">{t("admin.config.citiesPage.columns.name")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.citiesPage.columns.fr")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.citiesPage.columns.de")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.citiesPage.columns.it")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.citiesPage.columns.ro")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.citiesPage.columns.en")}</th>
                <th className="px-3 py-2 text-left">{t("admin.config.citiesPage.columns.position")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.code ?? c.default_name} className="border-t">
                  <td className="px-3 py-2">{c.default_name}</td>
                  <td className="px-3 py-2">{c.name_fr || "—"}</td>
                  <td className="px-3 py-2">{c.name_de || "—"}</td>
                  <td className="px-3 py-2">{c.name_it || "—"}</td>
                  <td className="px-3 py-2">{c.name_ro || "—"}</td>
                  <td className="px-3 py-2">{c.name_en || "—"}</td>
                  <td className="px-3 py-2">
                    {fmt4(c.pos[0])}, {fmt4(c.pos[1])}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      className="px-2 py-1 rounded bg-gray-100"
                      onClick={() => {
                        setEditing(c);
                        setCreating(false);
                      }}
                    >
                      {t("admin.config.citiesPage.edit")}
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white"
                      onClick={() => askDelete(c)}
                    >
                      {t("admin.config.citiesPage.delete")}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center text-gray-500 px-3 py-6"
                  >
                    {t("admin.config.citiesPage.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <CityEditor
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
        open={!!cityToDelete}
        title={t("admin.config.citiesPage.titleConfirm")}
        message={
          cityToDelete
            ? t("admin.config.citiesPage.deleteConfirm", {name: cityToDelete.default_name,})
            : ""
        }
        confirmLabel={t("admin.config.citiesPage.confirmLabel")}
        cancelLabel={t("admin.config.citiesPage.cancelLabel")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

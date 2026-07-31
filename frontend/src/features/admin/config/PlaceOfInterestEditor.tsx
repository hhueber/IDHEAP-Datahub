import React, { useState } from "react";
import { PlaceOfInterestDTO, PlaceOfInterestAPI } from "@/services/placeOfInterest";
import { GeoSuggestion, suggestGeo, getGeoPoint } from "@/services/geoSearch";
import { ConfigEditorModal } from "./ConfigEditorModal";
import AutocompleteField from "../components/AutocompleteField";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { useTheme } from "@/theme/useTheme";


const fmt4 = (x: number) => (Number.isFinite(x) ? x.toFixed(4) : "");
const round4 = (n: number) => Math.round(n * 10000) / 10000;

export default function PlaceOfInterestEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: PlaceOfInterestDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();

  const { textColor, background, borderColor, hoverText07 } = useTheme();

  const [form, setForm] = useState<PlaceOfInterestDTO>(
    () =>
      initial ?? {
        default_name: "",
        name_fr: "",
        name_de: "",
        name_it: "",
        name_ro: "",
        name_en: "",
        pos: [46.0, 7.0],
      }
  );
  const [saving, setSaving] = useState(false);

  // État du champ d’auto-complétion
  const [search, setSearch] = useState("");

  const onChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    const target = e.target;
    const { name } = target;

    // lat / lon
    if (name === "lat" || name === "lon") {
      const next = [...form.pos] as [number, number];
      const v = Number((target as HTMLInputElement).value);
      next[name === "lat" ? 0 : 1] = v;
      setForm({ ...form, pos: next });
      return;
    }

    // Checkbox générique
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm({ ...form, [name]: target.checked as any });
      return;
    }

    // Texte / nombre
    setForm({
      ...form,
      [name]: (target as HTMLInputElement | HTMLSelectElement).value,
    });
  };

  const onBlurRound = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!(name === "lat" || name === "lon")) return;
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    const next = [...form.pos] as [number, number];
    next[name === "lat" ? 0 : 1] = round4(v);
    setForm({ ...form, pos: next });
  };

  // Choisit une commune dans l'autocomplete
  const getGeoTypeLabel = (type: GeoSuggestion["type"]) => {
    if (type === "commune") return "Commune";
    if (type === "district") return "District";
    return "Canton";
  };

  const pickGeoSuggestion = async (item: GeoSuggestion) => {
    const r = await getGeoPoint(item.type, item.uid);

    const pos = r.data
      ? [round4(r.data.lat), round4(r.data.lon)]
      : form.pos;

    setForm({
      ...form,
      default_name: item.name || form.default_name,
      name_fr: item.name_fr ?? form.name_fr,
      name_de: item.name_de ?? form.name_de,
      name_it: item.name_it ?? form.name_it,
      name_ro: item.name_ro ?? form.name_ro,
      name_en: item.name_en ?? form.name_en,
      pos: pos as [number, number],
    });

    setSearch("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await PlaceOfInterestAPI.upsert(form); // Le backend génère 'code' si absent
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfigEditorModal
      title={initial ? t("admin.config.placeOfInterestEditor.titleEdit") : t("admin.config.placeOfInterestEditor.titleCreate")}
      isSaving={saving}
      onClose={onClose}
      onSubmit={onSubmit}
      submitLabel={initial ? t("admin.config.placeOfInterestEditor.submitEdit") : t("admin.config.placeOfInterestEditor.submitCreate")}
    >
      {/* Auto-complétion Communes : suggestions sous le champ */}
      <div className="p-3 rounded-lg border"
        style={{
          backgroundColor: background,
          borderColor: borderColor,
          color: textColor,
        }}>
        <div className="font-medium mb-2" style={{ color: textColor }}>{t("admin.config.placeOfInterestEditor.importFromCommunes")}</div>
        <AutocompleteField<GeoSuggestion>
          value={search}
          onChange={setSearch}
          minLength={3}
          debounceMs={250}
          placeholder={t("admin.config.placeOfInterestEditor.searchPlaceholder")}
          fetchItems={async (q) => {
            const r = await suggestGeo(q, 20);
            return r.data ?? [];
          }}
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium truncate" style={{ color: textColor }}>
                {item.name}
              </span>

              <span
                className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium"
                style={{
                  borderColor,
                  color: hoverText07,
                }}
              >
                {getGeoTypeLabel(item.type)}
              </span>
            </div>
          )}
          onPick={pickGeoSuggestion}
          renderLoading={() => (
            <LoadingDots label={t("admin.config.placeOfInterestEditor.search")} />
          )}
          renderEmpty={(q) =>
            q.trim().length >= 3 ? (
              <>{t("admin.config.placeOfInterestEditor.empty")}</>
            ) : null
          }
        />
      </div>

      {/* Form principal */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("admin.config.placeOfInterestEditor.canonicalLabel")}</label>
        <input
          name="default_name"
          value={form.default_name}
          onChange={onChange}
          className="w-full rounded-lg border px-3 py-2"
          style={{
            backgroundColor: background,
            borderColor: borderColor,
            color: textColor,
          }}
          placeholder="Lausanne, Genève, Zürich…"
          required
        />
      </div>

      {/* Traductions éditables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.config.placeOfInterestEditor.labels.fr")}</label>
          <input
            name="name_fr"
            value={form.name_fr || ""}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              borderColor: borderColor,
              color: textColor,
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.config.placeOfInterestEditor.labels.de")}</label>
          <input
            name="name_de"
            value={form.name_de || ""}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              borderColor: borderColor,
              color: textColor,
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.config.placeOfInterestEditor.labels.it")}</label>
          <input
            name="name_it"
            value={form.name_it || ""}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              borderColor: borderColor,
              color: textColor,
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.config.placeOfInterestEditor.labels.ro")}</label>
          <input
            name="name_ro"
            value={form.name_ro || ""}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              borderColor: borderColor,
              color: textColor,
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.config.placeOfInterestEditor.labels.en")}</label>
          <input
            name="name_en"
            value={form.name_en || ""}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              borderColor: borderColor,
              color: textColor,
            }}
          />
        </div>
      </div>

      {/* Position (arrondi visuel à 4 décimales sinon trop long) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.config.placeOfInterestEditor.labels.lat")}</label>
          <input
            type="number"
            step="0.0001"
            name="lat"
            value={form.pos[0]}
            onChange={onChange}
            onBlur={onBlurRound}
            className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              borderColor: borderColor,
              color: textColor,
            }}
            required
          />
          <div className="text-xs mt-1" style={{ color: hoverText07 }}>
            {t("admin.config.placeOfInterestEditor.labels.preview")} {fmt4(form.pos[0])}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("admin.config.placeOfInterestEditor.labels.lon")}</label>
          <input
            type="number"
            step="0.0001"
            name="lon"
            value={form.pos[1]}
            onChange={onChange}
            onBlur={onBlurRound}
            className="w-full rounded-lg border px-3 py-2"
            style={{
              backgroundColor: background,
              borderColor: borderColor,
              color: textColor,
            }}
            required
          />
          <div className="text-xs mt-1" style={{ color: hoverText07 }}>
            {t("admin.config.placeOfInterestEditor.labels.preview")} {fmt4(form.pos[1])}
          </div>
        </div>
      </div>
    </ConfigEditorModal>
  );
}

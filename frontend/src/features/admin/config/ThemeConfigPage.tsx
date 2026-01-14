import React, { useEffect, useState, DragEvent, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchThemeConfig,
  saveThemeConfig,
  ThemeConfigDto,
  ThemeMode,
  uploadThemeLogo,
} from "@/services/config";
import LoadingDots from "@/utils/LoadingDots";
import { ConfirmModal } from "@/utils/ConfirmModal";
import { useTheme } from "@/theme/useTheme";
import { resolveAssetUrl } from "@/shared/apiFetch";
import { PresetsSection, Preset } from "@/features/admin/components/theme/PresetsSection";
import { ThemeColorsSection } from "@/features/admin/components/theme/ThemeColorsSection";
import { MapColorsSection } from "@/features/admin/components/theme/MapColorsSection";
import {
  SaveState,
  LIGHT_FIELDS,
  DARK_FIELDS,
  MAP_LIGHT_FIELDS,
  MAP_DARK_FIELDS,
  PRESETS,
} from "@/features/admin/components/theme/themeConfigMeta";


export default function ThemeConfigPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<ThemeConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLogoDataUrl, setPendingLogoDataUrl] = useState<string | null>(null);

  const { primary, textColor, background, borderColor, adaptiveTextColorPrimary, logoBackground, hoverText05 } = useTheme();

  // Charger la config au montage
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const data = await fetchThemeConfig();
        if (!cancelled) {
          setConfig({
            theme_default_mode: "light",
            ...data,
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(t("admin.config.themeConfigPage.loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const updateField = (key: keyof ThemeConfigDto, value: string | null) => {
    setConfig((prev) => {
      if (!prev) return { [key]: value } as ThemeConfigDto;
      return { ...prev, [key]: value };
    });
  };

  const applyPreset = (preset: Preset) => {
    setConfig((prev) => {
      const base: ThemeConfigDto = {
        theme_default_mode: prev?.theme_default_mode ?? "light",
        ...prev,
      };
      return {
        ...base,
        ...preset.light,
        ...preset.dark,
      };
    });
  };

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.onabort = () => reject(new Error("File reading was aborted"));
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result); // "data:image/...;base64,...."
        } else {
          reject(new Error("Unexpected FileReader result"));
        }
      };
      reader.readAsDataURL(file);
    });
  }

  const handleLogoUrlDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain");

    // Cas 1 : URL directe -> pas d'upload backend
    if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/"))) {
      setPendingLogoDataUrl(null);
      updateField("logo_url", text.trim());
      return;
    }

    // Cas 2 : fichier
    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setPendingLogoDataUrl(dataUrl);
      } catch (err) {
        console.error(err);
        setError(t("admin.config.themeConfigPage.logoUploadError"));
      }
    }
  };

  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPendingLogoDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
      setError(t("admin.config.themeConfigPage.logoUploadError"));
    }
  };

  const preventDefault = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onSave = async () => {
    if (!config) return;
    setConfirmOpen(false);
    setSaveState("saving");
    setError(null);

    try {
      let cfgToSave: ThemeConfigDto = { ...config };

      if (pendingLogoDataUrl) {
        const uploadedUrl = await uploadThemeLogo(pendingLogoDataUrl);
        cfgToSave = { ...cfgToSave, logo_url: uploadedUrl };
      }

      await saveThemeConfig(cfgToSave);
      setConfig(cfgToSave);
      setPendingLogoDataUrl(null);
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch (e: any) {
      console.error(e);
      setError(t("admin.config.themeConfigPage.saveError"));
      setSaveState("error");
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm">
          <LoadingDots label={t("common.loading")} />
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-600">
          {error ?? t("admin.config.themeConfigPage.loadError")}
        </p>
      </div>
    );
  }

  const defaultMode: ThemeMode = config.theme_default_mode || "light";

  const previewUrl =
    pendingLogoDataUrl ??
    (config.logo_url ? resolveAssetUrl(config.logo_url) : undefined);

  const mapLightFieldsWithLabels = MAP_LIGHT_FIELDS.map((f) => ({
    key: f.key,
    label: t(f.labelKey),
  }));
  const mapDarkFieldsWithLabels = MAP_DARK_FIELDS.map((f) => ({
    key: f.key,
    label: t(f.labelKey),
  }));

  const lightFieldsWithLabels = LIGHT_FIELDS.map((f) => ({
    key: f.key,
    label: t(f.labelKey),
  }));
  const darkFieldsWithLabels = DARK_FIELDS.map((f) => ({
    key: f.key,
    label: t(f.labelKey),
  }));

  return (
    <div
      className="p-4 md:p-6 max-w-5xl mx-auto"
      style={{ backgroundColor: background, color: textColor }}
    >
      <h1 className="text-2xl font-semibold mb-4">
        {t("admin.config.themeConfigPage.title")}
      </h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Informations générales */}
      <div
        className="mb-6 rounded-xl border p-4 md:p-5 space-y-4"
        style={{ backgroundColor: hoverText05, borderColor: borderColor }}
      >
        <h2 className="text-lg font-semibold mb-2">
          {t("admin.config.themeConfigPage.general")}
        </h2>

        <div className="space-y-4">
          {/* Nom d'instance */}
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="w-48 text-sm font-medium">
              {t("admin.config.themeConfigPage.instanceName")}
            </label>
            <input
              type="text"
              className="flex-1 rounded border px-3 py-2 text-sm"
              style={{
                backgroundColor: background,
                borderColor,
                color: textColor,
              }}
              value={config.instance_name ?? ""}
              onChange={(e) => updateField("instance_name", e.target.value)}
            />
          </div>

          {/* Logo URL + upload */}
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">
                {t("admin.config.themeConfigPage.logoUrl")}
              </label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: background,
                  borderColor,
                  color: textColor,
                }}
                placeholder="https://example.com/logo.png"
                value={config.logo_url ?? ""}
                onChange={(e) => updateField("logo_url", e.target.value)}
              />
              {previewUrl ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs opacity-70">
                    {t("admin.config.themeConfigPage.logoPreview")}
                  </span>
                  <img
                    src={previewUrl}
                    alt="logo preview"
                    className="h-10 max-w-[160px] object-contain border rounded"
                    style={{ backgroundColor: logoBackground }}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">
                {t("admin.config.themeConfigPage.logoUpload")}
              </label>
              <div
                className="flex flex-col items-center justify-center border rounded-lg px-3 py-4 text-xs text-center cursor-pointer"
                style={{ borderColor: borderColor }}
                onDrop={handleLogoUrlDrop}
                onDragOver={preventDefault}
                onDragEnter={preventDefault}
                onDragLeave={preventDefault}
              >
                <p className="mb-2">
                  {t("admin.config.themeConfigPage.logoDropZone")}
                </p>
                <p className="mb-2 opacity-70">
                  {t("admin.config.themeConfigPage.logoDropHint")}
                </p>
                <label
                  className="inline-flex items-center justify-center rounded-md border px-3 py-1 text-xs font-medium"
                  style={{ borderColor }}
                >
                  <span>{t("admin.config.themeConfigPage.logoBrowse")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Mode par défaut */}
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="w-48 text-sm font-medium">
              {t("admin.config.themeConfigPage.defaultMode")}
            </span>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="theme_default_mode"
                  value="light"
                  checked={defaultMode === "light"}
                  onChange={() => updateField("theme_default_mode", "light")}
                />
                <span>{t("admin.config.themeConfigPage.light")}</span>
              </label>
              <label className="inline-flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="theme_default_mode"
                  value="dark"
                  checked={defaultMode === "dark"}
                  onChange={() => updateField("theme_default_mode", "dark")}
                />
                <span>{t("admin.config.themeConfigPage.dark")}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <PresetsSection
        presets={PRESETS}
        cardBg={hoverText05}
        cardBorder={borderColor}
        title={t("admin.config.themeConfigPage.presets")}
        helpText={t("admin.config.themeConfigPage.presetsHelp")}
        onApplyPreset={applyPreset}
      />

      {/* Couleurs Light */}
      <ThemeColorsSection
        variant="light"
        title={t("admin.config.themeConfigPage.lightSection")}
        fields={lightFieldsWithLabels}
        config={config}
        onFieldChange={(key, val) => updateField(key, val)}
        background={background}
        cardBg={hoverText05}
        cardBorder={borderColor}
        textColor={textColor}
      />

      {/* Couleurs Dark */}
      <ThemeColorsSection
        variant="dark"
        title={t("admin.config.themeConfigPage.darkSection")}
        fields={darkFieldsWithLabels}
        config={config}
        onFieldChange={(key, val) => updateField(key, val)}
        background={background}
        cardBg={hoverText05}
        cardBorder={borderColor}
        textColor={textColor}
      />

      {/* Couleurs carte */}
      <div
        className="mb-6 rounded-xl border p-4 md:p-5 space-y-4"
        style={{ backgroundColor: hoverText05, borderColor: borderColor }}
      >
        <h2 className="text-lg font-semibold">
          {t("admin.config.themeConfigPage.mapSection")}
        </h2>

        <div className="space-y-6">
          <MapColorsSection
            title={t("admin.config.themeConfigPage.light")}
            variant="light"
            fields={mapLightFieldsWithLabels}
            config={config}
            onFieldChange={(key, val) => updateField(key, val)}
            background={background}
            cardBg={hoverText05}
            cardBorder={borderColor}
            textColor={textColor}
          />
          <MapColorsSection
            title={t("admin.config.themeConfigPage.dark")}
            variant="dark"
            fields={mapDarkFieldsWithLabels}
            config={config}
            onFieldChange={(key, val) => updateField(key, val)}
            background={background}
            cardBg={hoverText05}
            cardBorder={borderColor}
            textColor={textColor}
          />
        </div>
      </div>

      {/* Boutons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        <button
          type="button"
          disabled={saveState === "saving"}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          style={{
            backgroundColor: primary,
            borderColor: primary,
            color: adaptiveTextColorPrimary,
          }}
        >
          {saveState === "saving" ? (
            <LoadingDots label={t("admin.config.themeConfigPage.saving")} />
          ) : (
            t("admin.config.themeConfigPage.save")
          )}
        </button>
      </div>

      {/* Zone fixe pour les messages de statut */}
      <div className="mt-1 flex justify-end">
        <div className="min-h-[1.25rem] text-xs flex items-center">
          {saveState === "success" && (
            <span className="text-green-600">
              {t("admin.config.themeConfigPage.saved")}
            </span>
          )}
          {saveState === "error" && (
            <span className="text-red-600">
              {t("admin.config.themeConfigPage.saveError")}
            </span>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={t("admin.config.themeConfigPage.confirmTitle")}
        message={t("admin.config.themeConfigPage.confirmMessage")}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={onSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

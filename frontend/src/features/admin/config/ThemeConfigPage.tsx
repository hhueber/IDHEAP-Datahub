import React, { useEffect, useRef, useState, DragEvent, ChangeEvent } from "react";
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
import { saveThemeConfig as saveThemeConfigToStorage } from "@/theme/themeStorage";
import { useThemeMode } from "@/theme/ThemeContext";


export default function ThemeConfigPage() {
  const { t } = useTranslation();
  // État principal : config chargée depuis le backend (ou fallback local).
  const [config, setConfig] = useState<ThemeConfigDto | null>(null);
  // États UI : chargement / sauvegarde / erreurs / confirmation.
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Data URL en attente : on n’envoie le fichier au backend qu’au moment de sauvegarder.
  const [pendingLogoDataUrl, setPendingLogoDataUrl] = useState<string | null>(null);

  const { primary, textColor, background, borderColor, adaptiveTextColorPrimary, logoBackground, hoverText05, hoverPrimary10, hoverPrimary15, cfg } = useTheme();
  // Logo actuel en cache (thème local) pour fallback si le backend ne renvoie rien.
  const logoUrlRaw = cfg.logo_url;
  // Permet de rafraîchir le thème après sauvegarde (ex: reload des tokens/couleurs).
  const { refreshTheme } = useThemeMode();

  // Drag and drop logo
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
            // si le backend ne renvoie rien, on initialise depuis le localStorage (ou default)
            logo_url:
                (data.logo_url ?? "").trim()
                ? data.logo_url
                : ((logoUrlRaw ?? "").trim() ? logoUrlRaw : DEFAULT_LOGO),
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
  }, [t, logoUrlRaw]);

  // Met à jour un champ de la config sans écraser le reste.
  const updateField = (key: keyof ThemeConfigDto, value: string | null) => {
    setConfig((prev) => {
      if (!prev) return { [key]: value } as ThemeConfigDto;
      return { ...prev, [key]: value };
    });
  };

  // Applique un preset (light+dark) sur l’objet config en conservant le mode par défaut.
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

  const MAX_LOGO_MB = 3;
  const ACCEPTED_MIME = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

  // Valide un fichier logo (type + tailles)
  function validateLogoFile(file: File): string | null {
    if (!ACCEPTED_MIME.includes(file.type)) {
      return t("admin.config.themeConfigPage.logoInvalidType");
    }
    const maxBytes = MAX_LOGO_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return t("admin.config.themeConfigPage.logoTooLarge", {size: MAX_LOGO_MB});
    }
    return null;
  }

  // Convertit un fichier en data URL (data:image/...;base64,...) pour preview et upload.
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

  // Gestion du drag & drop logo
  const handleLogoUrlDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragActive(false);
    setIsDragReject(false);

    const text = e.dataTransfer.getData("text/plain");

    // Cas 1 : URL directe -> pas d'upload backend
    if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/"))) {
        setPendingLogoDataUrl(null);
        updateField("logo_url", text.trim());
        return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
        const err = validateLogoFile(file);
        if (err) {
        setError(err);
        return;
        }

        try {
        const dataUrl = await readFileAsDataUrl(file);
        setPendingLogoDataUrl(dataUrl);
        setError(null);
        } catch (err) {
        console.error(err);
        setError(t("admin.config.themeConfigPage.logoUploadError"));
        }
    }
  };

  // Cas sélection fichier via input.
  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const err = validateLogoFile(file);
    if (err) {
        setError(err);
        e.target.value = ""; // permet de re-choisir le même fichier
        return;
    }

    try {
        const dataUrl = await readFileAsDataUrl(file);
        setPendingLogoDataUrl(dataUrl);
        setError(null);
    } catch (err) {
        console.error(err);
        setError(t("admin.config.themeConfigPage.logoUploadError"));
    } finally {
        e.target.value = "";
    }
  };

  // Empêche le navigateur d’ouvrir le fichier quand on drop.
  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragActive(true);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
        const err = validateLogoFile(file);
        setIsDragReject(!!err);
    } else {
        // Si c'est juste du texte/URL, pas un reject
        setIsDragReject(false);
    }
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
    };

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Quand on quitte la zone
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;

    setIsDragActive(false);
    setIsDragReject(false);
  };

  // Sauvegarde
  const onSave = async () => {
    if (!config) return;
    setConfirmOpen(false);
    setSaveState("saving");
    setError(null);

    try {
        let cfgToSave: ThemeConfigDto = { ...config };

        // Si un nouveau logo est en attente, on l’upload d’abord puis on remplace logo_url.
        if (pendingLogoDataUrl) {
            const uploadedUrl = await uploadThemeLogo(pendingLogoDataUrl);
            cfgToSave = { ...cfgToSave, logo_url: uploadedUrl };
        }
        // Enregistre la config côté backend.
        const res = await saveThemeConfig(cfgToSave);
        // Recharge depuis backend pour être sûr d’avoir la source de vérité.
        const fresh = await fetchThemeConfig();
        const freshCfg = { ...cfgToSave, ...fresh };

        // Met à jour l’UI + reset l’upload pending.
        setConfig(freshCfg);
        setPendingLogoDataUrl(null);
        // Met à jour le localStorage et rafraîchit le thème appliqué.
        saveThemeConfigToStorage(freshCfg as any);
        refreshTheme();

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

  // Logo par défaut local (fallback final).
  const DEFAULT_LOGO = "/img/idheap-dh.png";
  // Logo brut tel que stocké (peut être vide, URL absolue, chemin relatif...).
  const rawLogo = (config.logo_url ?? "").trim();

  // Résout correctement les chemins (URL absolue, static backend, ou asset local).
  const resolvedLogo =
    !rawLogo
      ? DEFAULT_LOGO
      : rawLogo.startsWith("http://") || rawLogo.startsWith("https://")
        ? rawLogo
        : rawLogo.startsWith("/static/")
          ? resolveAssetUrl(rawLogo)
          : rawLogo.startsWith("/")
            ? rawLogo
            : resolveAssetUrl(rawLogo);
  // La preview prend priorité sur tout le reste.
  const previewUrl = pendingLogoDataUrl ?? resolvedLogo;

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
        style={{ backgroundColor: background, borderColor: borderColor }}
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
              {/* Preview du logo final (URL résolue ou data URL pending) */}
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

            {/* Dropzone upload */}
            <div className="flex-1 space-y-2"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}>
                <label className="text-sm font-medium">
                    {t("admin.config.themeConfigPage.logoUpload")}
                </label>

                <div
                    className={[
                    "relative flex flex-col items-center justify-center rounded-xl px-4 py-5 text-center cursor-pointer",
                    "border transition-all duration-200 select-none",
                    isDragActive ? "scale-[1.01]" : "scale-100",
                    ].join(" ")}
                    style={{
                    borderColor: isDragReject ? "#ef4444" : (isDragActive ? primary : borderColor), // #ef4444 = rouge Tailwind (utiliser pour erreur)
                    backgroundColor: isDragActive ? hoverPrimary10 : "transparent",
                    boxShadow: isDragActive ? `0 0 0 3px ${hoverPrimary15}` : "none",
                    }}
                    onDrop={handleLogoUrlDrop}
                    onDragEnter={onDragEnter}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    role="button"
                    tabIndex={0}
                    aria-label={t("admin.config.themeConfigPage.logoDropZone")}
                >
                    {/* Overlay message quand on drag */}
                    {isDragActive && (
                    <div
                        className={[
                            "absolute inset-0 rounded-xl flex items-center justify-center",
                            "transition-all duration-200",
                            "pointer-events-none",
                            isDragActive ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
                        ].join(" ")}
                        style={{
                            backgroundColor: hoverPrimary10,
                        }}
                        aria-hidden
                        >
                        <div
                            className="rounded-full px-4 py-2 text-sm font-semibold border shadow-sm"
                            style={{
                            borderColor: isDragReject ? "#ef4444" : primary, // #ef4444 = rouge Tailwind (utiliser pour erreur)
                            color: isDragReject ? "#ef4444" : primary, // #ef4444 = rouge Tailwind (utiliser pour erreur)
                            backgroundColor: background,
                            }}
                        >
                            {isDragReject
                            ? t("admin.config.themeConfigPage.logoDropReject")
                            : t("admin.config.themeConfigPage.logoDropActive")}
                        </div>
                    </div>
                    )}
                    <div
                        className={[
                            "transition-opacity duration-200",
                            "flex flex-col items-center justify-center text-center",
                            isDragActive ? "opacity-0" : "opacity-100",
                        ].join(" ")}
                    >

                        <p className="text-xs opacity-80">
                        {t("admin.config.themeConfigPage.logoDropZone")}
                        </p>
                        <p className="mt-1 text-xs opacity-60">
                        {t("admin.config.themeConfigPage.logoDropHint")}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                        <label
                            className="inline-flex items-center justify-center rounded-md border px-3 py-1 text-xs font-medium transition hover:opacity-90"
                            style={{
                            borderColor: borderColor,
                            color: textColor,
                            backgroundColor: isDragActive ? "transparent" : hoverPrimary10,
                            }}
                        >
                            <span>{t("admin.config.themeConfigPage.logoBrowse")}</span>
                            <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoFileChange}
                            />
                        </label>

                        {pendingLogoDataUrl && (
                            <button
                            type="button"
                            className="text-xs underline opacity-80 hover:opacity-100"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setPendingLogoDataUrl(null)}}
                            >
                            {t("common.clear")}
                            </button>
                        )}
                        </div>

                        <div className="mt-2 text-[11px] opacity-60">
                            {t("admin.config.themeConfigPage.logoFormats", {size: MAX_LOGO_MB})}
                        </div>
                    </div>
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
        cardBg={background}
        cardBorder={borderColor}
        title={t("admin.config.themeConfigPage.presets")}
        helpText={t("admin.config.themeConfigPage.presetsHelp")}
        onApplyPreset={applyPreset}
      />

      {/* Couleurs Light */}
      <ThemeColorsSection
        variant="light"
        logoUrl={previewUrl}
        title={t("admin.config.themeConfigPage.lightSection")}
        fields={lightFieldsWithLabels}
        config={config}
        onFieldChange={(key, val) => updateField(key, val)}
        background={background}
        logoBackground={logoBackground}
        cardBg={hoverText05}
        cardBorder={borderColor}
        textColor={textColor}
      />

      {/* Couleurs Dark */}
      <ThemeColorsSection
        variant="dark"
        logoUrl={previewUrl}
        title={t("admin.config.themeConfigPage.darkSection")}
        fields={darkFieldsWithLabels}
        config={config}
        onFieldChange={(key, val) => updateField(key, val)}
        background={background}
        logoBackground={logoBackground}
        cardBg={hoverText05}
        cardBorder={borderColor}
        textColor={textColor}
      />

      {/* Couleurs carte */}
      <div
        className="mb-6 rounded-xl border p-4 md:p-5 space-y-4"
        style={{ backgroundColor: background, borderColor: borderColor }}
      >
        <h2 className="text-lg font-semibold">
          {t("admin.config.themeConfigPage.mapSection")}
        </h2>

        <div className="space-y-6">
          {/* Carte - Light */}
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
          {/* Carte - Dark */}
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

      {/* Confirmation avant d’écrire la config */}
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

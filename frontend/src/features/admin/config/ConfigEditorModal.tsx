import React from "react";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { loadThemeConfig } from "@/theme/themeStorage";
import { hexToRgba, getAdaptiveTextColor } from "@/utils/color";
import { useThemeMode } from "@/theme/ThemeContext";

type ConfigEditorModalProps = {
  title: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  children: React.ReactNode;
};

/**
 * Shell générique pour tous les écrans d’édition de config
 * (villes, couleurs, images...).
 */
export function ConfigEditorModal({
  title,
  isSaving,
  onClose,
  onSubmit,
  submitLabel,
  children,
}: ConfigEditorModalProps) {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const primary = (mode === "dark" ? cfg.colour_dark_primary : cfg.colour_light_primary) ?? cfg.colour_light_primary;
  const secondary = (mode === "dark" ? cfg.colour_dark_secondary : cfg.colour_light_secondary) ?? cfg.colour_light_secondary;
  const background = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  const textColor = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;

  // Overlay derrière la modal (au lieu de bg-black/30)
  const overlayBg = hexToRgba(textColor, 0.30);

  // Couleurs des boutons
  const submitTextColor = getAdaptiveTextColor(primary);
  const cancelHoverBg = hexToRgba(primary, 0.05);
  const submitHoverBg = hexToRgba(primary, 0.90);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center"
      style={{ backgroundColor: overlayBg }}
    >
      <div
        className="
          w-full max-w-3xl mx-2 sm:mx-4 mt-4 sm:mt-0
          rounded-none sm:rounded-xl shadow-xl
          p-4 sm:p-6 max-h-[90vh] overflow-y-auto border
        "
        style={{
          backgroundColor: background,
          color: textColor,
          borderColor: secondary,
        }}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: textColor }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm transition hover:[color:var(--config-close-hover)]"
            style={
              {
                color: textColor,
                "--config-close-hover": primary,
              } as React.CSSProperties
            }
          >
            {/* croix pour fermeture de la modal */}
            {"\u00D7"}
          </button>
        </div>

        {/* form */}
        <form className="space-y-4" onSubmit={onSubmit}>
          {children}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border text-sm transition hover:[background-color:var(--config-cancel-hover-bg)]"
              style={
                {
                  borderColor: secondary,
                  color: textColor,
                  backgroundColor: background,
                  "--config-cancel-hover-bg": cancelHoverBg,
                } as React.CSSProperties
              }
            >
              {t("admin.config.configEditor.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition hover:[background-color:var(--config-submit-hover-bg)]"
              style={
                {
                  backgroundColor: primary,
                  color: submitTextColor,
                  "--config-submit-hover-bg": submitHoverBg,
                } as React.CSSProperties
              }
            >
              {isSaving ? (
                <span aria-live="polite">
                  <LoadingDots label={t("admin.config.configEditor.saving")} />
                </span>
              ) : (
                submitLabel ?? t("admin.config.configEditor.submit")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// petite modale pour confirmer la suppression 
import React from "react";
import { loadThemeConfig } from "@/theme/themeStorage";
import { hexToRgba } from "@/utils/color";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const cfg = loadThemeConfig();
  const primary = cfg.colour_light_primary;
  const background = cfg.colour_light_background;
  const textColor = cfg.colour_light_text;
  const borderColor = cfg.colour_light_secondary;

  // overlay léger basé sur la couleur de texte
  const overlayBg = hexToRgba(textColor, 0.3);
  // hover pour le bouton "Annuler"
  const cancelHoverBg = hexToRgba(primary, 0.06);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: overlayBg }}>
      <div className="w-full max-w-md rounded-xl shadow-xl p-6 border"
        style={{
          backgroundColor: background,
          borderColor: borderColor,
          color: textColor,
        }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: textColor }}>{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm transition hover:[color:var(--confirm-close-hover-color)]"
            style={
              {
                color: textColor,
                "--confirm-close-hover-color": primary,
              } as React.CSSProperties
            }
          >
            {/* Croix de fermeture */}
            {"\u00D7"}
          </button>
        </div>

        <p className="text-sm mb-6 whitespace-pre-line"
          style={{ color: textColor }}>
          {message}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="
              px-3 py-2 rounded-lg border text-sm
              transition hover:[background-color:var(--confirm-cancel-hover-bg)]
            "
            style={
              {
                backgroundColor: background,
                borderColor: borderColor,
                color: textColor,
                "--confirm-cancel-hover-bg": cancelHoverBg,
              } as React.CSSProperties
            }
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:opacity-90 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

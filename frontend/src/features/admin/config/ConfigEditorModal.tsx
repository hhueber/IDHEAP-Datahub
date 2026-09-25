import React from "react";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import { Button, ModalShell } from "@/utils/UI";
import { useTheme } from "@/theme/useTheme";

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

  const { primary, adaptiveTextColorPrimary, hoverPrimary90 } = useTheme();

  return (
    <ModalShell
      title={title}
      titleClassName="text-xl font-semibold"
      onClose={onClose}
      overlayClassName="items-start sm:items-center"
      className="
        w-full max-w-3xl mx-2 sm:mx-4 mt-4 sm:mt-0
        rounded-none sm:rounded-xl
        p-4 sm:p-6 max-h-[90vh] overflow-y-auto
      "
    >
      {/* form */}
      <form className="space-y-4" onSubmit={onSubmit}>
        {children}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("admin.config.configEditor.cancel")}
          </Button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition hover:[background-color:var(--config-submit-hover-bg)]"
            style={
              {
                backgroundColor: primary,
                color: adaptiveTextColorPrimary,
                "--config-submit-hover-bg": hoverPrimary90,
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
    </ModalShell>
  );
}

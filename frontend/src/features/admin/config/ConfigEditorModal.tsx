import React from "react";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";

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
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex 
                items-start sm:items-center justify-center"
    >
      <div
        className=" bg-white w-full max-w-3xl mx-2 sm:mx-4 mt-4 sm:mt-0 rounded-none sm:rounded-xl shadow-xl
                    p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
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
              className="px-3 py-2 rounded-lg border"
            >
              {t("admin.config.configEditor.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-2 rounded-lg bg-black text-white disabled:opacity-60"
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

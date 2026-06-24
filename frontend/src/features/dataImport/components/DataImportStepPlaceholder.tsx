import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type { DataImportWorkflowStep } from "@/features/dataImport/dataImportWorkflowTypes";

type DataImportStepPlaceholderProps = {
  step: Exclude<DataImportWorkflowStep, "explore">;
};

export function DataImportStepPlaceholder({
  step,
}: DataImportStepPlaceholderProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  return (
    <section
      className="rounded-3xl border p-6"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div
        className="mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
        style={{ borderColor, backgroundColor: hoverPrimary04, color: primary }}
      >
        {t(`dataImport.workflow.${step}.title`)}
      </div>

      <h2 className="text-xl font-semibold">
        {t(`dataImport.workflow.${step}.placeholderTitle`)}
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 opacity-70">
        {t(`dataImport.workflow.${step}.placeholderDescription`)}
      </p>
    </section>
  );
}

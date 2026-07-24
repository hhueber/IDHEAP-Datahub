import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type { DataImportWorkflowStep } from "@/features/dataImport/dataImportWorkflowTypes";

type DataImportStepTabsProps = {
  activeStep: DataImportWorkflowStep;
  disabled?: boolean;
  onChange: (step: DataImportWorkflowStep) => void;
};

const STEPS: {
  key: DataImportWorkflowStep;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    key: "explore",
    labelKey: "dataImport.workflow.explore.title",
    descriptionKey: "dataImport.workflow.explore.description",
  },
  {
    key: "improve",
    labelKey: "dataImport.workflow.improve.title",
    descriptionKey: "dataImport.workflow.improve.description",
  },
  {
    key: "validate",
    labelKey: "dataImport.workflow.validate.title",
    descriptionKey: "dataImport.workflow.validate.description",
  },
];

export function DataImportStepTabs({
  activeStep,
  disabled = false,
  onChange,
}: DataImportStepTabsProps) {
  const { t } = useTranslation();
  const { textColor, background, borderColor, hoverPrimary04, primary } = useTheme();

  return (
    <section
      className="rounded-3xl border p-3 sm:p-4"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const active = activeStep === step.key;

          return (
            <button
              key={step.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(step.key)}
              className="rounded-2xl border p-4 text-left transition hover:-translate-y-[1px] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: active ? primary : borderColor,
                backgroundColor: active ? hoverPrimary04 : background,
                color: active ? primary : textColor,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                  style={{
                    borderColor: active ? primary : borderColor,
                    backgroundColor: active ? background : hoverPrimary04,
                  }}
                >
                  {index + 1}
                </span>

                <div>
                  <div className="font-semibold">
                    {t(step.labelKey)}
                  </div>

                  <p className="mt-1 text-xs leading-5 opacity-70">
                    {t(step.descriptionKey)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

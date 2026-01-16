import React from "react";
import { ThemeConfigDto } from "@/services/config";
import { ColorField } from "./ColorField";
import { ThemePreviewPanel } from "@/features/admin/components/theme/ThemePreviewPanels";

type ColorFieldDef = {
  key: keyof ThemeConfigDto;
  label: string;
};

type ThemeColorsSectionProps = {
  variant: "light" | "dark";
  logoUrl?: string;
  title: string;
  fields: ColorFieldDef[];
  config: ThemeConfigDto;
  onFieldChange: (key: keyof ThemeConfigDto, value: string) => void;
  background: string;
  logoBackground: string
  cardBg: string;
  cardBorder: string;
  textColor: string;
};

export function ThemeColorsSection({
  variant,
  logoUrl,
  title,
  fields,
  config,
  onFieldChange,
  background,
  logoBackground,
  cardBg,
  cardBorder,
  textColor,
}: ThemeColorsSectionProps) {
  const backgroundKey =
    variant === "light" ? "colour_light_background" : "colour_dark_background";
  const textKey =
    variant === "light" ? "colour_light_text" : "colour_dark_text";
  const primaryKey =
    variant === "light" ? "colour_light_primary" : "colour_dark_primary";
  const secondaryKey =
    variant === "light" ? "colour_light_secondary" : "colour_dark_secondary";
  const logoBgKey = 
    variant === "light" ? "logoBackground_light" : "logoBackground_dark";

  const backgroundColor = config[backgroundKey] ?? undefined;
  const inputText = config[textKey] ?? undefined;
  const primaryColor = config[primaryKey] ?? undefined;
  const secondaryColor = config[secondaryKey] ?? undefined;
  const logoBgValue = config[logoBgKey] ?? undefined;

  return (
    <div
      className="mb-6 rounded-xl border p-4 md:p-5 space-y-4"
      style={{ backgroundColor: background, borderColor: cardBorder }}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-4 lg:flex lg:gap-6">
        <div className="space-y-3 flex-1">
          {fields.map((f) => (
            <ColorField
              key={f.key as string}
              label={f.label}
              value={config[f.key] ?? ""}
              background={background}
              borderColor={cardBorder}
              textColor={textColor}
              onChange={(val) => onFieldChange(f.key, val)}
            />
          ))}
        </div>
        <div className="mt-4 lg:mt-0 w-full lg:w-80">
          <ThemePreviewPanel
            variant={variant}
            logoUrl={logoUrl}
            title={
              variant === "light"
                ? "Light preview"
                : "Dark preview"
            }
            backgroundColor={backgroundColor}
            logoBackground={logoBgValue}
            textColor={inputText}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        </div>
      </div>
    </div>
  );
}

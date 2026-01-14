import React from "react";
import { ThemeConfigDto } from "@/services/config";
import { ColorField } from "./ColorField";
import { MapPreviewPanel } from "@/features/admin/components/theme/ThemePreviewPanels";

type ColorFieldDef = {
  key: keyof ThemeConfigDto;
  label: string;
};

type MapColorsSectionProps = {
  title: string;
  variant: "light" | "dark";
  fields: ColorFieldDef[];
  config: ThemeConfigDto;
  onFieldChange: (key: keyof ThemeConfigDto, value: string) => void;
  background: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
};

export function MapColorsSection({
  title,
  variant,
  fields,
  config,
  onFieldChange,
  background,
  cardBg,
  cardBorder,
  textColor,
}: MapColorsSectionProps) {
  const backgroundKey =
    variant === "light" ? "colour_light_background" : "colour_dark_background";

  const backgroundColor = config[backgroundKey] ?? undefined;

  const communeKey =
    variant === "light" ? "communes_light" : "communes_dark";
  const districtKey =
    variant === "light" ? "district_light" : "district_dark";
  const cantonKey = variant === "light" ? "canton_light" : "canton_dark";
  const countryKey =
    variant === "light" ? "country_light" : "country_dark";
  const lakesKey = variant === "light" ? "lakes_light" : "lakes_dark";

  return (
    <div
      className="space-y-3 lg:flex lg:gap-6"
    >
      <div className="space-y-3 flex-1">
        <h3 className="text-sm font-semibold opacity-80">{title}</h3>
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
        <MapPreviewPanel
          variant={variant}
          title={
            variant === "light"
              ? "Map light preview"
              : "Map dark preview"
          }
          backgroundColor={backgroundColor}
          communeColor={config[communeKey] ?? undefined}
          districtColor={config[districtKey] ?? undefined}
          cantonColor={config[cantonKey] ?? undefined}
          countryColor={config[countryKey] ?? undefined}
          lakesColor={config[lakesKey] ?? undefined}
        />
      </div>
    </div>
  );
}

import React from "react";
import { ThemeConfigDto } from "@/services/config";

export type Preset = {
  name: string;
  light: Partial<ThemeConfigDto>;
  dark: Partial<ThemeConfigDto>;
};

type PresetsSectionProps = {
  presets: Preset[];
  cardBg: string;
  cardBorder: string;
  title: string;
  helpText: string;
  onApplyPreset: (preset: Preset) => void;
};

export function PresetsSection({
  presets,
  cardBg,
  cardBorder,
  title,
  helpText,
  onApplyPreset,
}: PresetsSectionProps) {
  return (
    <div
      className="mb-6 rounded-xl border p-4 md:p-5 space-y-3"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-xs opacity-80 mb-2">{helpText}</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => onApplyPreset(p)}
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: cardBorder }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

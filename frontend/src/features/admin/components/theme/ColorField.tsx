import React, { ChangeEvent } from "react";

type ColorFieldProps = {
  label: string;
  value: string | null | undefined;
  onChange: (newValue: string) => void;
  background: string | undefined;
  borderColor: string | undefined;
  textColor: string | undefined;
};

function isValidHexColor(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function ColorField({
  label,
  value,
  onChange,
  background,
  borderColor,
  textColor,
}: ColorFieldProps) {
  const safeValue = isValidHexColor(value) ? (value as string) : "#000000";

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="w-40 text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="color"
          className="h-9 w-12 rounded"
          style={{ borderColor }}
          value={safeValue}
          onChange={handleColorChange}
        />
        <input
          type="text"
          className="flex-1 max-w-xs rounded border px-2 py-1 text-sm"
          style={{
            backgroundColor: background,
            borderColor: borderColor,
            color: textColor,
          }}
          placeholder="#rrggbb"
          value={value ?? ""}
          onChange={handleTextChange}
        />
      </div>
    </div>
  );
}

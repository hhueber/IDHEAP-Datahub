import type { EditableKind } from "@/features/pageAll/all_types";

export function castPageAllValue(value: string, kind: EditableKind): string | number | boolean | null {
  if (value === null || value === undefined) return null;

  switch (kind) {
    case "number": {
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    }

    case "year": {
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    }

    case "bool": {
      const v = value.toLowerCase().trim();
      if (v === "true" || v === "1") return true;
      if (v === "false" || v === "0") return false;
      return null;
    }

    case "text":
    default:
      return value;
  }
}

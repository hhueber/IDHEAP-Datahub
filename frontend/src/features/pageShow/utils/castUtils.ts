import type { ShowMetaField } from "@/features/pageShow/show_type";

export function castValue(value: string, kind?: ShowMetaField["kind"]) {
  if (value === null || value === undefined) return null;

  switch (kind) {
    case "number":
    case "year": {
      const num = Number(value);
      return isNaN(num) ? null : num;
    }

    case "bool": {
      const v = value.toLowerCase().trim();

      if (v === "true" || v === "1") return true;
      if (v === "false" || v === "0") return false;

      return null; // invalide -> ignoré
    }

    case "text":
    default:
      return value;
  }
}

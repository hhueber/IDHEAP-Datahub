import type {
  AllItem,
  ColumnConfig,
  EditableKind,
} from "@/features/pageAll/all_types";
import type { PageAllLang } from "@/features/pageAll/pageAllLang";

export function isProtectedEditField(key: string): boolean {
  return key === "uid" || key === "id";
}

export function getColumnEditKey(col: ColumnConfig, lang: PageAllLang): string {
  if (typeof col.editKey === "function") {
    return col.editKey(lang);
  }
  return String(col.editKey ?? col.key);
}

export function getColumnKind(col: ColumnConfig): EditableKind {
  return col.kind ?? "text";
}

export function isEditableColumn(col: ColumnConfig, lang: PageAllLang): boolean {
  const editKey = getColumnEditKey(col, lang);
  if (col.editable !== true) return false;
  if (isProtectedEditField(editKey)) return false;
  return true;
}

export function normalizeDraftValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function getOriginalEditableValue(
  row: AllItem,
  col: ColumnConfig,
  lang: PageAllLang
): string {
  const editKey = getColumnEditKey(col, lang);
  const raw = (row as any)[editKey] ?? (row as any)[col.key];

  return normalizeDraftValue(raw);
}

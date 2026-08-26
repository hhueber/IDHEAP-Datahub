import { useMemo } from "react";
import type { ShowMeta, ShowMetaField } from "@/features/pageShow/show_type";
import { castValue } from "@/features/pageShow/utils/castUtils";

export function useTypedUpdates(meta: ShowMeta | null) {
  const fieldKindMap = useMemo(() => {
    const map: Record<string, ShowMetaField["kind"]> = {};

    meta?.fields?.forEach((f) => {
      map[f.key] = f.kind;
    });

    // languages = text
    if (meta?.languages) {
      Object.values(meta.languages).forEach((k) => {
        map[k] = "text";
      });
    }

    return map;
  }, [meta]);

  const castUpdates = (
    draft: Record<string, string>,
    data: Record<string, any>,
    isProtectedField: (key: string) => boolean
  ): Record<string, any> => {
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(draft)) {
      if (isProtectedField(key)) continue;

      const original = data[key] !== undefined ? String(data[key]) : "";

      if (value === original) continue;
      if (value.trim() === "") continue;

      const kind = fieldKindMap[key];
      const casted = castValue(value, kind);

      if (casted === null) continue;

      updates[key] = casted;
    }

    return updates;
  };

  return { castUpdates };
}

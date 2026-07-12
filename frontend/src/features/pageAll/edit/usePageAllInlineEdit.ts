import React from "react";
import { useEdit } from "@/shared/useEdit";
import type {
  AllItem,
  ColumnConfig,
  Entity,
} from "@/features/pageAll/all_types";
import type { PageAllLang } from "@/features/pageAll/pageAllLang";
import {
  getColumnEditKey,
  getColumnKind,
  getOriginalEditableValue,
  isEditableColumn,
} from "@/features/pageAll/edit/pageAllEditUtils";
import { castPageAllValue } from "@/features/pageAll/edit/castPageAllValue";

type UsePageAllInlineEditParams = {
  entity: Entity;
  columns: ColumnConfig[];
  lang: PageAllLang;
  onSuccess?: () => void | Promise<void>;
};

export function usePageAllInlineEdit({
  entity,
  columns,
  lang,
  onSuccess,
}: UsePageAllInlineEditParams) {
  const [editingUid, setEditingUid] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState<Record<string, string>>({});

  const {
    loading,
    error,
    confirmWith,
    cancel: cancelEditRequest,
  } = useEdit<{
    entity: Entity;
    id: number;
    updates: Record<string, string | number | boolean>;
  }>((target) => ({
    entity: target.entity,
    filters: [{ field: "uid", value: target.id }],
    updates: target.updates,
  }));

  const editableColumns = React.useMemo(
    () => columns.filter((col) => isEditableColumn(col, lang)),
    [columns, lang]
  );

  const isEditingRow = React.useCallback(
    (row: AllItem) => editingUid === row.uid,
    [editingUid]
  );

  const canEditColumn = React.useCallback(
    (col: ColumnConfig) => isEditableColumn(col, lang),
    [lang]
  );

  const startEditing = React.useCallback(
    (row: AllItem) => {
      const nextDraft: Record<string, string> = {};

      for (const col of editableColumns) {
        const editKey = getColumnEditKey(col, lang);
        nextDraft[editKey] = getOriginalEditableValue(row, col, lang);
      }
      setEditingUid(row.uid);
      setDraft(nextDraft);
    },
    [editableColumns, lang]
  );

  const cancelEditing = React.useCallback(() => {
    setEditingUid(null);
    setDraft({});
    cancelEditRequest();
  }, [cancelEditRequest]);

  const updateDraft = React.useCallback((key: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const getChangedUpdates = React.useCallback(
    (row: AllItem): Record<string, string | number | boolean> => {
      const updates: Record<string, string | number | boolean> = {};

      for (const col of editableColumns) {
        const editKey = getColumnEditKey(col, lang);
        const kind = getColumnKind(col);
        const draftValue = draft[editKey] ?? "";
        const originalValue = getOriginalEditableValue(row, col, lang);

        if (draftValue === originalValue) continue;

        if (typeof draftValue === "string" && draftValue.trim() === "") {
          continue;
        }
        const casted = castPageAllValue(draftValue, kind);

        if (casted === null) continue;
        updates[editKey] = casted;
      }
      return updates;
    },
    [draft, editableColumns, lang]
  );

  const hasChanges = React.useCallback(
    (row: AllItem): boolean => Object.keys(getChangedUpdates(row)).length > 0,
    [getChangedUpdates]
  );

  const confirmEditing = React.useCallback(
    async (row: AllItem): Promise<boolean> => {
      const updates = getChangedUpdates(row);

      if (Object.keys(updates).length === 0) {
        return false;
      }
      const ok = await confirmWith({
        entity,
        filters: [{ field: "uid", value: row.uid }],
        updates,
      });

      if (!ok) return false;
      setEditingUid(null);
      setDraft({});
      if (onSuccess) {
        await onSuccess();
      }
      return true;
    },
    [confirmWith, entity, getChangedUpdates, onSuccess]
  );

  return {
    editingUid,
    draft,
    loading,
    error,
    editableColumns,
    isEditingRow,
    canEditColumn,
    startEditing,
    cancelEditing,
    updateDraft,
    confirmEditing,
    hasChanges,
  };
}

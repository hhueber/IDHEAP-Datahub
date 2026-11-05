import React from "react";
import type {AdminDataTableProps, RowId} from "@/components/table/adminDataTableTypes";
import { useTheme } from "@/theme/useTheme";

const getActionAllowed = <T extends object>(
  action: boolean | ((row: T) => boolean) | undefined,
  row: T
): boolean => {
  if (typeof action === "function") return action(row);
  return Boolean(action);
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "string") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime()) && value.includes("T")) {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    }
  }

  return String(value);
};

export default function AdminDataTable<T extends object>({
  rows,
  getRowId,
  columns,
  actions,
  page,
  perPage,
  labels,
  loading = false,
  saving = false,
  onSave,
  onDelete,
}: AdminDataTableProps<T>) {
  const {textColor, background, borderColor, hoverPrimary04, hoverPrimary15, primary, adaptiveTextColorPrimary} = useTheme();
  const [editingId, setEditingId] = React.useState<RowId | null>(null);
  const [draft, setDraft] = React.useState<Partial<T>>({});
  const hasActions = Boolean(actions?.edit || actions?.delete);

  const startEdit = (row: T) => {
    setEditingId(getRowId(row));
    setDraft({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = async (row: T) => {
    if (!onSave) return;
    const updates: Partial<T> = {};
    columns.forEach((column) => {
      if (!column.editable) return;
      const key = column.key;
      if (draft[key] !== row[key]) {
        updates[key] = draft[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      cancelEdit();
      return;
    }
    await onSave(row, updates);
    cancelEdit();
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: background,
    borderColor,
    color: textColor,
  };

  return (
    <div
      className="overflow-auto border rounded"
      style={{
        borderColor,
        backgroundColor: background,
        maxHeight: "calc(100vh - 260px)",
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-max w-full text-sm border-collapse">
          <thead style={{ backgroundColor: hoverPrimary04 }}>
            <tr>
              <th
                className="border-b px-3 py-2 text-left font-medium whitespace-nowrap"
                style={{ borderColor }}
              >
                {"\u0023"} {/* Signe Unicode pour ce symbole # */}
              </th>

              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b px-3 py-2 text-left font-medium whitespace-nowrap"
                  style={{ borderColor }}
                >
                  {column.label}
                </th>
              ))}

              {hasActions && (
                <th
                  className="border-b px-3 py-2 text-left font-medium whitespace-nowrap"
                  style={{ borderColor }}
                >
                  {labels.actions}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 2 : 1)}
                  className="px-3 py-4 text-center opacity-70"
                >
                  {labels.noData}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const rowId = getRowId(row);
                const isEditing = editingId === rowId;
                const allowEdit = getActionAllowed(actions?.edit, row);
                const allowDelete = getActionAllowed(actions?.delete, row);

                return (
                  <tr
                    key={String(rowId)}
                    style={{
                      backgroundColor: isEditing ? hoverPrimary15 : undefined,
                    }}
                  >
                    <td
                      className="border-b px-3 py-2 whitespace-nowrap"
                      style={{ borderColor }}
                    >
                      {(page - 1) * perPage + index + 1}
                    </td>

                    {columns.map((column) => {
                      const value = row[column.key];

                      return (
                        <td
                          key={column.key}
                          className="border-b px-3 py-2 whitespace-nowrap"
                          style={{ borderColor }}
                        >
                          {isEditing && column.editable ? (
                            column.kind === "select" ? (
                              <select
                                value={String(draft[column.key] ?? "")}
                                onChange={(e) =>
                                  setDraft((current) => ({
                                    ...current,
                                    [column.key]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border px-2 py-1 text-sm"
                                style={inputStyle}
                              >
                                {(column.options ?? []).map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={column.kind === "email" ? "email" : "text"}
                                value={String(draft[column.key] ?? "")}
                                onChange={(e) =>
                                  setDraft((current) => ({
                                    ...current,
                                    [column.key]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border px-2 py-1 text-sm"
                                style={inputStyle}
                              />
                            )
                          ) : column.render ? (
                            column.render(row)
                          ) : (
                            formatValue(value)
                          )}
                        </td>
                      );
                    })}

                    {hasActions && (
                      <td
                        className="border-b px-3 py-2 whitespace-nowrap"
                        style={{ borderColor }}
                      >
                        <div className="flex gap-1">
                          {allowEdit && (
                            <button
                              type="button"
                              disabled={saving}
                              className="px-2 py-1 text-xs rounded border disabled:opacity-60"
                              style={{
                                backgroundColor: isEditing ? primary : background,
                                borderColor: isEditing ? primary : borderColor,
                                color: isEditing
                                  ? adaptiveTextColorPrimary
                                  : textColor,
                              }}
                              onClick={() => {
                                if (isEditing) {
                                  void saveEdit(row);
                                } else {
                                  startEdit(row);
                                }
                              }}
                            >
                              {isEditing ? labels.save : labels.edit}
                            </button>
                          )}

                          {isEditing ? (
                            <button
                              type="button"
                              className="px-2 py-1 text-xs rounded border"
                              style={{
                                backgroundColor: background,
                                borderColor,
                                color: textColor,
                              }}
                              onClick={cancelEdit}
                            >
                              {labels.cancel}
                            </button>
                          ) : (
                            allowDelete && (
                              <button
                                type="button"
                                className="px-2 py-1 text-xs rounded border text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => onDelete?.(row)}
                              >
                                {labels.delete}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

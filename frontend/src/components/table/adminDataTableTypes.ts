import React from "react";

export type RowId = string | number;

export type EditableKind =
  | "text"
  | "number"
  | "bool"
  | "year"
  | "select"
  | "email";

export type AdminColumnConfig<T extends object> = {
  key: Extract<keyof T, string>;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  truncate?: boolean;
  maxWidthClassName?: string;
  editable?: boolean;
  kind?: EditableKind;
  options?: { value: string; label: string }[];
  render?: (row: T) => React.ReactNode;
};

export type AdminTableActions<T extends object> = {
  edit?: boolean | ((row: T) => boolean);
  delete?: boolean | ((row: T) => boolean);
};

export type AdminDataTableLabels = {
  actions: string;
  noData: string;
  save: string;
  edit: string;
  cancel: string;
  delete: string;
};

export type AdminDataTableProps<T extends object> = {
  rows: T[];
  getRowId: (row: T) => RowId;
  columns: AdminColumnConfig<T>[];
  actions?: AdminTableActions<T>;

  page: number;
  perPage: number;

  labels: AdminDataTableLabels;

  loading?: boolean;
  saving?: boolean;

  onSave?: (row: T, updates: Partial<T>) => Promise<void>;
  onDelete?: (row: T) => void;
};

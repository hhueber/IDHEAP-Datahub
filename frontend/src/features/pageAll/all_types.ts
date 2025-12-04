export type Entity =
  | "commune"
  | "district"
  | "canton"
  | "question_per_survey"
  | "question_global"
  | "question_category"
  | "option"
  | "survey";

export type AllItem = {
  uid: number;
  code: string | null;
  name: string;
  entity: Entity;
  year?: number | null;
};

export type AllPayload = {
  items: AllItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
};

export type AllResponse = {
  success: boolean;
  detail: string;
  data: AllPayload;
};

export type SortBy = "uid" | "name";
export type SortDir = "asc" | "desc";

// Colonnes possibles sur la réponse
export type ColumnKey = "uid" | "code" | "name" | "entity" | "year";

export type ColumnConfig = {
  key: ColumnKey;
  label: string;
  // Alignement et rendu custom
  align?: "left" | "center" | "right";
  render?: (row: AllItem) => React.ReactNode;
};

export type ActionsConfig = {
  show?: boolean;
  edit?: boolean;
  delete?: boolean;
};

export type Entity = "commune" | "district" | "canton";

export type AllItem = {
  uid: number;
  code: string;
  name: string;
  entity: Entity;
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

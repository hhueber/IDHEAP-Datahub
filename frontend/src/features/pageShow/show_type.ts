export enum Entity {
  Commune = "commune",
  District = "district",
  Canton = "canton",

  Survey = "survey",
  QuestionPerSurvey = "question_per_survey",
  QuestionGlobal = "question_global",
  QuestionCategory = "question_category",
  Option = "option",
  Answer = "answer",
}

export type ShowChildColumn = {
  key: string;
  label: string;
  kind?: "text" | "number" | "bool" | "year";
  align?: "left" | "center" | "right";
};

export type ShowChildActions = {
  show?: boolean;
  edit?: boolean;
  delete?: boolean;
};

export type ShowChildMeta = {
  key: string;
  title: string;
  entity: Entity;
  fk_field: string;
  per_page?: number;
  columns: ShowChildColumn[];
  actions?: ShowChildActions;
};

export type ShowMetaActions = {
  can_edit: boolean;
  can_delete: boolean;
};

export type ShowMetaField = {
  key: string;
  label: string;
  kind?: "text" | "number" | "bool" | "year";
  group?: string | null;
};

export type ShowMeta = {
  entity: string;
  title_key: string;
  hide_keys: string[];
  fields: ShowMetaField[];
  languages?: Record<"de" | "fr" | "en" | "it" | "ro", string>;
  actions?: ShowMetaActions;
  children?: ShowChildMeta[];
};

export type InsightMapChildLayer = {
  child_key: string;
  child_title: string;
  child_entity: Entity;
  features: any[];
};

export type InsightMap = {
  type: "geo-focus";
  level: "commune" | "district" | "canton";
  focus_feature: any;
  context_features: any[];
  child_layers?: InsightMapChildLayer[];
};

export type InsightStats = {
  items: { label_key: string; value: any }[];
};

export type ShowInsights = {
  map?: InsightMap | null;
  stats?: InsightStats | null;
};

export type ShowResponse = {
  success: boolean;
  detail: string;
  meta: ShowMeta | null;
  data: Record<string, any> | null;
};

export type ShowInsightsResponse = {
  success: boolean;
  detail: string;
  data: ShowInsights | null;
};

export type ShowChildrenResponse = {
  success: boolean;
  detail: string;
  data: null | {
    items: Record<string, any>[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
};

export type ShowPermissionActions = {
  show: boolean;
  edit: boolean;
  delete: boolean;
};

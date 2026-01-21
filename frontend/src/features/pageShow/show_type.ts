export enum Entity {
  Commune = "commune",
  District = "district",
  Canton = "canton",

  Survey = "survey",
  QuestionPerSurvey = "question_per_survey",
  QuestionGlobal = "question_global",
  QuestionCategory = "question_category",
  Option = "option",
}

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
};

export type ShowResponse = {
  success: boolean;
  detail: string;
  meta: ShowMeta | null;
  data: Record<string, any> | null;
};

import React from "react";
<<<<<<< HEAD
=======
import type { PageAllLang } from "@/features/pageAll/pageAllLang";
>>>>>>> origin/Fix-#320-permettre-l-ajouts-de-plusieurs-fichier-en-meme-temps-partie-2

export type Entity =
  | "commune"
  | "district"
  | "canton"
  | "question_per_survey"
  | "question_global"
  | "question_category"
  | "option"
  | "survey"
  | "answer";

export type AllItem = {
  uid: number;
  code: string | null;
  name: string;
  entity: Entity;
  year?: number | null;
  value?: string | null;
  question_uid?: number | null;
  commune_uid?: number | null;
<<<<<<< HEAD
=======
  question?: string | null;
  commune?: string | null;
>>>>>>> origin/Fix-#320-permettre-l-ajouts-de-plusieurs-fichier-en-meme-temps-partie-2
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

export type SortBy =
  | "name"
  | "code"
  | "year"
  | "value"
  | "question"
  | "commune";

export type SortDir = "asc" | "desc";

// Colonnes possibles sur la réponse
export type ColumnKey =
<<<<<<< HEAD
  | "uid"
  | "code"
  | "name"
  | "entity"
  | "year"
  | "value"
  | "question_uid"
  | "commune_uid";
=======
  | "code"
  | "name"
  | "year"
  | "value"
  | "question"
  | "commune";

export type EditableKind = "text" | "number" | "bool" | "year";
>>>>>>> origin/Fix-#320-permettre-l-ajouts-de-plusieurs-fichier-en-meme-temps-partie-2

export type ColumnConfig = {
  key: ColumnKey;
  labelKey?: string;
  label?: string;
  // Alignement et rendu custom
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sortKey?: SortBy;
  truncate?: boolean;
  maxWidthClassName?: string;
  render?: (row: AllItem) => React.ReactNode;
  // Active ou désactive l'édition inline pour cette colonne.
  editable?: boolean;
  // Nom réel du champ envoyé au backend dans updates.
  // Peut être :
  //  - une string fixe : "value", "year", "label_"
  //  - une fonction dynamique selon la langue : (lang) => `text_${lang}`
  editKey?: keyof AllItem | string | ((lang: PageAllLang) => string);
  // Type utilisé pour caster la valeur avant l'envoi au backend.
  kind?: EditableKind;
};

export type ActionsConfig = {
  show?: boolean;
  edit?: boolean;
  delete?: boolean;
};

export type SuggestResponse = {
  success: boolean;
  detail: string;
  data: AllItem[];
};

export type FindPageResponse = {
  success: boolean;
  detail: string;
  data: {
    page: number;
  };
};

export type DeleteResponse = {
  success: boolean;
  detail: string;
};

export type DeleteFilter = {
  field: string;
  value: number | string;
};

import React from "react";
import type {
  AllItem,
  ColumnConfig,
} from "@/features/pageAll/all_types";
import type { PageAllLang } from "@/features/pageAll/pageAllLang";
import { TruncatedCell } from "@/features/pageAll/TruncatedCell";
import { InlineEditBox } from "@/utils/UI";
import {
  getColumnEditKey,
  getColumnKind,
} from "@/features/pageAll/edit/pageAllEditUtils";

type Props = {
  row: AllItem;
  col: ColumnConfig;
  lang: PageAllLang;
  content: React.ReactNode;
  isEditing: boolean;
  draftValue: string;
  textColor: string;
  background: string;
  borderColor: string;
  hoverText07: string;
  onChange: (key: string, value: string) => void;
};

export default function PageAllEditableCell({
  row,
  col,
  lang,
  content,
  isEditing,
  draftValue,
  textColor,
  background,
  borderColor,
  hoverText07,
  onChange,
}: Props) {
  const editKey = getColumnEditKey(col, lang);
  const kind = getColumnKind(col);

  if (!isEditing) {
    if (col.truncate && typeof content === "string") {
      return (
        <TruncatedCell
          value={content}
          title={content}
          className={col.maxWidthClassName ?? "max-w-[280px]"}
        />
      );
    }
    return <>{content}</>;
  }

  const inputBaseClass = "w-full bg-transparent outline-none text-sm leading-tight";

  if (kind === "bool") {
    return (
      <InlineEditBox>
        <input
          type="checkbox"
          checked={draftValue === "true"}
          onChange={(e) => {
            onChange(editKey, e.target.checked ? "true" : "false");
          }}
        />
      </InlineEditBox>
    );
  }

  if (kind === "number" || kind === "year") {
    return (
      <InlineEditBox>
        <input
          type="number"
          value={draftValue}
          onChange={(e) => onChange(editKey, e.target.value)}
          className={inputBaseClass}
          style={{ color: textColor }}
        />
      </InlineEditBox>
    );
  }

  return (
    <InlineEditBox>
      <input
        type="text"
        value={draftValue}
        onChange={(e) => onChange(editKey, e.target.value)}
        className={inputBaseClass}
        style={{ color: textColor }}
      />
    </InlineEditBox>
  );
}

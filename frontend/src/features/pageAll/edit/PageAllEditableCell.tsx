import React from "react";
import type {
  AllItem,
  ColumnConfig,
} from "@/features/pageAll/all_types";
import type { PageAllLang } from "@/features/pageAll/pageAllLang";
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
        <span
          title={content}
          className={`block overflow-hidden text-ellipsis whitespace-nowrap ${
            col.maxWidthClassName ?? "max-w-[280px]"
          }`}
        >
          {content}
        </span>
      );
    }
    return <>{content}</>;
  }

  const inputBaseClass = "w-full bg-transparent outline-none text-sm leading-tight";
  const boxClass = "inline-flex items-center gap-2 rounded-md border px-2 py-1 min-h-[30px] w-full";

  if (kind === "bool") {
    return (
      <div
        className={boxClass}
        style={{
          borderColor,
          backgroundColor: background,
        }}
      >
        <input
          type="checkbox"
          checked={draftValue === "true"}
          onChange={(e) => {
            onChange(editKey, e.target.checked ? "true" : "false");
          }}
        />
        <span className="text-xs opacity-70 select-none" style={{ color: hoverText07 }}>
          {"\u270E"} {/* Unicode pencil icon */}
        </span>
      </div>
    );
  }

  if (kind === "number" || kind === "year") {
    return (
      <div
        className={boxClass}
        style={{
          borderColor,
          backgroundColor: background,
        }}
      >
        <input
          type="number"
          value={draftValue}
          onChange={(e) => onChange(editKey, e.target.value)}
          className={inputBaseClass}
          style={{ color: textColor }}
        />
        <span className="text-xs opacity-70 select-none" style={{ color: hoverText07 }}>
          {"\u270E"} {/* Unicode pencil icon */}
        </span>
      </div>
    );
  }

  return (
    <div
      className={boxClass}
      style={{
        borderColor,
        backgroundColor: background,
      }}
    >
      <input
        type="text"
        value={draftValue}
        onChange={(e) => onChange(editKey, e.target.value)}
        className={inputBaseClass}
        style={{ color: textColor }}
      />
      <span className="text-xs opacity-70 select-none" style={{ color: hoverText07 }}>
        {"\u270E"} {/* Unicode pencil icon */}
      </span>
    </div>
  );
}

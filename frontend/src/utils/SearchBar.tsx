import React from "react";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import type { AllItem } from "@/features/pageAll/all_types";
import { useTheme } from "@/theme/useTheme";

type Props = {
  search: string;
  searchLoading: boolean;
  suggestions: AllItem[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onSuggestionClick: (item: AllItem) => void;
};

export function SearchBar({
  search,
  searchLoading,
  suggestions,
  onSearchChange,
  onClearSearch,
  onSuggestionClick,
}: Props) {
  const { t } = useTranslation();

  const { primary, background, borderColor, textColor, hoverPrimary06, hoverText07 } = useTheme();

  return (
    <div className="flex flex-col gap-1 w-full sm:w-auto mb-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={onSearchChange}
          className="h-9 w-full sm:w-64 rounded border px-2 text-sm"
          placeholder={t("dashboardSidebar.pageAll.searchPlaceholder")}
          style={{
            backgroundColor: background,
            borderColor: borderColor,
            color: textColor,
          }}
        />
        {search && (
          <button
            type="button"
            onClick={onClearSearch}
            className="text-xs transition hover:[color:var(--search-clear-hover-color)]"
            style={
              {
                color: hoverText07,
                "--search-clear-hover-color": primary,
              } as React.CSSProperties
            }
          >
            {t("dashboardSidebar.pageAll.clear")}
          </button>
        )}
      </div>
      {searchLoading && (
        <div className="text-xs" style={{ color: hoverText07 }}>
          <LoadingDots label={t("dashboardSidebar.pageAll.searching")} />
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-1 border rounded max-h-56 overflow-y-auto text-sm shadow-sm"
          style={{
            backgroundColor: background,
            borderColor: borderColor,
            color: textColor,
          }}>
          {suggestions.map((s) => (
            <button
              key={s.uid}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="w-full text-left px-3 py-2 flex items-center justify-between
                transition
                [background-color:var(--search-suggest-bg)]
                hover:[background-color:var(--search-suggest-hover-bg)]"
              style={
                {
                  color: textColor,
                  "--search-suggest-bg": background,
                  "--search-suggest-hover-bg": hoverPrimary06,
                } as React.CSSProperties
              }
            >
              <span>
                <span className="font-medium" style={{ color: textColor }}>{s.name}</span>
                {s.code && (
                  <span className="text-xs ml-2" style={{ color: hoverText07 }}>
                    ({s.code})
                  </span>
                )}
              </span>
              {s.year != null && (
                <span className="text-xs" style={{ color: hoverText07 }}>{s.year}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

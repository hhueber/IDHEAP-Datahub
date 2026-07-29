import React from "react";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import type { AllItem, Entity } from "@/features/pageAll/all_types";
import { useTheme } from "@/theme/useTheme";

type Props = {
  entity: Entity;
  search: string;
  searchLoading: boolean;
  suggestions: AllItem[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onSuggestionClick: (item: AllItem) => void;
  onSearchSubmit: (term: string) => void;
};

export function SearchBar({
  entity,
  search,
  searchLoading,
  suggestions,
  onSearchChange,
  onClearSearch,
  onSuggestionClick,
  onSearchSubmit,
}: Props) {
  const { t } = useTranslation();

  const { primary, background, borderColor, textColor, hoverPrimary06, hoverText07 } = useTheme();
  const showDropdown = search.trim().length > 0 && (searchLoading || suggestions.length > 0);

  const renderSuggestion = (suggestion: AllItem) => {
    if (entity === "answer") {
      return (
        <>
          <div className="min-w-0 flex-1">
            <div
              className="truncate font-medium"
              style={{ color: textColor }}
              title={suggestion.question ?? suggestion.name}
            >
              {suggestion.question ?? suggestion.name ?? "—"}
            </div>

            <div
              className="mt-0.5 flex min-w-0 items-center gap-2 text-xs"
              style={{ color: hoverText07 }}
            >
              {suggestion.commune && (
                <span className="min-w-0 truncate"
                  title={suggestion.commune}
                >
                  {suggestion.commune}
                </span>
              )}

              {suggestion.value != null && (
                <>
                  {suggestion.commune && <span aria-hidden="true">•</span>}
                  <span className="min-w-0 truncate"
                    title={String(suggestion.value)}
                  >
                    {String(suggestion.value)}
                  </span>
                </>
              )}
            </div>
          </div>

          {suggestion.year != null && (
            <span className="ml-3 shrink-0 text-xs"
              style={{ color: hoverText07 }}
            >
              {suggestion.year}
            </span>
          )}
        </>
      );
    }

    return (
      <>
        <div className="min-w-0 flex-1">
          <div className="truncate">
            <span
              className="font-medium"
              style={{ color: textColor }}
              title={suggestion.name}
            >
              {suggestion.name}
            </span>

            {suggestion.code && (
              <span className="ml-2 text-xs"
                style={{ color: hoverText07 }}
              >
                ({suggestion.code})
              </span>
            )}
          </div>
        </div>

        {suggestion.year != null && (
          <span className="ml-3 shrink-0 text-xs"
            style={{ color: hoverText07 }}
          >
            {suggestion.year}
          </span>
        )}
      </>
    );
  };

  return (
    <div className="relative w-full sm:w-64">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={onSearchChange}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;

            e.preventDefault();

            const term = search.trim();
            if (!term) return;

            onSearchSubmit(term);
          }}
          className="h-9 w-full rounded border px-2 text-sm"
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

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1 border rounded max-h-56 overflow-y-auto text-sm shadow-sm z-50"
          style={{
            backgroundColor: background,
            borderColor: borderColor,
            color: textColor,
          }}
        >
          {searchLoading && (
            <div className="px-3 py-2 text-xs" style={{ color: hoverText07 }}>
              <LoadingDots label={t("dashboardSidebar.pageAll.searching")} />
            </div>
          )}
          {!searchLoading &&
            suggestions.map((s) => (
            <button
              key={`${s.entity}-${s.uid}`}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="
                flex w-full min-w-0 items-start
                px-3 py-2 text-left
                transition
                [background-color:var(--search-suggest-bg)]
                hover:[background-color:var(--search-suggest-hover-bg)]
              "
              style={
                {
                  color: textColor,
                  "--search-suggest-bg": background,
                  "--search-suggest-hover-bg": hoverPrimary06,
                } as React.CSSProperties
              }
            >
              {renderSuggestion(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

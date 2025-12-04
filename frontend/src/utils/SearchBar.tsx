import React from "react";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/utils/LoadingDots";
import type { AllItem } from "@/features/pageAll/all_types";

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

  return (
    <div className="flex flex-col gap-1 w-full sm:w-auto mb-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={onSearchChange}
          className="h-9 w-full sm:w-64 rounded border px-2 text-sm"
          placeholder={t("dashboardSidebar.pageAll.searchPlaceholder")}
        />
        {search && (
          <button
            type="button"
            onClick={onClearSearch}
            className="text-xs text-gray-600 hover:text-black"
          >
            {t("dashboardSidebar.pageAll.clear")}
          </button>
        )}
      </div>
      {searchLoading && (
        <div className="text-xs text-gray-500">
          <LoadingDots label={t("dashboardSidebar.pageAll.searching")} />
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-1 border rounded bg-white max-h-56 overflow-y-auto text-sm shadow-sm">
          {suggestions.map((s) => (
            <button
              key={s.uid}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>
                <span className="font-medium">{s.name}</span>
                {s.code && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({s.code})
                  </span>
                )}
              </span>
              {s.year != null && (
                <span className="text-xs text-gray-500">{s.year}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

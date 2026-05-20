import React from "react";
import { apiFetch } from "@/shared/apiFetch";
import type { AllItem, Entity, SuggestResponse } from "@/features/pageAll/all_types";
import { getPageAllLang } from "@/features/pageAll/pageAllLang";
import { useTranslation } from "react-i18next";

type UsePageAllSearchReturn = {
  search: string;
  searchLoading: boolean;
  suggestions: AllItem[];
  selectedUid: number | null;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSuggestionClick: (item: AllItem) => void;
  clearSearch: () => void;
  clearSuggestions: () => void;
};

const MIN_SEARCH_LENGTH = 1;
const SEARCH_DEBOUNCE_MS = 300;

export function usePageAllSearch(entity: Entity): UsePageAllSearchReturn {
  const { i18n } = useTranslation();

  const [search, setSearch] = React.useState("");
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<AllItem[]>([]);
  const [selectedUid, setSelectedUid] = React.useState<number | null>(null);

  // on stocke l'id du timeout pour le debounce
  const timeoutRef = React.useRef<number | null>(null);

  const fetchSuggestions = React.useCallback(
    async (term: string) => {
      setSearchLoading(true);

      try {
        const json = await apiFetch<SuggestResponse>("/pageAll/suggest", {
          method: "GET",
          auth: true,
          query: {
            entity,
            q: term,
            limit: 10,
            lang: getPageAllLang(i18n.language),
          },
        });

        if (!json.success) {
          // on ne casse pas la page pour un échec de suggest
          console.error(json.detail);
          setSuggestions([]);
        } else {
          setSuggestions(json.data);
        }
      } catch (e) {
        console.error(e);
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [entity, i18n.language]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const trimmedValue = value.trim();

    setSearch(value);

    // reset du debounce
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    // si moins de MIN_SEARCH_LENGTH caractères -> on annule la recherche et on réinitialise
    if (trimmedValue.length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setSelectedUid(null);
      setSearchLoading(false);
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      void fetchSuggestions(trimmedValue);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSuggestionClick = (item: AllItem) => {
    setSelectedUid(item.uid);
    setSuggestions([]);
    // on garde la valeur dans l'input pour info
    setSearch(item.name);
  };

  const clearSearch = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setSearch("");
    setSuggestions([]);
    setSelectedUid(null);
    setSearchLoading(false);
  };

  const clearSuggestions = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setSuggestions([]);
    setSearchLoading(false);
  };

  return {
    search,
    searchLoading,
    suggestions,
    selectedUid,
    handleSearchChange,
    handleSuggestionClick,
    clearSearch,
    clearSuggestions,
  };
}

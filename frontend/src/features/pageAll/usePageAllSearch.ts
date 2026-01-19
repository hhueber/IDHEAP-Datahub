import React from "react";
import { apiFetch } from "@/shared/apiFetch";
import type { AllItem, Entity, SuggestResponse } from "@/features/pageAll/all_types";

type UsePageAllSearchReturn = {
  search: string;
  searchLoading: boolean;
  suggestions: AllItem[];
  selectedUid: number | null;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSuggestionClick: (item: AllItem) => void;
  clearSearch: () => void;
};

export function usePageAllSearch(entity: Entity): UsePageAllSearchReturn {
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
    [entity]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    // reset du debounce
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    // si moins de 3 caractères -> on annule la recherche et on réinitialise
    if (value.trim().length < 3) {
      setSuggestions([]);
      setSelectedUid(null);
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      void fetchSuggestions(value.trim());
    }, 300);
  };

  const handleSuggestionClick = (item: AllItem) => {
    setSelectedUid(item.uid);
    setSuggestions([]);
    // on garde la valeur dans l'input pour info
    setSearch(item.name);
  };

  const clearSearch = () => {
    setSearch("");
    setSuggestions([]);
    setSelectedUid(null);
  };

  return {
    search,
    searchLoading,
    suggestions,
    selectedUid,
    handleSearchChange,
    handleSuggestionClick,
    clearSearch,
  };
}
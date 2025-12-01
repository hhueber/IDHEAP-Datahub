import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PlaceOfInterestMarker } from "@/features/geo/hooks/usePlaceOfInterestMarkers";
import { communesApi, PlaceOfInterestSuggestDTO } from "@/features/geo/communesApi";


type Props = {
  isOpen: boolean;
  onClose: () => void;

  backendPlaceOfInterest: PlaceOfInterestMarker[];
  extraPlaceOfInterest: PlaceOfInterestMarker[];

  hideAllBackend: boolean;
  hiddenCodes: Set<string>;
  togglePlaceOfInterestHidden: (code: string) => void;

  addExtraPlaceOfInterest: (c: Omit<PlaceOfInterestMarker, "source">) => void;
  removeExtraPlaceOfInterest: (code: string) => void;
};

// petite fonction pour générer un code local à partir du nom
const slugify = (s: string): string => {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "placeOfInterest"
  );
};

export default function PlaceOfInterestMenuModal({
  isOpen,
  onClose,
  backendPlaceOfInterest,
  extraPlaceOfInterest,
  hideAllBackend,
  hiddenCodes,
  togglePlaceOfInterestHidden,
  addExtraPlaceOfInterest,
  removeExtraPlaceOfInterest,
}: Props) {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceOfInterestSuggestDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSuggestions([]);
      setLoading(false);
      setError(null);
      abortRef.current?.abort();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length < 3) {
      abortRef.current?.abort();
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    communesApi
      .suggest(value.trim(), ctrl.signal, 10)
      .then((res) => {
        if (!res.success) {
          setError(res.detail || t("map.errors.failedToFetchSuggestions"));
          setSuggestions([]);
          return;
        }
        setSuggestions(res.data);
      })
      .catch((err: any) => {
        if (ctrl.signal.aborted) return;
        setError(err?.message || t("map.errors.failedToFetchSuggestions"));
        setSuggestions([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  };

  const handleAddSuggestion = (s: PlaceOfInterestSuggestDTO) => {
    const base = slugify(s.default_name);
    const code = `local-${base}-${Math.round(s.pos[0] * 1000)}-${Math.round(
      s.pos[1] * 1000
    )}`;

    addExtraPlaceOfInterest({
      code,
      name: s.default_name,
      pos: s.pos,
    });

    setQuery("");
    setSuggestions([]);
  };

  const isPlaceOfInterestVisible = (code: string) => {
    if (hideAllBackend) return false;
    return !hiddenCodes.has(code);
  };

  const handleBackdropClick = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleBackdropClick}
      />
      {/* Contenu */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-[90%] p-4 z-[710]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {t("map.menu.global")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100"
            aria-label={t("common.close")}
          >
            {/* Symbole de croix de fermeture */}
            {"\u00D7"}
          </button>
        </div>

        {/* Villes backend */}
        <section className="mb-4">
          <h3 className="text-sm font-semibold mb-1">
            {t("map.menu.instancePlaceOfInterest")}
          </h3>
          {backendPlaceOfInterest.length === 0 ? (
            <p className="text-xs text-stone-500">
              {t("map.menu.noInstancePlaceOfInterest")}
            </p>
          ) : (
            <ul className="max-h-40 overflow-auto text-sm space-y-1">
              {backendPlaceOfInterest.map((placeOfInterest) => {
                const visible = isPlaceOfInterestVisible(placeOfInterest.code);
                return (
                  <li
                    key={placeOfInterest.code}
                    className="flex items-center justify-between gap-2"
                  >
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={hideAllBackend}
                        checked={visible}
                        onChange={() => togglePlaceOfInterestHidden(placeOfInterest.code)}
                      />
                      <span>{placeOfInterest.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Villes locales (frontend only) */}
        <section className="mb-4">
          <h3 className="text-sm font-semibold mb-1">
              {t("map.menu.localPlaceOfInterest")}
          </h3>
          {extraPlaceOfInterest.length === 0 ? (
              <p className="text-xs text-stone-500">
              {t("map.menu.noLocalPlaceOfInterest")}
              </p>
          ) : (
              <ul className="max-h-32 overflow-auto text-sm space-y-1">
              {extraPlaceOfInterest.map((placeOfInterest) => {
                  const visible = isPlaceOfInterestVisible(placeOfInterest.code);
                  return (
                  <li
                      key={placeOfInterest.code}
                      className="flex items-center justify-between gap-2"
                  >
                      <label className="flex items-center gap-2">
                      <input
                          type="checkbox"
                          disabled={hideAllBackend}
                          checked={visible}
                          onChange={() => togglePlaceOfInterestHidden(placeOfInterest.code)}
                      />
                      <span>{placeOfInterest.name}</span>
                      </label>
                      <button
                      type="button"
                      onClick={() => removeExtraPlaceOfInterest(placeOfInterest.code)}
                      className="text-xs text-red-600 hover:underline"
                      >
                      {t("map.menu.removePlaceOfInterest")}
                      </button>
                  </li>
                  );
              })}
              </ul>
          )}
        </section>

        {/* Ajout de villes via suggest publique */}
        <section>
          <h3 className="text-sm font-semibold mb-1">
            {t("map.menu.addPlaceOfInterest")}
          </h3>
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={t("map.menu.addPlaceOfInterestPlaceholder")}
            className="w-full border border-stone-300 rounded px-2 py-1 text-sm mb-2"
          />
          {loading && (
            <p className="text-xs text-stone-500">
              {t("map.menu.loadingSuggestions")}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}
          {suggestions.length > 0 && (
            <ul className="max-h-32 overflow-auto text-sm border border-stone-200 rounded">
              {suggestions.map((s, idx) => (
                <li
                  key={`${s.default_name}-${idx}`}
                  className="px-2 py-1 hover:bg-stone-100 cursor-pointer flex items-center justify-between gap-2"
                  onClick={() => handleAddSuggestion(s)}
                >
                  <span>{s.default_name}</span>
                  <span className="text-[10px] text-stone-400">
                    {s.pos[0].toFixed(3)}, {s.pos[1].toFixed(3)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
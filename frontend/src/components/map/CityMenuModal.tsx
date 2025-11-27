import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CityMarker } from "@/features/geo/hooks/useCityMarkers";
import { communesApi, CitySuggestDTO } from "@/features/geo/communesApi";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  backendCities: CityMarker[];
  extraCities: CityMarker[];

  hideAllBackend: boolean;
  hiddenCodes: Set<string>;
  toggleCityHidden: (code: string) => void;

  addExtraCity: (c: Omit<CityMarker, "source">) => void;
  removeExtraCity: (code: string) => void;
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
      .replace(/^-+|-+$/g, "") || "city"
  );
};

export default function CityMenuModal({
  isOpen,
  onClose,
  backendCities,
  extraCities,
  hideAllBackend,
  hiddenCodes,
  toggleCityHidden,
  addExtraCity,
  removeExtraCity,
}: Props) {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestDTO[]>([]);
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
          setError(res.detail || "Failed to fetch suggestions");
          setSuggestions([]);
          return;
        }
        setSuggestions(res.data);
      })
      .catch((err: any) => {
        if (ctrl.signal.aborted) return;
        setError(err?.message || "Failed to fetch suggestions");
        setSuggestions([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  };

  const handleAddSuggestion = (s: CitySuggestDTO) => {
    const base = slugify(s.default_name);
    const code = `local-${base}-${Math.round(s.pos[0] * 1000)}-${Math.round(
      s.pos[1] * 1000
    )}`;

    addExtraCity({
      code,
      name: s.default_name,
      pos: s.pos,
    });

    setQuery("");
    setSuggestions([]);
  };

  const isCityVisible = (code: string) => {
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
            {t("map.menu.instanceCities")}
          </h3>
          {backendCities.length === 0 ? (
            <p className="text-xs text-stone-500">
              {t("map.menu.noInstanceCities")}
            </p>
          ) : (
            <ul className="max-h-40 overflow-auto text-sm space-y-1">
              {backendCities.map((city) => {
                const visible = isCityVisible(city.code);
                return (
                  <li
                    key={city.code}
                    className="flex items-center justify-between gap-2"
                  >
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={hideAllBackend}
                        checked={visible}
                        onChange={() => toggleCityHidden(city.code)}
                      />
                      <span>{city.name}</span>
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
              {t("map.menu.localCities")}
          </h3>
          {extraCities.length === 0 ? (
              <p className="text-xs text-stone-500">
              {t("map.menu.noLocalCities")}
              </p>
          ) : (
              <ul className="max-h-32 overflow-auto text-sm space-y-1">
              {extraCities.map((city) => {
                  const visible = isCityVisible(city.code);
                  return (
                  <li
                      key={city.code}
                      className="flex items-center justify-between gap-2"
                  >
                      <label className="flex items-center gap-2">
                      <input
                          type="checkbox"
                          disabled={hideAllBackend}
                          checked={visible}
                          onChange={() => toggleCityHidden(city.code)}
                      />
                      <span>{city.name}</span>
                      </label>
                      <button
                      type="button"
                      onClick={() => removeExtraCity(city.code)}
                      className="text-xs text-red-600 hover:underline"
                      >
                      {t("map.menu.removeCity")}
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
            {t("map.menu.addCity")}
          </h3>
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={t("map.menu.addCityPlaceholder")}
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
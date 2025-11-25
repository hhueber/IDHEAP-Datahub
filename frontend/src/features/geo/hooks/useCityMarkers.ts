import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";
import { citiesApi, CityMapDTO } from "@/features/geo/geoApi";

// Représente une ville à afficher sur la carte.
export type CityMarker = {
  code: string;
  name: string;
  pos: LatLngExpression;
  source: "backend" | "local";
};

// Structure de retour du hook useCityMarkers.
type UseCityMarkersResult = {
  cities: CityMarker[];
  loading: boolean;
  error: string | null;

  // Permet de masquer / afficher toutes les villes provenant du backend
  hideAllBackend: boolean;
  setHideAllBackend: (v: boolean) => void;

  // Permet de masquer certaines villes par code
  hiddenCodes: Set<string>;
  toggleCityHidden: (code: string) => void;

  extraCities: CityMarker[];
  addExtraCity: (c: Omit<CityMarker, "source">) => void;
  removeExtraCity: (code: string) => void;
};

/** Cache en mémoire : évite de re-fetch à chaque fois pour la même langue. */
const backendCacheByLang: Record<string, CityMarker[]> = {};

export function useCityMarkers(lang: string): UseCityMarkersResult {
  const [backendCities, setBackendCities] = useState<CityMarker[]>([]);
  const [extraCities, setExtraCities] = useState<CityMarker[]>([]);
  const [hideAllBackend, setHideAllBackend] = useState(false);
  const [hiddenCodes, setHiddenCodes] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const normLang = (lang || "en").toLowerCase();
    const cached = backendCacheByLang[normLang];
    if (cached) {
      setBackendCities(cached);
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    citiesApi
      .list(normLang, ctrl.signal)
      .then((raw: CityMapDTO[]) => {
        const markers: CityMarker[] = raw.map((c) => ({
          code: c.code,
          name: c.name,
          pos: c.pos,
          source: "backend",
        }));
        backendCacheByLang[normLang] = markers;
        setBackendCities(markers);
      })
      .catch((e: any) => {
        if (ctrl.signal.aborted) return;
        setError(e?.message || "Failed to load cities");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => {
      ctrl.abort();
    };
  }, [lang]);

  // Masque / démasque une ville spécifique en fonction de son code.   
  const toggleCityHidden = (code: string) => {
    setHiddenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  /**
   * Ajoute une ville "locale" (non persistée en DB, source = "local").
   * Si une ville avec le même code existe déjà dans extraCities, on ignore.
   */
  const addExtraCity = (c: Omit<CityMarker, "source">) => {
    setExtraCities((prev) => {
      if (prev.some((p) => p.code === c.code)) return prev;
      return [...prev, { ...c, source: "local" }];
    });
  };

  const removeExtraCity = (code: string) => {
    setExtraCities((prev) => prev.filter((c) => c.code !== code));
  };

  // Liste finale des villes visibles   
  const cities = useMemo(() => {
    const visibleBackend = hideAllBackend
      ? []
      : backendCities.filter((c) => !hiddenCodes.has(c.code));
    return [...visibleBackend, ...extraCities];
  }, [backendCities, extraCities, hideAllBackend, hiddenCodes]);

  return {
    cities,
    loading,
    error,
    hideAllBackend,
    setHideAllBackend,
    hiddenCodes,
    toggleCityHidden,
    extraCities,
    addExtraCity,
    removeExtraCity,
  };
}

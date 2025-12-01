import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";
import { PlaceOfInterestApi, PlaceOfInterestMapDTO } from "@/features/geo/geoApi";

// Représente une ville à afficher sur la carte.
export type PlaceOfInterestMarker = {
  code: string;
  name: string;
  pos: LatLngExpression;
  source: "backend" | "local";
};

// Structure de retour du hook usePlaceOfInterestMarkers.
type UsePlaceOfInterestMarkersResult = {
  placeOfInterest: PlaceOfInterestMarker[];
  loading: boolean;
  error: string | null;

  // Permet de masquer / afficher toutes les villes provenant du backend
  hideAllBackend: boolean;
  setHideAllBackend: (v: boolean) => void;

  // Permet de masquer certaines villes par code
  hiddenCodes: Set<string>;
  togglePlaceOfInterestHidden: (code: string) => void;

  extraPlaceOfInterest: PlaceOfInterestMarker[];
  addExtraPlaceOfInterest: (c: Omit<PlaceOfInterestMarker, "source">) => void;
  removeExtraPlaceOfInterest: (code: string) => void;
};

/** Cache en mémoire : évite de re-fetch à chaque fois pour la même langue. */
const backendCacheByLang: Record<string, PlaceOfInterestMarker[]> = {};

export function usePlaceOfInterestMarkers(lang: string): UsePlaceOfInterestMarkersResult {
  const [backendPlaceOfInterest, setBackendPlaceOfInterest] = useState<PlaceOfInterestMarker[]>([]);
  const [extraPlaceOfInterest, setExtraPlaceOfInterest] = useState<PlaceOfInterestMarker[]>([]);
  const [hideAllBackend, setHideAllBackend] = useState(false);
  const [hiddenCodes, setHiddenCodes] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const normLang = (lang || "en").toLowerCase();
    const cached = backendCacheByLang[normLang];
    if (cached) {
      setBackendPlaceOfInterest(cached);
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    PlaceOfInterestApi
      .list(normLang, ctrl.signal)
      .then((raw: PlaceOfInterestMapDTO[]) => {
        const markers: PlaceOfInterestMarker[] = raw.map((c) => ({
          code: c.code,
          name: c.name,
          pos: c.pos,
          source: "backend",
        }));
        backendCacheByLang[normLang] = markers;
        setBackendPlaceOfInterest(markers);
      })
      .catch((e: any) => {
        if (ctrl.signal.aborted) return;
        setError(e?.message || "Failed to load placeOfInterest");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => {
      ctrl.abort();
    };
  }, [lang]);

  // Masque / démasque une ville spécifique en fonction de son code.   
  const togglePlaceOfInterestHidden = (code: string) => {
    setHiddenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  /**
   * Ajoute une ville "locale" (non persistée en DB, source = "local").
   * Si une ville avec le même code existe déjà dans extraplaceOfInterest, on ignore.
   */
  const addExtraPlaceOfInterest = (c: Omit<PlaceOfInterestMarker, "source">) => {
    setExtraPlaceOfInterest((prev) => {
      if (prev.some((p) => p.code === c.code)) return prev;
      return [...prev, { ...c, source: "local" }];
    });
  };

  const removeExtraPlaceOfInterest = (code: string) => {
    setExtraPlaceOfInterest((prev) => prev.filter((c) => c.code !== code));
  };

  // Liste finale des villes visibles   
  const placeOfInterest = useMemo(() => {
    const visibleBackend = hideAllBackend
      ? []
      : backendPlaceOfInterest.filter((c) => !hiddenCodes.has(c.code));
    return [...visibleBackend, ...extraPlaceOfInterest];
  }, [backendPlaceOfInterest, extraPlaceOfInterest, hideAllBackend, hiddenCodes]);

  return {
    placeOfInterest,
    loading,
    error,
    hideAllBackend,
    setHideAllBackend,
    hiddenCodes,
    togglePlaceOfInterestHidden,
    extraPlaceOfInterest,
    addExtraPlaceOfInterest,
    removeExtraPlaceOfInterest,
  };
}

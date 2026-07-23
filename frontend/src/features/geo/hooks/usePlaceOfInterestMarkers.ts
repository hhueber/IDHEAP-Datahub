import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";
import { useTranslation } from "react-i18next";
import { PlaceOfInterestApi, PlaceOfInterestMapDTO } from "@/features/geo/geoApi";
import { normalizeGeoLanguage } from "@/features/geo/geoLanguage";

// Represente les noms localisés d'une ville dans différentes langues.
export type LocalizedPlaceNames = {
  fr?: string | null;
  de?: string | null;
  it?: string | null;
  en?: string | null;
  ro?: string | null;
};

// Représente une ville à afficher sur la carte.
export type PlaceOfInterestMarker = {
  code: string;
  name: string;
  names?: LocalizedPlaceNames;
  pos: LatLngExpression;
  source: "backend" | "local";
};

// Structure de retour du hook usePlaceOfInterestMarkers.
type UsePlaceOfInterestMarkersResult = {
  placeOfInterest: PlaceOfInterestMarker[];
  backendPlaceOfInterest: PlaceOfInterestMarker[];
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

const LOCAL_PLACE_OF_INTEREST_STORAGE_KEY = "map_extra_place_of_interest";

const isValidLocalizedPlaceNames = (
  value: unknown
): value is LocalizedPlaceNames => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const names = value as Record<string, unknown>;

  return ["fr", "de", "it", "en", "ro"].every((lang) => {
    const name = names[lang];

    return (
      name === undefined ||
      name === null ||
      typeof name === "string"
    );
  });
};

const isValidLocalPlaceOfInterest = (value: unknown): value is PlaceOfInterestMarker => {
  if (!value || typeof value !== "object") return false;

  const item = value as PlaceOfInterestMarker;
  const pos = item.pos as unknown;

  return (
    typeof item.code === "string" &&
    typeof item.name === "string" &&
    item.source === "local" &&
    (
      item.names === undefined ||
      isValidLocalizedPlaceNames(item.names)
    ) &&
    Array.isArray(pos) &&
    pos.length === 2 &&
    typeof pos[0] === "number" &&
    typeof pos[1] === "number" &&
    Number.isFinite(pos[0]) &&
    Number.isFinite(pos[1])
  );
};

const loadLocalPlaceOfInterest = (): PlaceOfInterestMarker[] => {
  try {
    const raw = window.localStorage.getItem(LOCAL_PLACE_OF_INTEREST_STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidLocalPlaceOfInterest);
  } catch (error) {
    console.warn(
      "[usePlaceOfInterestMarkers] Impossible de charger les lieux d'intérêt locaux à partir de localStorage.",
      error
    );

    return [];
  }
};

const saveLocalPlaceOfInterest = (items: PlaceOfInterestMarker[]) => {
  try {
    window.localStorage.setItem(
      LOCAL_PLACE_OF_INTEREST_STORAGE_KEY,
      JSON.stringify(items)
    );
  } catch (error) {
    console.warn(
      "[usePlaceOfInterestMarkers] Impossible d'enregistrer les lieux d'intérêt locaux dans localStorage.",
      error
    );
  }
};

const resolveLocalPlaceOfInterestName = (
    placeOfInterest: PlaceOfInterestMarker,
    lang: string
  ): string => {
    const localizedName =
      placeOfInterest.names?.[
        lang as keyof LocalizedPlaceNames
      ];

    if (
      typeof localizedName === "string" &&
      localizedName.trim()
    ) {
      return localizedName.trim();
    }

    return placeOfInterest.name;
  };

export function usePlaceOfInterestMarkers(lang: string): UsePlaceOfInterestMarkersResult {
  const { t } = useTranslation();
  const [backendPlaceOfInterest, setBackendPlaceOfInterest] = useState<PlaceOfInterestMarker[]>([]);
  const [extraPlaceOfInterest, setExtraPlaceOfInterest] = useState<PlaceOfInterestMarker[]>(() => loadLocalPlaceOfInterest());
  const [hideAllBackend, setHideAllBackend] = useState(false);
  const [hiddenCodes, setHiddenCodes] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedLang = normalizeGeoLanguage(lang);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveLocalPlaceOfInterest(extraPlaceOfInterest);
  }, [extraPlaceOfInterest]);

  useEffect(() => {
    const cached = backendCacheByLang[normalizedLang];
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
      .list(normalizedLang, ctrl.signal)
      .then((raw: PlaceOfInterestMapDTO[]) => {
        const markers: PlaceOfInterestMarker[] = raw.map((c) => ({
          code: c.code,
          name: c.name,
          pos: c.pos,
          source: "backend",
        }));
        backendCacheByLang[normalizedLang] = markers;
        setBackendPlaceOfInterest(markers);
      })
      .catch((e: any) => {
        if (ctrl.signal.aborted) return;
        setError(e?.message || t("map.errors.failedToLoadPlaceOfInterest"));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => {
      ctrl.abort();
    };
  }, [normalizedLang, t]);

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

  const localizedExtraPlaceOfInterest = useMemo(
    () =>
      extraPlaceOfInterest.map((placeOfInterest) => ({
        ...placeOfInterest,
        name: resolveLocalPlaceOfInterestName(
          placeOfInterest,
          normalizedLang
        ),
      })),
    [extraPlaceOfInterest, normalizedLang]
  );

  // Liste finale des villes visibles enregistrer mais pas dans le stockage local
  const placeOfInterest = useMemo(() => {
    // Si le toggle global est OFF, on ne montre aucune ville (backend + locales)
    if (hideAllBackend) {
        return [];
    }

    const visibleBackend = backendPlaceOfInterest.filter(
      (placeOfInterest) =>
        !hiddenCodes.has(placeOfInterest.code)
    );

    const visibleExtras = localizedExtraPlaceOfInterest.filter(
      (placeOfInterest) =>
        !hiddenCodes.has(placeOfInterest.code)
    );

    return [...visibleBackend, ...visibleExtras];
  }, [backendPlaceOfInterest, localizedExtraPlaceOfInterest, hideAllBackend, hiddenCodes]);

  return {
    placeOfInterest,
    backendPlaceOfInterest,
    loading,
    error,
    hideAllBackend,
    setHideAllBackend,
    hiddenCodes,
    togglePlaceOfInterestHidden,
    extraPlaceOfInterest:localizedExtraPlaceOfInterest,
    addExtraPlaceOfInterest,
    removeExtraPlaceOfInterest,
  };
}

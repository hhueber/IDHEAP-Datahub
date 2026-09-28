import { useCallback, useEffect, useState } from "react";
import {
  CHOROPLETH_INTENSITY_DEFAULT,
  CHOROPLETH_INTENSITY_MAX,
  CHOROPLETH_INTENSITY_MIN,
} from "./choroplethColorAdjustment";

const STORAGE_KEY = "map_choropleth_color_intensity";

function readStoredIntensity(): number {
  if (typeof window === "undefined") {
    return CHOROPLETH_INTENSITY_DEFAULT;
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (storedValue == null) {
      return CHOROPLETH_INTENSITY_DEFAULT;
    }

    const parsed = Number(storedValue);

    if (!Number.isFinite(parsed)) {
      return CHOROPLETH_INTENSITY_DEFAULT;
    }

    if (
      parsed < CHOROPLETH_INTENSITY_MIN ||
      parsed > CHOROPLETH_INTENSITY_MAX
    ) {
      return CHOROPLETH_INTENSITY_DEFAULT;
    }

    return parsed;
  } catch {
    return CHOROPLETH_INTENSITY_DEFAULT;
  }
}

export default function useChoroplethColorAdjustment() {
  const [colorIntensity, setColorIntensity] =
    useState<number>(readStoredIntensity);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        String(colorIntensity)
      );
    } catch {
      // LocalStorage indisponible :
      // le réglage reste simplement valable pour la session courante.
    }
  }, [colorIntensity]);

  const resetColorIntensity = useCallback(() => {
    setColorIntensity(CHOROPLETH_INTENSITY_DEFAULT);
  }, []);

  return {
    colorIntensity,
    setColorIntensity,
    resetColorIntensity,
  };
}

export function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex) return `rgba(0,0,0,${alpha})`; // fallback gris
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeHex(hex: string): string | null {
  if (!hex) return null;
  let h = hex.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    // ex: #f0a -> #ff00aa
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6) return null;
  return h;
}

function hexToRgb(hex: string | undefined): { r: number; g: number; b: number } | null {
  const h = hex ? normalizeHex(hex) : null;
  if (!h) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

// Luminance perçue (approx, 0 = très sombre, 1 = très clair)
function getPerceivedLightness(hex: string | undefined): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5; // neutre si invalide

  const { r, g, b } = rgb;
  // simple perception approximative
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return Math.min(1, Math.max(0, l));
}

/**
 * Retourne une couleur de texte (entre blanc/noir/tons de gris)
 * adaptée à la luminosité du fond donné.
 * → Même input => même output (déterministe).
 */
export function getAdaptiveTextColor(bgHex: string | undefined): string {
  const l = getPerceivedLightness(bgHex);

  // Quelques paliers simples :
  // - fond très sombre -> texte quasi blanc
  // - fond sombre à moyen -> gris clair
  // - fond moyen à clair -> gris foncé
  // - fond très clair -> presque noir
  if (l <= 0.25) {
    // fond très sombre
    return "#FFFFFF"; // quasi blanc
  }
  if (l <= 0.45) {
    // fond sombre
    return "#E5E7EB"; // gris très clair
  }
  if (l <= 0.7) {
    // fond moyen
    return "#374151"; // gris foncé
  }
  // fond très clair
  return "#111827"; // quasi noir
}
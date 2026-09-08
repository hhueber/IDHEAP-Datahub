/**
 * Utilitaires de rendu des couleurs du choropleth.
 *
 * Les couleurs reçues du backend ne sont jamais modifiées dans les données.
 * La transformation est uniquement appliquée au moment du rendu frontend.
 */

export const CHOROPLETH_INTENSITY_MIN = 0;
export const CHOROPLETH_INTENSITY_MAX = 200;
export const CHOROPLETH_INTENSITY_DEFAULT = 100;

type RGB = {
  r: number;
  g: number;
  b: number;
};

type HSL = {
  h: number;
  s: number;
  l: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normalise une couleur hexadécimale.
 * Support :
 * - #RGB
 * - #RRGGBB
 */
function normalizeHex(hex: string): string | null {
  if (!hex) return null;

  const value = hex.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toUpperCase();
  }

  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const r = value[1];
    const g = value[2];
    const b = value[3];

    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return null;
}

function hexToRgb(hex: string): RGB | null {
  const normalized = normalizeHex(hex);

  if (!normalized) return null;

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (value: number) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta !== 0) {
    s =
      l > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min);

    switch (max) {
      case rn:
        h = (gn - bn) / delta + (gn < bn ? 6 : 0);
        break;

      case gn:
        h = (bn - rn) / delta + 2;
        break;

      default:
        h = (rn - gn) / delta + 4;
        break;
    }

    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const gray = l * 255;

    return {
      r: gray,
      g: gray,
      b: gray,
    };
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    let value = t;

    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;

    return p;
  };

  const q =
    l < 0.5
      ? l * (1 + s)
      : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hueToRgb(p, q, h + 1 / 3) * 255,
    g: hueToRgb(p, q, h) * 255,
    b: hueToRgb(p, q, h - 1 / 3) * 255,
  };
}

/**
 * Modifie visuellement une couleur de choropleth.
 * 100 = couleur backend originale.
 * < 100 :
 * - couleur plus claire ;
 * - saturation réduite ;
 * - rendu plus discret.
 * > 100 :
 * - saturation renforcée ;
 * - contraste de luminosité renforcé ;
 * - rendu plus marqué.
 */
export function adjustChoroplethColor(
  color: string,
  intensity: number
): string {
  const rgb = hexToRgb(color);

  // Si le backend renvoie un format inattendu, on ne touche pas à la couleur.
  if (!rgb) {
    return color;
  }

  const safeIntensity = clamp(
    intensity,
    CHOROPLETH_INTENSITY_MIN,
    CHOROPLETH_INTENSITY_MAX
  );

  // Valeur d'origine : aucune transformation.
  if (safeIntensity === CHOROPLETH_INTENSITY_DEFAULT) {
    return normalizeHex(color) ?? color;
  }

  const hsl = rgbToHsl(rgb);

  if (safeIntensity < CHOROPLETH_INTENSITY_DEFAULT) {
    const ratio =
      safeIntensity / CHOROPLETH_INTENSITY_DEFAULT;

    const reduction = 1 - ratio;
    // Réduit progressivement la saturation.
    hsl.s *= 1 - 0.7 * reduction;
    // Rapproche progressivement la couleur du blanc.
    hsl.l += (0.96 - hsl.l) * 0.85 * reduction;
  } else {
    const ratio =
      (safeIntensity - CHOROPLETH_INTENSITY_DEFAULT) /
      (CHOROPLETH_INTENSITY_MAX -
        CHOROPLETH_INTENSITY_DEFAULT);

    // Renforce progressivement la saturation.
    hsl.s += (1 - hsl.s) * 0.65 * ratio;
    // Éloigne légèrement la luminosité du gris médian.
    // Les couleurs claires deviennent un peu plus claires,
    // les couleurs foncées un peu plus foncées.
    hsl.l =
      0.5 +
      (hsl.l - 0.5) * (1 + 0.45 * ratio);

    hsl.l = clamp(hsl.l, 0.08, 0.92);
  }

  hsl.s = clamp(hsl.s, 0, 1);
  hsl.l = clamp(hsl.l, 0, 1);

  return rgbToHex(hslToRgb(hsl));
}

/**
 * Ajuste l'opacité du choropleth en fonction de l'intensité.
 * Cela permet d'obtenir un rendu réellement plus transparent lorsque
 * l'utilisateur descend le slider, sans modifier les autres couches.
 */
export function adjustChoroplethOpacity(
  baseOpacity: number,
  intensity: number
): number {
  const safeIntensity = clamp(
    intensity,
    CHOROPLETH_INTENSITY_MIN,
    CHOROPLETH_INTENSITY_MAX
  );

  const safeBaseOpacity = clamp(baseOpacity, 0, 1);

  if (safeIntensity === CHOROPLETH_INTENSITY_DEFAULT) {
    return safeBaseOpacity;
  }

  if (safeIntensity < CHOROPLETH_INTENSITY_DEFAULT) {
    const ratio =
      safeIntensity / CHOROPLETH_INTENSITY_DEFAULT;
    // À 0, environ 15 % de l'opacité originale reste visible.
    const opacityFactor = 0.15 + 0.85 * ratio;

    return safeBaseOpacity * opacityFactor;
  }

  const ratio =
    (safeIntensity - CHOROPLETH_INTENSITY_DEFAULT) /
    (CHOROPLETH_INTENSITY_MAX -
      CHOROPLETH_INTENSITY_DEFAULT);
  // Au-dessus de 100, on tend progressivement vers 100 % d'opacité.
  return safeBaseOpacity + (1 - safeBaseOpacity) * ratio;
}

/**
 * Indique si la couleur correspond réellement à une réponse.
 * Les couleurs de no_data / no_response restent ainsi inchangées.
 */
export function shouldAdjustChoroplethFeature(
  properties: any
): boolean {
  return properties?.value_kind === "value";
}

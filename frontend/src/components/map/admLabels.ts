// Affiche une infobulle (étiquette) avec le nom du canton au survol
import type { Feature, Geometry } from "geojson";
import type { Layer } from "leaflet";

/** Lit le premier nom disponible parmi plusieurs clés possibles */
function pickName(
  props: Record<string, any> | undefined,
  keys: string[],
  fallback?: string
) {
  if (!props) return fallback ?? "";
  for (const k of keys) {
    const v = props[k];
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return fallback ?? "";
}

const CANTON_KEYS = ["name", "label", "nom", "canton", "canton_name", "abbr"];

/** Mémorise le poids initial par couche pour restaurer à la sortie de survol */
const baseWeights = new WeakMap<Layer, number>();

/** onEachFeature spécifique aux cantons : infobulle + highlight */
export function onEachCanton(feature: Feature<Geometry, any>, layer: Layer) {
  const props = (feature && feature.properties) || {};

  // Nom affiché dans l’infobulle
  const name =
    pickName(props, CANTON_KEYS) ||
    (props?.uid ? `#${props.uid}` : "Canton");

  // Mémoriser le weight initial UNE SEULE FOIS
  // @ts-ignore leaflet types
  const initial = (layer as any)?.options?.weight ?? 1;
  baseWeights.set(layer, initial);

  // Infobulle "sticky"
  // @ts-ignore leaflet/ts merge
  layer.bindTooltip(name, {
    sticky: true,
    direction: "top",
    opacity: 0.95,
    className: "map-tooltip",
  });

  // Survol: augmenter légèrement la bordure
  // @ts-ignore
  layer.on("mouseover", (e: any) => {
    const base = baseWeights.get(e.target) ?? initial;
    if (e?.target?.setStyle) e.target.setStyle({ weight: base + 1 });
    // pas de bringToFront
  });

  // Sortie: restaurer exactement le poids initial
  // @ts-ignore
  layer.on("mouseout", (e: any) => {
    const base = baseWeights.get(e.target) ?? initial;
    if (e?.target?.setStyle) e.target.setStyle({ weight: base });
  });
}

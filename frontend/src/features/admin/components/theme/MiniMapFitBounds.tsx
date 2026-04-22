import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

type Props = {
  collections: Array<any | undefined>;
};

export default function MiniMapFitBounds({ collections }: Props) {
  const map = useMap();

  useEffect(() => {
    const validCollections = collections.filter(
      (c) =>
        c &&
        c.type === "FeatureCollection" &&
        Array.isArray(c.features) &&
        c.features.length > 0
    );

    if (!validCollections.length) return;

    const group = L.featureGroup();

    validCollections.forEach((collection) => {
      const layer = L.geoJSON(collection);
      group.addLayer(layer);
    });

    const bounds = group.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [16, 16],
        maxZoom: 9,
      });
    }

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [map, collections]);

  return null;
}

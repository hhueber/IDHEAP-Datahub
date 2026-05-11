/** Couche GeoJSON simple réutilisable pour les mini-maps. */
import React from "react";
import { GeoJSON, Pane } from "react-leaflet";

type Props = {
  paneName: string;
  zIndex: number;
  data: any;
  geoJsonKey: string;
  style: any;
  interactive?: boolean;
};

export default function MiniMapGeoJsonLayer({
  paneName,
  zIndex,
  data,
  geoJsonKey,
  style,
  interactive = false,
}: Props) {
  return (
    <Pane name={paneName} style={{ zIndex }}>
      <GeoJSON
        key={geoJsonKey}
        data={data}
        style={() => style}
        pane={paneName}
        interactive={interactive}
      />
    </Pane>
  );
}

import React from "react";
import { GeoJSON, MapContainer, Pane } from "react-leaflet";
import { useTheme } from "@/theme/useTheme";
import type { InsightMap } from "@/features/pageShow/show_type";

type Props = {
  mapData: InsightMap;
};

export default function InsightsMiniMap({ mapData }: Props) {
  const { background, borderColor, primary } = useTheme();

  const contextStyle = React.useMemo(
    () => ({
      color: borderColor,
      weight: 1.1,
      fillOpacity: 0,
    }),
    [borderColor]
  );

  const focusStyle = React.useMemo(
    () => ({
      color: primary,
      weight: 2.2,
      fillColor: primary,
      fillOpacity: 0.24,
    }),
    [primary]
  );

  return (
    <div className="w-full h-full overflow-hidden rounded-xl">
      <MapContainer
        center={[46.8182, 8.2275]}
        zoom={8}
        minZoom={7}
        maxZoom={12}
        zoomControl={true}
        dragging={true}
        doubleClickZoom={true}
        scrollWheelZoom={false}
        boxZoom={true}
        keyboard={true}
        attributionControl={false}
        className="w-full h-full"
        style={{ background }}
      >
        <Pane name="pane-context" style={{ zIndex: 200 }}>
          <GeoJSON
            data={{
              type: "FeatureCollection",
              features: mapData.context_features ?? [],
            } as any}
            style={() => contextStyle}
            pane="pane-context"
          />
        </Pane>

        <Pane name="pane-focus" style={{ zIndex: 300 }}>
          <GeoJSON
            data={mapData.focus_feature as any}
            style={() => focusStyle}
            pane="pane-focus"
          />
        </Pane>
      </MapContainer>
    </div>
  );
}

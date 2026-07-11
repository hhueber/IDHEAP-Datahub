/** Mini-map métier du panneau Insights de la page show : contexte, focus et enfants géographiques interactifs. */
import React from "react";
import { useTheme } from "@/theme/useTheme";
import type { Entity, InsightMap } from "@/features/pageShow/show_type";
import MiniMapBase from "@/features/maps/miniMap/MiniMapBase";
import MiniMapGeoJsonLayer from "@/features/maps/miniMap/MiniMapGeoJsonLayer";
import MiniMapInteractiveGeoJsonLayer from "@/features/maps/miniMap/MiniMapInteractiveGeoJsonLayer";

type Props = {
  mapData: InsightMap;
  onChildClick?: (entity: Entity, uid: number) => void;
};

export default function InsightsMiniMap({ mapData, onChildClick }: Props) {
  const { borderColor, primary, selectionColor, } = useTheme();

  const focusUid = mapData?.focus_feature?.properties?.uid ?? "no-focus";
  const mapKey = `${mapData.level}-${focusUid}`;

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

  const childStyle = React.useMemo(
    () => ({
      color: borderColor,
      weight: 1.5,
      fillColor: primary,
      fillOpacity: 0.06,
    }),
    [borderColor, primary]
  );

  const childHoverStyle = React.useMemo(
    () => ({
      color: selectionColor,
      weight: 3,
      fillColor: primary,
      fillOpacity: 0.12,
    }),
    [primary]
  );

  return (
    <MiniMapBase mapKey={mapKey}>
      <MiniMapGeoJsonLayer
        paneName="pane-context"
        zIndex={200}
        geoJsonKey={`context-${mapKey}`}
        data={{
          type: "FeatureCollection",
          features: mapData.context_features ?? [],
        }}
        style={contextStyle}
        interactive={false}
      />

      <MiniMapGeoJsonLayer
        paneName="pane-focus"
        zIndex={240}
        geoJsonKey={`focus-${mapKey}`}
        data={mapData.focus_feature as any}
        style={focusStyle}
        interactive={false}
      />

      {(mapData.child_layers ?? []).map((layerDef, index) => (
        <MiniMapInteractiveGeoJsonLayer
          key={`${mapKey}-${layerDef.child_key}-${index}`}
          paneName={`pane-child-${index}`}
          zIndex={300 + index}
          geoJsonKey={`${mapKey}-${layerDef.child_key}-geojson-${index}`}
          data={{
            type: "FeatureCollection",
            features: layerDef.features ?? [],
          }}
          baseStyle={childStyle}
          hoverStyle={childHoverStyle}
          meta={{ entity: layerDef.child_entity }}
          getTooltipLabel={(feature) => {
            const props = feature?.properties ?? {};
            return String(props.name ?? props.label ?? props.code ?? `#${props.uid}`);
          }}
          onFeatureClick={(feature, meta) => {
            const uid = feature?.properties?.uid;
            const entity = meta?.entity;
            if (uid != null && entity && onChildClick) {
              onChildClick(entity, Number(uid));
            }
          }}
        />
      ))}
    </MiniMapBase>
  );
}

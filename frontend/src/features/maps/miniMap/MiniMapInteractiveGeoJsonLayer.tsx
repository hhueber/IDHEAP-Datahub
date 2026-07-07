/** Couche GeoJSON interactive réutilisable avec tooltip, hover et clic. */
import React from "react";
import { GeoJSON, Pane } from "react-leaflet";

type Props<TMeta = any> = {
  paneName: string;
  zIndex: number;
  data: any;
  geoJsonKey: string;
  baseStyle: any;
  hoverStyle?: any;
  getTooltipLabel?: (feature: any) => string;
  onFeatureClick?: (feature: any, meta?: TMeta) => void;
  meta?: TMeta;
};

export default function MiniMapInteractiveGeoJsonLayer<TMeta = any>({
  paneName,
  zIndex,
  data,
  geoJsonKey,
  baseStyle,
  hoverStyle,
  getTooltipLabel,
  onFeatureClick,
  meta,
}: Props<TMeta>) {
  return (
    <Pane name={paneName} style={{ zIndex }}>
      <GeoJSON
        key={geoJsonKey}
        data={data}
        style={() => baseStyle}
        pane={paneName}
        interactive={true}
        onEachFeature={(feature: any, layer: any) => {
          const label = getTooltipLabel?.(feature);
          if (label) {
            layer.bindTooltip(label, {
              sticky: true,
              opacity: 1,
            });
          }

          if (hoverStyle) {
            layer.on("mouseover", () => {
              layer.setStyle(hoverStyle);
              if (layer.bringToFront) {
                layer.bringToFront();
              }
            });

            layer.on("mouseout", () => {
              layer.setStyle(baseStyle);
            });
          }

          if (onFeatureClick) {
            layer.on("click", () => {
              onFeatureClick(feature, meta);
            });
          }
        }}
      />
    </Pane>
  );
}

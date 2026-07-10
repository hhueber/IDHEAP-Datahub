/** Base commune des mini-maps Leaflet : conteneur, configuration et remount via mapKey. */
import React from "react";
import { MapContainer } from "react-leaflet";
import { useTheme } from "@/theme/useTheme";

type Props = {
  mapKey: string;
  children: React.ReactNode;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  mapBackground?: string;
};

export default function MiniMapBase({
  mapKey,
  children,
  center = [46.8182, 8.2275],
  zoom = 8,
  minZoom = 7,
  maxZoom = 12,
  className = "w-full h-full",
  mapBackground,
}: Props) {
  const { background } = useTheme();

  return (
    <div className="w-full h-full overflow-hidden rounded-xl">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        zoomControl={true}
        dragging={true}
        doubleClickZoom={true}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
        className={className}
        style={{ background: mapBackground ?? background }}
      >
        {children}
      </MapContainer>
    </div>
  );
}

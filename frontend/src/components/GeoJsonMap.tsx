import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";

type AnyGeoJson = GeoJSON.FeatureCollection | GeoJSON.Feature | null;

export default function GeoJsonMap({ className = "w-full h-full" }: { className?: string }) {
  const [data, setData] = useState<AnyGeoJson>(null);

  useEffect(() => {
    fetch("/src/data/sample.geojson")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch((e) => console.error("Failed to load GeoJSON:", e));
  }, []);

  const style = useMemo(
    () => ({ color: "#4f46e5", weight: 1, fillColor: "#f43f5e", fillOpacity: 0.3 }),
    []
  );

  return (
    <div className={`${className} overflow-hidden`}>
      <MapContainer
        center={[46.8182, 8.2275]}
        zoom={7}
        className="w-full h-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data && <GeoJSON data={data as any} style={() => style} />}
      </MapContainer>
    </div>
  );
}
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import ResetSwissControl from "@/components/map/ResetSwissControl";

type AnyGeoJson = GeoJSON.FeatureCollection | GeoJSON.Feature | null;

function MapSizeFixer({ host }: { host: HTMLElement | null }) {
  const map = useMap();
  useLayoutEffect(() => { map.invalidateSize(false); }, [map]);
  useEffect(() => {
    const bump = () => map.invalidateSize(false);
    const raf = requestAnimationFrame(bump);
    const t = setTimeout(bump, 200);
    let ro: ResizeObserver | null = null;
    if (host && "ResizeObserver" in window) { ro = new ResizeObserver(bump); ro.observe(host); }
    window.addEventListener("resize", bump);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener("resize", bump); if (ro && host) ro.unobserve(host); };
  }, [map, host]);
  return null;
}

export default function GeoJsonMap({ className = "absolute inset-0" }: { className?: string }) {
  const [data, setData] = useState<AnyGeoJson>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/src/data/sample.geojson")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => console.error("Failed to load GeoJSON:", e));
  }, []);

  const style = useMemo(() => ({ color: "#4f46e5", weight: 1, fillColor: "#f43f5e", fillOpacity: 0.3 }), []);

  return (
    <div ref={hostRef} data-map-root className={`${className} overflow-hidden`}>
      {/* Décale les contrôles juste sous le bouton flottant */}
      <style>{`
        [data-map-root] .leaflet-top { top: var(--leaflet-top-offset, 96px); }
        [data-map-root] .leaflet-left { left: 12px; }
      `}</style>

      <MapContainer
        center={[46.8182, 8.2275]}
        zoom={7}
        className="w-full h-full"
        scrollWheelZoom
      >
        <MapSizeFixer host={hostRef.current} />
        <ResetSwissControl position="topleft" />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data && <GeoJSON data={data as any} style={() => style} />}
      </MapContainer>
    </div>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_THEME_CONFIG } from "@/theme/defaultThemeConfig";
import { getThemeTokens } from "@/theme/themeTokens";
import { getAdaptiveTextColor } from "@/utils/color";
import { fetchThemeMapPreview } from "@/services/config";
import type { ThemeMapPreviewBundle } from "@/features/admin/components/theme/themeMapPreview.types";
import MiniMapBase from "@/features/maps/miniMap/MiniMapBase";
import MiniMapGeoJsonLayer from "@/features/maps/miniMap/MiniMapGeoJsonLayer";
import MiniMapFitBounds from "@/features/admin/components/theme/MiniMapFitBounds";
import InsightsLoadingOverlay from "@/features/pageShow/InsightsLoadingOverlay";

type MaybeColor = string | null | undefined;

function normalizeColor(color: MaybeColor, fallback: string): string {
  if (!color) return fallback;
  const trimmed = color.trim();

  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;

  return fallback;
}

export type MapPreviewPanelProps = {
  variant: "light" | "dark";
  title: string;
  backgroundColor?: MaybeColor;
  borderColor?: MaybeColor;
  communeColor?: MaybeColor;
  districtColor?: MaybeColor;
  cantonColor?: MaybeColor;
  countryColor?: MaybeColor;
  lakesColor?: MaybeColor;
};

export default function MapPreviewPanel({
  variant,
  title,
  backgroundColor,
  borderColor,
  communeColor,
  districtColor,
  cantonColor,
  countryColor,
  lakesColor,
}: MapPreviewPanelProps) {
  const { t } = useTranslation();

  const baseTokens = getThemeTokens(DEFAULT_THEME_CONFIG, variant);
  const bg = normalizeColor(backgroundColor, baseTokens.background);
  const panelBorder = normalizeColor(borderColor, baseTokens.borderColor);

  const commune = normalizeColor(communeColor, baseTokens.communesColores);
  const district = normalizeColor(districtColor, baseTokens.districtColores);
  const canton = normalizeColor(cantonColor, baseTokens.cantonColores);
  const country = normalizeColor(countryColor, baseTokens.countryColors);
  const lakes = normalizeColor(lakesColor, baseTokens.lakesColores);

  const [data, setData] = React.useState<ThemeMapPreviewBundle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchThemeMapPreview();

        if (!cancelled) {
          setData(res);
        }
      } catch (e) {
        console.error(e);

        if (!cancelled) {
          setError("loadError");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const mapKey = React.useMemo(() => {
    return [
      variant,
      commune,
      district,
      canton,
      country,
      lakes,
      data?.year?.requested ?? "no-year",
    ].join("-");
  }, [variant, commune, district, canton, country, lakes, data?.year?.requested]);

  return (
    <div
      className="rounded-xl border p-3 text-xs shadow-sm"
      style={{
        backgroundColor: bg,
        color: getAdaptiveTextColor(bg),
        borderColor: panelBorder,
      }}
    >
      <div className="mb-2 text-[11px] font-semibold opacity-80">{title}</div>

      <div className="relative h-[240px] sm:h-[300px] lg:h-[240px] w-full overflow-hidden rounded-xl border">
        {loading && <InsightsLoadingOverlay />}

        {!loading && error && (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm opacity-70">
            {t("admin.config.themeConfigPage.loadError")}
          </div>
        )}

        {!loading && !error && data && (
          <MiniMapBase
            mapKey={mapKey}
            zoom={8}
            minZoom={7}
            maxZoom={10}
            className="w-full h-full"
            mapBackground={bg}
          >
            <MiniMapFitBounds
              collections={[
                data.country,
                data.cantons,
                data.districts,
                data.communes,
                data.lakes,
              ]}
            />

            {data.country && (
              <MiniMapGeoJsonLayer
                paneName={`country-${variant}`}
                zIndex={100}
                data={data.country}
                geoJsonKey={`country-${mapKey}`}
                style={{
                  color: country,
                  weight: 1.2,
                  fillColor: bg,
                  fillOpacity: 1,
                }}
              />
            )}

            {data.cantons && (
              <MiniMapGeoJsonLayer
                paneName={`cantons-${variant}`}
                zIndex={400}
                data={data.cantons}
                geoJsonKey={`cantons-${mapKey}`}
                style={{
                  color: canton,
                  weight: 2,
                  fillOpacity: 0,
                }}
              />
            )}

            {data.districts && (
              <MiniMapGeoJsonLayer
                paneName={`districts-${variant}`}
                zIndex={300}
                data={data.districts}
                geoJsonKey={`districts-${mapKey}`}
                style={{
                  color: district,
                  weight: 1.2,
                  fillOpacity: 0,
                }}
              />
            )}

            {data.communes && (
              <MiniMapGeoJsonLayer
                paneName={`communes-${variant}`}
                zIndex={200}
                data={data.communes}
                geoJsonKey={`communes-${mapKey}`}
                style={{
                  color: commune,
                  weight: 0.6,
                  fillOpacity: 0,
                }}
              />
            )}

            {data.lakes && (
              <MiniMapGeoJsonLayer
                paneName={`lakes-${variant}`}
                zIndex={500}
                data={data.lakes}
                geoJsonKey={`lakes-${mapKey}`}
                style={{
                  color: lakes,
                  weight: 1.2,
                  fillColor: lakes,
                  fillOpacity: 0.95,
                }}
              />
            )}
          </MiniMapBase>
        )}
      </div>
    </div>
  );
}

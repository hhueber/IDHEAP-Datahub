import { ChoroplethResponse } from "@/features/geo/geoApi";
import { useTheme } from "@/theme/useTheme";

type Props = {
  choropleth: ChoroplethResponse;
  panelOpen?: boolean;
};

function fmtTick(x: number): string {
  if (!Number.isFinite(x)) return "";
  if (Math.abs(x) >= 1000) return Math.round(x).toLocaleString("fr-CH");
  if (Math.abs(x) >= 10) return x.toFixed(0);
  return x.toFixed(2);
}

export default function MapLegendOverlay({ choropleth, panelOpen = false }: Props) {
  const { background, borderColor, textColor, hoverText07 } = useTheme();

  const legend = choropleth.legend as any;
  const isGradient = legend?.type === "gradient";
  const g = legend?.gradient;

  const drawerShift = "calc(-1 * min(90vw, 28rem))";

  return (
    <div
      className="
        absolute z-[1200]
        right-4 top-1/2
        w-[200px]
        rounded-2xl shadow-lg
        p-3
        overflow-visible
        transition-transform duration-300 ease-out
      "
      style={{
        transform: panelOpen ? `translate(${drawerShift}, -50%)` : "translate(0, -50%)",
        backgroundColor: background,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: borderColor,
        color: textColor,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: 0.95,
      }}
    >
      <div className="text-base font-semibold mb-3">{legend.title}</div>

      {/* Gradient */}
      {isGradient && g ? (
        <>
          <div className="flex gap-4">
            {/* Ticks */}
            <div className="relative h-72 w-20">
              {Array.isArray(g.ticks) &&
                g.ticks.map((t: number, i: number) => {
                  const ratio = g.vmax === g.vmin ? 0 : (t - g.vmin) / (g.vmax - g.vmin);
                  const y = (1 - ratio) * 100;

                  return (
                    <div
                      key={i}
                      className="absolute left-0 flex items-center gap-2 text-sm"
                      style={{ top: `${y}%`, transform: "translateY(-50%)", color: hoverText07 }}
                    >
                      <span className="tabular-nums">{fmtTick(t)}</span>
                      <span
                        className="h-[1px] w-3"
                        style={{ backgroundColor: hoverText07, opacity: 0.6 }}
                      />
                    </div>
                  );
                })}
            </div>

            {/* Barre gradient */}
            <div
              className="h-72 w-8 rounded-xl"
              style={{
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: borderColor,
                background: `linear-gradient(to top, ${g.start}, ${g.end})`,
              }}
            />
          </div>

          {/* Items spéciaux sous la barre (No data / No response) */}
          {Array.isArray(legend.items) && legend.items.length > 0 && (
            <div
              className="mt-4 pt-3 space-y-2"
              style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: borderColor }}
            >
              {legend.items.map((it: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span
                    className="inline-block h-4 w-4 rounded-md"
                    style={{
                      backgroundColor: it.color, // vient du backend
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: borderColor,
                    }}
                  />
                  <span className="truncate">{it.label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Categorical */
        <div className="space-y-2">
          {Array.isArray(legend.items) &&
            legend.items.map((it: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <span
                  className="inline-block h-4 w-4 rounded-md"
                  style={{
                    backgroundColor: it.color, // vient du backend
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: borderColor,
                  }}
                />
                <span className="truncate">{it.label}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

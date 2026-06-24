import React from "react";
import { useTheme } from "@/theme/useTheme";
import type { ShowInsights } from "@/features/pageShow/show_type";
import InsightsMiniMap from "@/features/pageShow/InsightsMiniMap";
import { useTranslation } from "react-i18next";

type Props = {
  insights?: ShowInsights | null;
};

type TabKey = "map" | "stats";

export default function InsightsPanel({ insights }: Props) {
  const { t } = useTranslation();
  const { background, borderColor, textColor, hoverPrimary04, hoverText07 } = useTheme();

  const hasMap = !!insights?.map;
  const hasStats = !!insights?.stats?.items?.length;

  const tabs: { key: TabKey; label: string }[] = [];
  if (hasMap) tabs.push({ key: "map", label: t("dashboardSidebar.pageShow.insightsPanel.map") });
  if (hasStats) tabs.push({ key: "stats", label: t("dashboardSidebar.pageShow.insightsPanel.stats") });

  const [tab, setTab] = React.useState<TabKey | null>(tabs[0]?.key ?? null);

  React.useEffect(() => {
    setTab(tabs[0]?.key ?? null);
  }, [hasMap, hasStats]);

  if (!tabs.length) {
    return (
      <div className="text-sm" style={{ color: hoverText07 }}>
        {t("dashboardSidebar.pageShow.insightsPanel.noInsights")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className="px-3 py-1.5 text-sm rounded-lg border transition-colors"
            style={{
              borderColor,
              backgroundColor: tab === item.key ? hoverPrimary04 : background,
              color: textColor,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "map" && hasMap && insights?.map && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor, backgroundColor: background }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor }}>
            <div className="text-sm font-semibold">{t("dashboardSidebar.pageShow.insightsPanel.map")}</div>
            <div className="text-xs" style={{ color: hoverText07 }}>
              {t("dashboardSidebar.pageShow.insightsPanel.mapContext")}
            </div>
          </div>

          <div className="h-[320px]">
            <InsightsMiniMap mapData={insights.map} />
          </div>
        </div>
      )}

      {tab === "stats" && hasStats && (
        <div
            className="rounded-xl border p-4"
            style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
            <div className="text-sm font-semibold mb-3">
            {t("dashboardSidebar.pageShow.insightsPanel.stats")}
            </div>

            <div className="flex flex-col gap-2">
            {insights?.stats?.items?.map((item, index) => (
                <div
                key={`${item.label_key}-${index}`}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2"
                style={{
                    backgroundColor: background,
                    border: `1px solid ${borderColor}`,
                }}
                >
                <span className="text-sm" style={{ color: hoverText07 }}>
                    {t(`dashboardSidebar.pageShow.insightsPanel.stat.${item.label_key}`)}
                </span>
                <span className="text-sm font-medium" style={{ color: textColor }}>
                    {typeof item.value === "boolean"
                    ? item.value
                        ? t("common.yes")
                        : t("common.no")
                    : item.value === null || item.value === undefined || item.value === ""
                    ? "—"
                    : String(item.value)}
                </span>
                </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import LoadingSpinner from "@/utils/LoadingSpinner";

export default function InsightsLoadingOverlay() {
  const { t } = useTranslation();
  const { background } = useTheme();

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
      style={{
        backgroundColor: `${background}CC`,
        backdropFilter: "blur(2px)",
      }}
      aria-hidden={false}
    >
      <LoadingSpinner label={t("common.loading")} />
    </div>
  );
}

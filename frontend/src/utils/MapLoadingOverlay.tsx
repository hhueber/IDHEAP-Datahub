import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import LoadingSpinner from "@/utils/LoadingSpinner";

export default function MapLoadingOverlay() {
  const { t } = useTranslation();
  const { background } = useTheme();

  return (
    <div
      className="absolute inset-0 z-[3400] flex items-center justify-center"
      style={{
        backgroundColor: `${background}CC`, // fond semi-transparent
        backdropFilter: "blur(2px)",
      }}
      aria-hidden={false}
    >
      <LoadingSpinner label={t("common.loading")} />
    </div>
  );
}
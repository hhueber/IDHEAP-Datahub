import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import LoadingSpinner from "@/utils/LoadingSpinner";
import LoadingDots from "@/utils/LoadingDots";

type Props = {
  label?: string;
  type?: "loading" | "action";
};

export default function MapLoadingOverlay({ label, type = "loading" }: Props) {
  const { t } = useTranslation();
  const { background } = useTheme();

  const finalLabel = label ?? t("common.loading");

  return (
    <div
      className="absolute inset-0 z-[3400] flex items-center justify-center"
      style={{
        backgroundColor: `${background}CC`,
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="flex flex-col items-center gap-3">
        {type === "loading" ? (
            <LoadingSpinner label={finalLabel} />
            ) : (
            <div className="flex items-center text-sm opacity-80">
                {/* texte fixe pour spinner */}
                <span>{finalLabel}</span>

                {/* les dots avec zone fixe */}
                <span className="inline-block w-[24px] text-left">
                <LoadingDots label="" />
                </span>
            </div>
        )}
      </div>
    </div>
  );
}

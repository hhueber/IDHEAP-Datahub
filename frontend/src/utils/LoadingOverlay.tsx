import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import LoadingSpinner from "@/utils/LoadingSpinner";
import LoadingDots from "@/utils/LoadingDots";

type LoadingOverlayProps = {
  label?: string;
  type?: "loading" | "action";
  /** Empilement au-dessus du contenu local (défaut 10) */
  zIndex?: number;
  /** Coins arrondis pour s'accorder au conteneur englobant (défaut true) */
  rounded?: boolean;
};

/** Overlay de chargement plein cadre (fond thème flouté + spinner ou dots) */
export default function LoadingOverlay({
  label,
  type = "loading",
  zIndex = 10,
  rounded = true,
}: LoadingOverlayProps) {
  const { t } = useTranslation();
  const { background } = useTheme();

  const finalLabel = label ?? t("common.loading");

  return (
    <div
      className={[
        "absolute inset-0 flex items-center justify-center",
        rounded ? "rounded-2xl" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: `${background}CC`,
        backdropFilter: "blur(2px)",
        zIndex,
      }}
      aria-hidden={false}
    >
      <div className="flex flex-col items-center gap-3">
        {type === "loading" ? (
          <LoadingSpinner label={finalLabel} />
        ) : (
          <div className="flex items-center text-sm opacity-80">
            <span>{finalLabel}</span>
            <span className="inline-block w-[24px] text-left">
              <LoadingDots label="" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

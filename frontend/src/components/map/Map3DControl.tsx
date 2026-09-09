import { useTheme } from "@/theme/useTheme";

type Props = {
  is3DMode: boolean;
  is3DAvailable: boolean;
  onToggle: () => void;
};

export default function Map3DControl({
  is3DMode,
  is3DAvailable,
  onToggle,
}: Props) {
  const {
    primary,
    adaptiveTextColorPrimary,
  } = useTheme();

  const disabled = !is3DAvailable && !is3DMode;

  return (
    <div
        data-no-export
        className="leaflet-top leaflet-left pointer-events-none"
        style={{
            top: "calc(var(--leaflet-top-offset, 96px) + 267px)",
            left: "12px",
            zIndex: 2000,
        }}
        >
        <div
            className="
            leaflet-control
            leaflet-bar
            pointer-events-auto
            overflow-hidden
            rounded-md
            "
            style={{
            marginLeft: "10px",

            // Aspect du bouton
            border: "2px solid rgba(0, 0, 0, 0.2)",
            boxShadow: "0 0px 0px rgba(0, 0, 0, 0)",
            backgroundColor: "#FFFFFF",
            }}
        >
            <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className="
                w-8 h-8
                flex items-center justify-center
                text-[11px] font-bold
                border-0
                transition hover:opacity-90
            "
            style={{
                backgroundColor: is3DMode
                ? primary
                : "#FFFFFF",

                color: is3DMode
                ? adaptiveTextColorPrimary
                : "#111827",

                cursor: disabled
                ? "not-allowed"
                : "pointer",

                opacity: disabled ? 0.4 : 1,
            }}
            title={
                disabled
                ? "Mode 3D disponible uniquement pour les données numériques"
                : is3DMode
                    ? "Retour en mode 2D"
                    : "Activer le mode 3D"
            }
            aria-pressed={is3DMode}
            aria-label={
                is3DMode
                ? "Retour en mode 2D"
                : "Activer le mode 3D"
            }
            >
            {is3DMode ? "2D" : "3D"}
            </button>
        </div>
        </div>
  );
}

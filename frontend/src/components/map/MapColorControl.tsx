import { useTheme } from "@/theme/useTheme";

type Props = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function MapColorControl({
  isOpen,
  onToggle,
}: Props) {
  const {
    primary,
    adaptiveTextColorPrimary,
  } = useTheme();

  return (
    <div
      data-no-export
      className="leaflet-top leaflet-left pointer-events-none"
      style={{
        // Placé directement sous le bouton 2D / 3D.
        top: "calc(var(--leaflet-top-offset, 96px) + 307px)",
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

          // Même aspect que le bouton 2D / 3D.
          border: "2px solid rgba(0, 0, 0, 0.2)",
          boxShadow: "0 0px 0px rgba(0, 0, 0, 0)",
          backgroundColor: "#FFFFFF",
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          className="
            w-8 h-8
            flex items-center justify-center
            border-0
            transition hover:opacity-90
          "
          style={{
            backgroundColor: isOpen
              ? primary
              : "#FFFFFF",

            color: isOpen
              ? adaptiveTextColorPrimary
              : "#111827",

            cursor: "pointer",
          }}
          title={
            isOpen
              ? "Masquer le réglage des couleurs"
              : "Régler l'intensité des couleurs"
          }
          aria-pressed={isOpen}
          aria-label={
            isOpen
              ? "Masquer le réglage des couleurs"
              : "Régler l'intensité des couleurs"
          }
        >
          {/* Icône contraste / intensité */}
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="8" />
            <path
              d="M12 4a8 8 0 0 0 0 16Z"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

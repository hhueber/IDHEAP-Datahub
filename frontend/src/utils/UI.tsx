
import React from "react";
import { hexToRgba } from "@/utils/color";
import { useTheme } from "@/theme/useTheme";

export type Kpi = { label: string; value: string; sub?: string };

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "secondaryCompact"
  | "outline"
  | "outlineCompact";
export type ButtonSize = "sm" | "md";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Uniquement pour variant="outline" (défaut "md") */
  size?: ButtonSize;
};

const BUTTON_CLASSES: Record<Exclude<ButtonVariant, "outline">, string> = {
  primary: "rounded-lg px-4 py-2 disabled:opacity-60 transition hover:opacity-90",
  secondary:
    "px-3 py-2 rounded-lg border text-sm transition hover:[background-color:var(--button-hover-bg)]",
  secondaryCompact:
    "px-2 py-1 text-xs rounded border hover:[background-color:var(--button-hover-bg)]",
  outlineCompact:
    "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-xs font-medium transition hover:opacity-90",
};

const OUTLINE_CLASSES: Record<ButtonSize, string> = {
  sm: "rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40",
  md: "rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-40",
};

/** Bouton d'action (primary par défaut : fond thème, hover:opacity-90). Étend les attributs natifs d'un <button>. */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  style,
  children,
  ...rest
}: ButtonProps) {
  const {
    primary,
    adaptiveTextColorPrimary,
    background,
    borderColor,
    textColor,
    hoverPrimary06,
    hoverPrimary04,
  } = useTheme();

  const variantClass = variant === "outline" ? OUTLINE_CLASSES[size] : BUTTON_CLASSES[variant];

  const variantStyle: React.CSSProperties =
    variant === "secondary"
      ? ({
          backgroundColor: background,
          borderColor,
          color: textColor,
          "--button-hover-bg": hoverPrimary06,
        } as React.CSSProperties)
      : variant === "secondaryCompact"
        ? ({
            backgroundColor: background,
            borderColor,
            color: textColor,
            "--button-hover-bg": hoverPrimary04,
          } as React.CSSProperties)
        : variant === "outline"
          ? { borderColor }
          : variant === "outlineCompact"
            ? { borderColor, color: textColor }
            : { backgroundColor: primary, color: adaptiveTextColorPrimary };

  return (
    <button
      {...rest}
      className={[variantClass, className].filter(Boolean).join(" ")}
      style={{
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Champ de formulaire texte (label + input, thème). Étend les attributs natifs d'un <input>. */
export function TextField({
  label,
  className = "",
  style,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const { background, borderColor, textColor } = useTheme();

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        {...rest}
        className={["w-full rounded-lg border px-3 py-2", className]
          .filter(Boolean)
          .join(" ")}
        style={{
          backgroundColor: background,
          borderColor: borderColor,
          color: textColor,
          ...style,
        }}
      />
    </div>
  );
}

/** Champ de formulaire liste déroulante (label + select, thème). Étend les attributs natifs d'un <select>. */
export function SelectField({
  label,
  className = "",
  style,
  children,
  ...rest
}: {
  label: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { background, borderColor, textColor } = useTheme();

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        {...rest}
        className={["w-full rounded-lg border px-3 py-2", className]
          .filter(Boolean)
          .join(" ")}
        style={{
          backgroundColor: background,
          borderColor: borderColor,
          color: textColor,
          ...style,
        }}
      >
        {children}
      </select>
    </div>
  );
}

/** Boîte d'édition inline (bordure/fond thème + icône crayon). Aucune logique d'édition : le contenu (input) est fourni par l'appelant. Étend les attributs natifs d'un <div>. */
export function InlineEditBox({
  className = "",
  style,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const { borderColor, background, hoverText07 } = useTheme();

  return (
    <div
      {...rest}
      className={["inline-flex items-center gap-2 rounded-md border px-2 py-1 min-h-[30px] w-full", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderColor,
        backgroundColor: background,
        ...style,
      }}
    >
      {children}
      <span className="text-xs opacity-70 select-none" style={{ color: hoverText07 }}>
        {"\u270E"} {/* Signe Unicode pour ce symbole ✎ */}
      </span>
    </div>
  );
}

export type ModalShellProps = {
  title: React.ReactNode;
  onClose: () => void;
  titleClassName?: string;
  overlayClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>;

/** Coquille de modale (overlay + conteneur + en-tête titre/fermeture, thème). Body/footer entièrement fournis par l'appelant via children. */
export function ModalShell({
  title,
  onClose,
  titleClassName = "text-lg font-semibold",
  overlayClassName = "",
  className = "",
  style,
  children,
  ...rest
}: ModalShellProps) {
  const { background, borderColor, textColor, primary, hoverText30 } = useTheme();

  return (
    <div
      className={["fixed inset-0 z-50 flex justify-center", overlayClassName]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: hoverText30 }}
    >
      <div
        {...rest}
        className={["border shadow-xl", className].filter(Boolean).join(" ")}
        style={{
          backgroundColor: background,
          borderColor,
          color: textColor,
          ...style,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={titleClassName} style={{ color: textColor }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm transition hover:[color:var(--modal-close-hover-color)]"
            style={
              {
                color: textColor,
                "--modal-close-hover-color": primary,
              } as React.CSSProperties
            }
          >
            {"\u00D7"} {/* Signe Unicode pour ce symbole × */}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Bannière de message succès/erreur pour formulaires. Étend les attributs natifs d'un <div>. */
export function FormMessage({
  tone,
  className = "",
  children,
  ...rest
}: {
  tone: "success" | "error";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      {...rest}
      className={["rounded border px-3 py-2 text-sm", toneClass, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export type StatusMessageTone = "muted" | "error";

const STATUS_MESSAGE_CLASSES: Record<StatusMessageTone, string> = {
  muted: "text-sm",
  error: "text-sm text-red-500",
};

/** Texte d'état minimal (loading/error/empty), sans bordure ni fond. Étend les attributs natifs d'un <div>. */
export function StatusMessage({
  tone,
  className = "",
  style,
  children,
  ...rest
}: {
  tone: StatusMessageTone;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { hoverText07 } = useTheme();

  const toneStyle: React.CSSProperties | undefined =
    tone === "muted" ? { color: hoverText07 } : undefined;

  return (
    <div
      {...rest}
      className={[STATUS_MESSAGE_CLASSES[tone], className].filter(Boolean).join(" ")}
      style={{
        ...toneStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export type SectionCardRadius = "xl" | "2xl" | "3xl";

const SECTION_CARD_RADIUS_CLASSES: Record<SectionCardRadius, string> = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

/** Carte de section thématique (fond opaque du thème, bordure, ombre légère, titre optionnel) */
export function SectionCard({
  id,
  title,
  titleClassName = "text-sm font-semibold mb-2",
  compact = false,
  cascadeTextColor = false,
  shadow = true,
  radius = "2xl",
  className,
  as = "section",
  children,
}: {
  id?: string;
  title?: React.ReactNode;
  titleClassName?: string;
  /** Réduit le padding à p-3 au lieu de p-4 */
  compact?: boolean;
  /** Applique aussi la couleur de texte du thème sur le conteneur (cascade vers les enfants) */
  cascadeTextColor?: boolean;
  /** Affiche shadow-sm (défaut true) */
  shadow?: boolean;
  /** Rayon de la carte (défaut "2xl", comportement actuel inchangé) */
  radius?: SectionCardRadius;
  /** Classes additionnelles ajoutées aux classes de base */
  className?: string;
  /** Balise HTML rendue (défaut "section") */
  as?: "section" | "div";
  children: React.ReactNode;
}) {
  const { textColor, background, borderColor } = useTheme();
  const Tag = as;

  return (
    <Tag
      id={id}
      className={[
        SECTION_CARD_RADIUS_CLASSES[radius],
        shadow ? "shadow-sm" : "",
        compact ? "p-3" : "p-4",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: background,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: borderColor,
        ...(cascadeTextColor ? { color: textColor } : null),
      }}
    >
      {title && (
        <h2 className={titleClassName} style={{ color: textColor }}>
          {title}
        </h2>
      )}
      {children}
    </Tag>
  );
}

export function Card({
  children,
  bg,
  border,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-sm backdrop-blur"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {children}
    </div>
  );
}

/** Donut chart (SVG) */
export function Donut({
  value,
  label,
  size = 140,
  stroke = 14,
}: {
  value: number;
  label: string;
  size?: number;
  stroke?: number;
}) {
  const { primary, textColor, borderColor } = useTheme();

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  const track = hexToRgba(borderColor, 0.45);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={primary}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="48%" textAnchor="middle" fontSize="22" fontWeight="700" fill={textColor}>
        {pct}%
      </text>
      <text x="50%" y="64%" textAnchor="middle" fontSize="11" fill={hexToRgba(textColor, 0.75)}>
        {label}
      </text>
    </svg>
  );
}

export function Pill({
  children,
  bg,
  border,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <span
      className="text-xs px-3 py-1 rounded-full border font-medium"
      style={{ backgroundColor: bg, borderColor: border, color }}
    >
      {children}
    </span>
  );
}

export function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const { primary, textColor, borderColor, cardBg, hoverPrimary06, hoverPrimary30, hoverText05 } = useTheme();

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-sm backdrop-blur transition hover:translate-y-[-1px]"
      style={{ backgroundColor: cardBg, borderColor: borderColor }}
    >
      <div className="text-sm" style={{ color: hexToRgba(textColor, 0.75) }}>
        {label}
      </div>

      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="text-2xl font-bold" style={{ color: primary }}>
          {value}
        </div>

        <div
          className="h-2 w-20 rounded-full overflow-hidden border"
          style={{
            borderColor: hoverPrimary30,
            backgroundColor: hoverPrimary06,
          }}
          aria-hidden
        >
          <div className="h-full w-[60%]" style={{ backgroundColor: hoverPrimary30 }} />
        </div>
      </div>

      {sub && (
        <div className="mt-2 text-xs" style={{ color: hoverText05 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

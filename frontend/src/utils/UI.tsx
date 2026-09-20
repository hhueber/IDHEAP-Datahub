import React from "react";
import { hexToRgba } from "@/utils/color";
import { useTheme } from "@/theme/useTheme";

export type Kpi = { label: string; value: string; sub?: string };

/** Bouton primaire (fond thème, hover:opacity-90). Étend les attributs natifs d'un <button>. */
export function Button({
  className = "",
  style,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { primary, adaptiveTextColorPrimary } = useTheme();

  return (
    <button
      {...rest}
      className={["rounded-lg px-4 py-2 disabled:opacity-60 transition hover:opacity-90", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: primary,
        color: adaptiveTextColorPrimary,
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

/** Carte de section thématique (fond opaque du thème, bordure, ombre légère, titre optionnel) */
export function SectionCard({
  id,
  title,
  titleClassName = "text-sm font-semibold mb-2",
  compact = false,
  cascadeTextColor = false,
  shadow = true,
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
        "rounded-2xl",
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

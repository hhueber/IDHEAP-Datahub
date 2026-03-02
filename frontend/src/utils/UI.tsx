import React from "react";
import { hexToRgba } from "@/utils/color";
import { useTheme } from "@/theme/useTheme";

export type Kpi = { label: string; value: string; sub?: string };

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

import React from "react";

type TruncatedCellProps = {
  value: React.ReactNode;
  title?: string;
  className?: string;
};

export function TruncatedCell({
  value,
  title,
  className = "max-w-[280px]",
}: TruncatedCellProps) {
  const text =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : title ?? "";

  return (
    <span
      title={title ?? text}
      className={`block overflow-hidden text-ellipsis whitespace-nowrap ${className}`}
    >
      {value ?? "—"}
    </span>
  );
}
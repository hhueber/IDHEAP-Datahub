import { useTheme } from "@/theme/useTheme";
type LoadingSpinnerProps = {
  size?: number;
  label?: string;
};

export default function LoadingSpinner({
  size = 44,
  label = "Loading...",
}: LoadingSpinnerProps) {
  const { textColor, primary, hoverText30 } = useTheme();
  const border = Math.max(3, Math.round(size / 10));

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div
        className="rounded-full animate-spin"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `${border}px solid ${hoverText30}`,
          borderTop: `${border}px solid ${primary}`,
        }}
      />
      <span className="text-sm " 
            style={{ color: textColor }}>{label}</span>
    </div>
  );
}
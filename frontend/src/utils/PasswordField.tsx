// masque ou pas les mot de passe
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";

type Props = {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  hideLabel?: boolean;
  variant?: "default" | "minimal";
};

export default function PasswordField({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  autoComplete = "current-password",
  required = true,
  className,
  hideLabel = false,
  variant = "default",
}: Props) {
  const { t } = useTranslation();
  const { textColor, hoverPrimary06 } = useTheme();

  const [visible, setVisible] = useState(false);

  const toggle = () => setVisible(v => !v);
  const aria = visible ? t("changePassword.hidePassword") : t("changePassword.showPassword");

  const baseInput = "block w-full rounded border px-3 pr-12 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
  const variantInput = variant === "minimal" ? "rounded" : "rounded-lg";
  const spacing = hideLabel ? "" : "mt-1";
  const inputClass = className ? className : [baseInput, variantInput, spacing].join(" ").trim();

  return (
    <div>
      {/* Label séparé du conteneur relatif */}
      <label className={hideLabel ? "sr-only" : "block text-sm font-medium mb-1"} htmlFor={id}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={inputClass}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />

        {/* Wrapper pleine hauteur de l'INPUT */}
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <button
            type="button"
            onClick={toggle}
            aria-label={aria}
            aria-pressed={visible}
            className="
              pointer-events-auto h-8 w-8
              grid place-items-center
              rounded-md
              transition
              focus:outline-none
              hover:[background-color:var(--pwd-toggle-hover-bg)]
            "
            title={aria}
            style={
              {
                color: textColor,
                "--pwd-toggle-hover-bg": hoverPrimary06,
              } as React.CSSProperties
            }
          >
            {visible ? (
              // oeil barré
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 3-3 3 3 0 0 0-4.42-2.42" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M2 12s3.5-7 10-7 10 7 10 7a17.3 17.3 0 0 1-3.22 3.82M6.12 6.12A17.3 17.3 0 0 0 2 12" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            ) : (
              // oeil
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            )}
          </button>
        </span>
      </div>
    </div>
  );
}

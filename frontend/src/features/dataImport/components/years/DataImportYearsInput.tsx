import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";

type DataImportYearsInputProps = {
  years: number[];
  disabled?: boolean;
  error?: string | null;
  onChange: (years: number[]) => void;
};

export function DataImportYearsInput({
  years,
  disabled = false,
  error = null,
  onChange,
}: DataImportYearsInputProps) {
  const { t } = useTranslation();
  const {textColor, background, borderColor, hoverPrimary04, primary} = useTheme();
  const [draft, setDraft] = React.useState("");

  const validDraft = /^\d{4}$/.test(
    draft
  );

  const addYear = () => {
    if (!validDraft) {
      return;
    }

    const year = Number(draft);

    if (years.includes(year)) {
      setDraft("");
      return;
    }

    onChange(
      [...years, year].sort(
        (left, right) => left - right
      )
    );

    setDraft("");
  };

  const removeYear = (
    yearToRemove: number
  ) => {
    onChange(
      years.filter(
        (year) => year !== yearToRemove
      )
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div
          className="flex h-11 min-w-0 flex-1 items-center rounded-xl border px-3"
          style={{
            borderColor: error
              ? "#ef4444"
              : borderColor,
            backgroundColor: background,
          }}
        >
          <span
            className="mr-2 text-sm opacity-45"
            aria-hidden
          >
            {"\uD83D\uDCC5"}
          </span>

          <input
            type="text"
            inputMode="numeric"
            value={draft}
            maxLength={4}
            disabled={disabled}
            placeholder={t(
              "dataImport.years.placeholder"
            )}
            onChange={(event) => {
              setDraft(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 4)
              );
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addYear();
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-40"
            style={{ color: textColor }}
          />
        </div>

        <button
          type="button"
          disabled={
            disabled ||
            !validDraft
          }
          onClick={addYear}
          className="h-11 rounded-xl border px-4 text-sm font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor: primary,
            backgroundColor: hoverPrimary04,
            color: primary,
          }}
        >
          {t("dataImport.years.add")}
        </button>
      </div>

      <p className="mt-1 text-xs opacity-60">
        {t("dataImport.years.help")}
      </p>

      {years.length > 0 && (
        <div
            className="mt-3 overflow-x-auto overflow-y-hidden rounded-xl border px-2 py-2"
            style={{
              borderColor,
              backgroundColor: hoverPrimary04,
            }}
        >
            <div className="flex min-w-max items-center gap-2">
            {years.map((year) => (
                <span
                  key={year}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
                  style={{
                    borderColor,
                    backgroundColor: background,
                  }}
                >
                {year}

                <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      removeYear(year)
                    }
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm opacity-50 transition hover:opacity-100 disabled:opacity-30"
                    aria-label={t(
                      "dataImport.years.remove",
                      { year }
                    )}
                >
                    {"\u00D7"} {/* uncode pour ce symbole  × */}
                  </button>
                </span>
              ))}
            </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

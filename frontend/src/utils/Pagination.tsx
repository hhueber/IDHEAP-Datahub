import React from "react";
import { useTranslation } from "react-i18next";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  // --- logique pour la version "desktop" (>= sm) ---
  const delta = 3; // nb de pages de chaque côté sur grand écran

  const desktopPages: (number | "...")[] = [];

  // Toujours la page 1
  desktopPages.push(1);

  const { t } = useTranslation();

  // Zone autour de la page courante
  let start = Math.max(2, page - delta);
  let end = Math.min(totalPages - 1, page + delta);

  if (start > 2) {
    desktopPages.push("...");
  }

  for (let p = start; p <= end; p++) {
    desktopPages.push(p);
  }

  if (end < totalPages - 1) {
    desktopPages.push("...");
  }

  if (totalPages > 1) {
    desktopPages.push(totalPages);
  }

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const handlePrev = () => {
    if (canPrev) onChange(page - 1);
  };

  const handleNext = () => {
    if (canNext) onChange(page + 1);
  };

  return (
    <nav className="mt-4 mb-8 flex items-center justify-center">
      {/* --- Version mobile : boutons simples + texte "Page X / Y" --- */}
      <div className="flex items-center gap-2 sm:hidden">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canPrev}
          className="min-w-[2.5rem] h-9 flex items-center justify-center rounded border text-sm disabled:opacity-40"
        >
          {"\u00AB"}
        </button>
        <span className="text-sm text-gray-700">
          {t("pagination.page")} <span className="font-semibold">{page}</span> / {totalPages}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          className="min-w-[2.5rem] h-9 flex items-center justify-center rounded border text-sm disabled:opacity-40"
        >
          {"\u00BB"}
        </button>
      </div>

      {/* --- Version desktop : pagination détaillée avec numéros + "..." --- */}
      <div className="hidden sm:flex items-center justify-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canPrev}
          className="px-3 py-1 text-sm border rounded disabled:opacity-40"
        >
          {"\u00AB"}
        </button>

        {desktopPages.map((p, i) =>
          p === "..." ? (
            <span
              key={`dots-${i}`}
              className="px-2 py-1 text-sm text-gray-500 select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={[
                "min-w-[2.25rem] px-2 py-1 text-sm border rounded",
                p === page ? "bg-black text-white" : "bg-white hover:bg-gray-100",
              ].join(" ")}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          className="px-3 py-1 text-sm border rounded disabled:opacity-40"
        >
          {"\u00BB"}
        </button>
      </div>
    </nav>
  );
}

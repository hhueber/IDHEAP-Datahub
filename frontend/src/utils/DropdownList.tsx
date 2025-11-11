// Liste déroulante
import React, { useEffect, useRef, useState, type ReactNode } from "react";

type DropdownListProps<T> = {
  items: T[];
  selected?: T | null;
  onSelect: (item: T) => void;
  // Afficher chaque item
  labelFor: (item: T) => ReactNode;
  // Placeholder quand rien n'est sélectionné
  placeholder?: string;
  // Générer une clé unique (sinon index)
  keyFor?: (item: T, index: number) => string | number;
  // Savoir si un item est sélectionné (sinon ===)
  isSelected?: (item: T, selected: T | null | undefined) => boolean;
  // Classes optionnelles
  buttonClassName?: string;
  popoverClassName?: string;
};

export function DropdownList<T>({
  items,
  selected,
  onSelect,
  labelFor,
  placeholder = "Sélectionner…",
  keyFor,
  isSelected,
  buttonClassName = "",
  popoverClassName = "",
}: DropdownListProps<T>) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Fermeture au clic extérieur / ESC
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current &&
        !btnRef.current.contains(target) &&
        popRef.current &&
        !popRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Bouton */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full flex items-center justify-between rounded-lg",
          "ring-1 ring-indigo-200 bg-white px-3 py-2",
          "text-indigo-700 hover:bg-indigo-50 transition",
          buttonClassName,
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium">
          {selected ? labelFor(selected) : placeholder}
        </span>
        <span
          className={`ml-2 text-xs text-indigo-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          {"\u25BC"}
        </span>
      </button>

      {/* Liste déroulante */}
      {open && (
        <div
          ref={popRef}
          className={[
            "absolute z-50 mt-2 w-full rounded-lg bg-white shadow-xl",
            "ring-1 ring-black/10 overflow-hidden",
            popoverClassName,
          ].join(" ")}
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto">
            {items.map((item, index) => {
              const active = isSelected
                ? isSelected(item, selected)
                : item === selected;
              const key = keyFor ? keyFor(item, index) : index;

              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(item)}
                  className={
                    "w-full text-left px-3 py-2 text-sm " +
                    (active
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-indigo-50 text-gray-800")
                  }
                >
                  {labelFor(item)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

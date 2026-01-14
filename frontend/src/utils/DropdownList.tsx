// Liste déroulante
import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/theme/useTheme";

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

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { primary, background, borderColor, textColor, adaptiveTextColorPrimary, hoverPrimary06 } = useTheme();


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
          "border px-3 py-2",
          "transition",
          "hover:opacity-90", // effet hover simple, garde l’UX
          buttonClassName,
        ].join(" ")}
        style={{
          backgroundColor: background,
          color: primary,             // texte du bouton = primary
          borderColor: borderColor, // ring/border soft
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium" style={{ color: primary }}>
          {selected ? labelFor(selected) : placeholder}
        </span>
        <span
          className={`ml-2 text-xs transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
          style={{ color: primary }} // icone 
        >
          {"\u25BC"}
        </span>
      </button>

      {/* Liste déroulante */}
      {open && (
        <div
          ref={popRef}
          className={[
            "absolute z-50 mt-2 w-full rounded-lg shadow-xl overflow-hidden",
            popoverClassName,
          ].join(" ")}
          style={{
            backgroundColor: background,
            borderColor: borderColor,
            borderWidth: 1,
            borderStyle: "solid",
          }}
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto">
            {items.map((item, index) => {
              const active = isSelected
                ? isSelected(item, selected)
                : item === selected;
              const key = keyFor ? keyFor(item, index) : index;
              const isHovered = hoveredIndex === index;

              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex((prev) => (prev === index ? null : prev))}
                  className={
                    "w-full text-left px-3 py-2 text-sm transition "
                  }
                  style={{
                    // actif : fond primary
                    // survol (non actif) : hoverBg (tinte de primary)
                    backgroundColor: active
                      ? primary // fond actif
                      : isHovered
                      ? hoverPrimary06 // fond hover, donc primary très claire
                      : "transparent",
                    color: active ? adaptiveTextColorPrimary : textColor,
                  }}
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

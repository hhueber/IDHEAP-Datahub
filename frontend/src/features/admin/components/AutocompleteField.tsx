import React from "react";
import { useTheme } from "@/theme/useTheme";

type AutocompleteFieldProps<T> = {
  value: string;
  onChange: (v: string) => void;

  // Fonction de recherche : reçoit la query, renvoie la liste des items
  fetchItems: (q: string) => Promise<T[]>;

  // Comment afficher un item dans la liste
  renderItem: (it: T) => React.ReactNode;

  // Callback quand on choisit un item
  onPick: (it: T) => void;

  placeholder?: string;
  minLength?: number;  // Longueur mini avant de lancer la recherche (par défaut 3)
  debounceMs?: number; // Debounce (par défaut 200ms)

  // Rendu de l’état "chargement…"
  renderLoading?: () => React.ReactNode;

  // Rendu quand aucun résultat (on reçoit la query)
  renderEmpty?: (query: string) => React.ReactNode;
};

export default function AutocompleteField<T>({
  value,
  onChange,
  fetchItems,
  renderItem,
  onPick,
  placeholder = "Type to search…",
  minLength = 3,
  debounceMs = 200,
  renderLoading,
  renderEmpty,
}: AutocompleteFieldProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<T[]>([]);
  const [active, setActive] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const boxRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  const { primary, textColor, background, borderColor, adaptiveTextColorPrimary, hoverPrimary06, hoverText07 } = useTheme();

  // Fermeture quand on clique en dehors
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Recherche avec debounce
  React.useEffect(() => {
    const q = value.trim();

    if (q.length < minLength) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const h = setTimeout(async () => {
      try {
        const arr = await fetchItems(q);
        if (cancelled) return;
        setItems(arr);
        setActive(0);
        setOpen(true);
      } catch {
        if (cancelled) return;
        setItems([]);
        setOpen(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(h);
    };
  }, [value, minLength, debounceMs, fetchItems]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) {
        onPick(it);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-controls={listId}
        aria-expanded={open}
        aria-autocomplete="list"
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2"
        style={{
          backgroundColor: background,
          borderColor: borderColor,
          color: textColor,
        }}
      />

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg shadow-xl max-h-64 overflow-auto border"
          style={{
            backgroundColor: background,
            borderColor: borderColor,
          }}
        >
          {/* État chargement */}
          {loading && renderLoading && (
            <div className="px-3 py-2 text-sm" style={{ color: hoverText07 }}>
              {renderLoading()}
            </div>
          )}

          {/* Aucun résultat */}
          {!loading && items.length === 0 && renderEmpty && (
            <div className="px-3 py-2 text-sm" style={{ color: hoverText07 }}>
              {renderEmpty(value)}
            </div>
          )}

          {/* Liste des résultats */}
          {!loading &&
            items.length > 0 &&
            items.map((it, i) => (
              <button
                key={i}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  onPick(it);
                  setOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 text-sm transition
                  bg-[var(--auto-item-bg)]
                  hover:bg-[var(--auto-item-hover-bg)]
                `}
                style={
                  {
                    "--auto-item-bg": i === active ? primary : "transparent",
                    "--auto-item-hover-bg": i === active ? primary : hoverPrimary06,
                    color: i === active ? adaptiveTextColorPrimary : textColor,
                  } as React.CSSProperties
                }
              >
                {renderItem(it)}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

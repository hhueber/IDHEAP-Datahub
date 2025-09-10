import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type SurveyLite = { uid: number; year: number };

type Props = {
  surveys: SurveyLite[];
  valueUid?: number | null;
  onChange?: (selected: SurveyLite) => void;
  placeholder?: string;
  globalLabel?: string;
};

export default function YearSelector({
  surveys,
  valueUid = null,
  onChange,
  placeholder,
  globalLabel,
}: Props) {
  const { t } = useTranslation();

  // défauts traduits si non fournis par le parent
  const ph = placeholder ?? t("home.chooseYear");
  const gl = globalLabel ?? t("home.globalOption");

  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const selected = valueUid != null ? surveys.find(s => s.uid === valueUid) ?? null : null;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!popRef.current || !btnRef.current) return;
      const target = e.target as Node;
      if (!popRef.current.contains(target) && !btnRef.current.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSelect = (s: SurveyLite) => { onChange?.(s); setOpen(false); };

  const list = [...surveys].sort((a, b) => {
    const ag = Number.isNaN(a.year), bg = Number.isNaN(b.year);
    if (ag && !bg) return -1;
    if (!ag && bg) return 1;
    return (a.year || 0) - (b.year || 0);
  });

  const labelFor = (s: SurveyLite) => Number.isNaN(s.year) ? gl : String(s.year);

  return (
    <div className="relative inline-block text-left w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between rounded-lg ring-1 ring-indigo-200 bg-white px-3 py-2 text-indigo-700 hover:bg-indigo-50 transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium">
          {selected ? labelFor(selected) : ph}
        </span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute z-50 mt-2 w-full rounded-lg bg-white shadow-xl ring-1 ring-black/10 overflow-hidden"
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto">
            {list.map((s) => {
              const active = s.uid === selected?.uid;
              return (
                <button
                  key={s.uid}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(s)}
                  className={`w-full text-left px-3 py-2 text-sm ${active ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-gray-800"}`}
                >
                  {labelFor(s)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
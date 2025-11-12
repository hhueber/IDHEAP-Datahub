import { useTranslation } from "react-i18next";
import { DropdownList } from "@/utils/DropdownList";

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

  // libellés par défaut (traduits) si non fournis par le parent
  const ph = placeholder ?? t("home.chooseYear");
  const gl = globalLabel ?? t("home.globalOption");

  const selected = valueUid != null ? surveys.find(s => s.uid === valueUid) ?? null : null;

  const list = [...surveys].sort((a, b) => {
    const ag = Number.isNaN(a.year), bg = Number.isNaN(b.year);
    if (ag && !bg) return -1;
    if (!ag && bg) return 1;
    return (a.year || 0) - (b.year || 0);
  });

  // étiquette d’affichage: “global” si NaN, sinon l’année
  const labelFor = (s: SurveyLite) => Number.isNaN(s.year) ? gl : String(s.year);

  return (
    <div className="w-full">
      {/* Utilisation du DropdownList/Liste déroulante */}
      <DropdownList<SurveyLite>
        items={list}
        selected={selected}
        onSelect={(s) => onChange?.(s)}
        labelFor={labelFor}
        placeholder={ph}
        keyFor={(item) => item.uid}
        isSelected={(item, sel) => item.uid === sel?.uid}
      />
    </div>
  );
}

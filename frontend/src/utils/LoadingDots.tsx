// petite animation toujours cool avec les "..."
import { useEffect, useState } from "react";

type LoadingDotsProps = {
  /** Texte (optionnel) qui précède les points, ex: "Connexion" */
  label?: string;
  /** Nombre max de points avant de boucler (défaut 3) */
  maxDots?: number;
  /** Intervalle en ms entre chaque étape (défaut 400ms) */
  intervalMs?: number;
  /** Masquer le label pour les lecteurs d’écran (ne lire que via l’UI autour) */
  ariaHiddenDotsOnly?: boolean;
};

export default function LoadingDots({
  label,
  maxDots = 3,
  intervalMs = 400,
  ariaHiddenDotsOnly = true,
}: LoadingDotsProps) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % (maxDots + 1)), intervalMs);
    return () => clearInterval(id);
  }, [maxDots, intervalMs]);

  const dotsStr = ".".repeat(dots);

  return (
    <span aria-hidden={ariaHiddenDotsOnly}>
      {label ? `${label}${dotsStr}` : dotsStr}
    </span>
  );
}

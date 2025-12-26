import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loadThemeConfig } from "@/theme/themeStorage";
import type { ThemeConfig } from "@/features/home/services/homeApi";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const MODE_STORAGE_KEY = "theme_mode";

function getInitialMode(): ThemeMode {
  // Sécurité SSR / tests
  if (typeof window === "undefined") return "light";

  // Si l'utilisateur a déjà choisi un mode -> priorité
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  // Sinon, on prend la valeur par défaut du backend
  const cfg: ThemeConfig = loadThemeConfig();
  const fromConfig = (cfg.theme_default_mode as ThemeMode) ?? "light";
  return fromConfig === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialMode());

  // Persistance du choix de utilisateur
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    }
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used inside ThemeProvider");
  }
  return ctx;
}
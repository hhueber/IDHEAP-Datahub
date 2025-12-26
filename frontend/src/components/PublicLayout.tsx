import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { loadThemeConfig } from "@/theme/themeStorage";
import { useThemeMode } from "@/theme/ThemeContext";

// Layout de la zone publique : navbar en haut + contenu scrollable
export default function PublicLayout() {
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const background = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  return (
    <div className="h-screen overflow-hidden" style = {{ backgroundColor: background }}>
      <Navbar />
      <main className="h-[calc(100vh-4rem)] overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

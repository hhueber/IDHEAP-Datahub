import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import { loadThemeConfig } from "@/theme/themeStorage";
import { useThemeMode } from "@/theme/ThemeContext";


// Layout de la zone privée : sidebar fixe + contenu principal scrollable
export default function PrivateLayout() {
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const background = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  return (
    <div className="min-h-screen" style={{ backgroundColor: background }}>
      <DashboardSidebar />
      <main className="pl-64">
        <div className="h-[100vh] overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

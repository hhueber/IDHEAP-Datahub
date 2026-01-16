import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import PrivateNavbar from "@/components/PrivateTopbar";
import { loadThemeConfig } from "@/theme/themeStorage";
import { useThemeMode } from "@/theme/ThemeContext";

export default function PrivateLayout() {
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const background =
    (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ??
    cfg.colour_light_background;

  return (
    <div className="min-h-screen" style={{ backgroundColor: background }}>
      {/* navbar privée horizontale */}
      <PrivateNavbar />

      {/* sidebar comme avant */}
      <DashboardSidebar />

      {/* contenu comme avant, juste décalé sous la navbar */}
      <main className="pl-64 pt-16">
        <div className="px-6 pb-6 pt-4-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

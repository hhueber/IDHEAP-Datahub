import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useTheme } from "@/theme/useTheme";


// Layout de la zone privée : sidebar fixe + contenu principal scrollable
export default function PrivateLayout() {
  const { background } = useTheme();
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

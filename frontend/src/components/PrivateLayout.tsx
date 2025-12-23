import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";


// Layout de la zone privée : sidebar fixe + contenu principal scrollable
export default function PrivateLayout() {
  return (
    <div className="min-h-screen">
      <DashboardSidebar />
      <main className="pl-64">
        <div className="h-[100vh] overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

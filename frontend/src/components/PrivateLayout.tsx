import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";

/**
 * Layout privé :
 * - Sidebar fixe à gauche
 * - Contenu à droite (scroll indépendant)
 */
export default function PrivateLayout() {
  return (
    <div className="min-h-screen bg-white">
      <DashboardSidebar />
      <main className="pl-64">
        {/* barre supérieure optionnelle pour le privé :
        <div className="h-16 border-b flex items-center px-6">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
        */}
        <div className="h-[100vh] overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
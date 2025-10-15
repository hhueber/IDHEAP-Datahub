import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";


export default function PrivateLayout() {
  return (
    <div className="min-h-screen bg-white">
      <DashboardSidebar />
      <main className="pl-64">
        <div className="h-[100vh] overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { Outlet, Route, Routes } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/features/home/Home";
import Login from "@/features/login/Login";
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "@/features/dashboard/Dashboard";
import RequireAuth from "@/components/RequireAuth";
import RequireRole from "@/components/RequireRole";

//exemple admin page rapide
function AdminUsers() { return <div className="p-6">Admin: gestion utilisateurs</div>; }

function Layout() {
  return (
    <div className="h-screen overflow-hidden bg-white">
      <Navbar />
      <main className="h-[calc(100vh-4rem)] overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Privé (auth requis) */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin/users"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AdminUsers />
              </RequireRole>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
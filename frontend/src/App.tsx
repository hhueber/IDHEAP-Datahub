import { Route, Routes } from "react-router-dom";
import Home from "@/features/home/Home";
import Login from "@/features/login/Login";
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "@/features/dashboard/Dashboard";
import RequireAuth from "@/components/RequireAuth";
import RequireRole from "@/components/RequireRole";
import PrivateLayout from "@/components/PrivateLayout";
import PublicLayout from "@/components/PublicLayout";
import AddMemberPage from "@/features/admin/AddMemberPage";
import DeleteMemberPage from "@/features/admin/DeleteMemberPage";
import ChangePasswordPage from "@/features/dashboard/ChangePasswordPage";

// Démo admin déjà fournie
function AdminUsers() { return <div className="p-6">Admin: gestion utilisateurs</div>; }

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Privé (auth requis) */}
        <Route
          element={
            <RequireAuth>
              <PrivateLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/password" element={<ChangePasswordPage />} />

          {/* Admin only dans le layout privé */}
          <Route
            path="/admin/users"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AdminUsers />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AddMemberPage />
              </RequireRole>
            }
          />
          <Route path="/admin/users/delete" element={<RequireRole roles={["ADMIN"]}><DeleteMemberPage /></RequireRole>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

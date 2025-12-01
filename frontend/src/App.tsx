// Configuration des routes : zones publique/privée, protections d’accès et layouts
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
import PlaceOfInterestConfigPage from "@/features/admin/config/PlaceOfInterestConfigPage";

// Démo admin déjà fournie
function AdminUsers() { return <div className="p-6">Admin: gestion utilisateurs</div>; }

export default function App() {
  return (
    // Contexte d’auth global (disponible partout)
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Zone privée (auth requise) : layout + protections */}
        <Route
          element={
            <RequireAuth>
              <PrivateLayout />
            </RequireAuth>
          }
        >
          {/* Pages privées accessibles aux membres connectés */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/password" element={<ChangePasswordPage />} />

          {/* Pages admin (rôle ADMIN uniquement) */}
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
          <Route
            path="/admin/config/placeOfInterest"
            element={
              <RequireRole roles={["ADMIN"]}>
                <PlaceOfInterestConfigPage />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

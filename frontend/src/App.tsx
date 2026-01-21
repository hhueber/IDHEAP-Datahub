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
import { ADMIN, MEMBER } from "@/config/roles";
import PlaceOfInterestConfigPage from "@/features/admin/config/PlaceOfInterestConfigPage";
import CommuneAllPage from "@/features/pageAll/CommuneAllPage";
import DistrictAllPage from "@/features/pageAll/DistrictAllPage";
import CantonAllPage from "@/features/pageAll/CantonAllPage";
import QCatAllPage from "@/features/pageAll/QCatAllPage";
import QGlobalAllPage from "@/features/pageAll/QGlobalAllPage";
import QPerSurvAllPage from "@/features/pageAll/QPerSurvAllPage";
import SurveyAllPage from "@/features/pageAll/SurveyAllPage";
import OptionAllPage from "@/features/pageAll/OptionAllPage";
import ThemeConfigPage from "@/features/admin/config/ThemeConfigPage";
import ShowPage from "@/features/pageShow/ShowPage";


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
          
          <Route
            path="/admin/surveys"
            element={
              <RequireRole roles={[ADMIN, MEMBER]}>
                <SurveyAllPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/options"
            element={
              <RequireRole roles={[ADMIN, MEMBER]}>
                <OptionAllPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/qglobal"
            element={
              <RequireRole roles={[ADMIN, MEMBER]}>
                <QGlobalAllPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/qps"
            element={
              <RequireRole roles={[ADMIN, MEMBER]}>
                <QPerSurvAllPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/qcat"
            element={
              <RequireRole roles={[ADMIN, MEMBER]}>
                <QCatAllPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/places/communes"
            element={
              <RequireRole roles={[ADMIN, MEMBER]}>
                <CommuneAllPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/places/show/:entity/:id"
            element={
              <RequireRole roles={["ADMIN", "MEMBER"]}>
                <ShowPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/places/districts"
            element={
              <RequireRole roles={[ADMIN, MEMBER]}>
                <DistrictAllPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/places/cantons"
            element={
              <RequireRole roles={[ADMIN, MEMBER]}>
                <CantonAllPage />
              </RequireRole>
            }
          />

          {/* Pages admin (rôle ADMIN uniquement) */}
          <Route
            path="/admin/users/new"
            element={
              <RequireRole roles={[ADMIN]}>
                <AddMemberPage />
              </RequireRole>
            }
          />
          <Route path="/admin/users/delete" element={<RequireRole roles={[ADMIN]}><DeleteMemberPage /></RequireRole>} />
          <Route
            path="/admin/config/placeOfInterest"
            element={
              <RequireRole roles={[ADMIN]}>
                <PlaceOfInterestConfigPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/config/theme"
            element={
              <RequireRole roles={["ADMIN"]}>
                <ThemeConfigPage />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

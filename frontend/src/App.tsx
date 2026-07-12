// Configuration des routes : zones publique/privée, protections d’accès et layouts
import { Route, Routes } from "react-router-dom";
import Home from "@/features/home/Home";
import Login from "@/features/login/Login";
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "@/features/dashboard/Dashboard";
import RequireAuth from "@/components/RequireAuth";
import PrivateLayout from "@/components/PrivateLayout";
import PublicLayout from "@/components/PublicLayout";
import AddMemberPage from "@/features/admin/AddMemberPage";
import ChangePasswordPage from "@/features/dashboard/ChangePasswordPage";
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
import AnswerAllPage from "@/features/pageAll/AnswerAllPage";
import RequirePermission from "@/components/RequirePermission";
import AdminUsersPage from "@/features/admin/users/AdminUsersPage";
import DataImportPage from "@/features/dataImport/DataImportPage";
<<<<<<< HEAD
import ExportDataPage from "./features/export/ExportDataPage";

=======
import ExportDataPage from "@/features/export/ExportDataPage"
>>>>>>> origin/Fix-#323-Validate-dataset-preparation-de-l-import-final


export default function App() {
  return (
    // Contexte d’auth global (disponible partout)
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/export-data" element={<ExportDataPage />} />
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
              <RequirePermission scope="DATASET" level="READ">
                <SurveyAllPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/surveys/new"
            element={
              <RequirePermission scope="DATASET" level="MANAGE">
                <DataImportPage />
              </RequirePermission>
            }
          />

          <Route
            path="/admin/answers"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <AnswerAllPage />
              </RequirePermission>
            }
          />

          <Route
            path="/admin/options"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <OptionAllPage />
              </RequirePermission>
            }
          />

          <Route
            path="/admin/qglobal"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <QGlobalAllPage />
              </RequirePermission>
            }
          />

          <Route
            path="/admin/qps"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <QPerSurvAllPage />
              </RequirePermission>
            }
          />

          <Route
            path="/admin/qcat"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <QCatAllPage />
              </RequirePermission>
            }
          />

          <Route
            path="/admin/places/communes"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <CommuneAllPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/places/show/:entity/:id"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <ShowPage />
              </RequirePermission>
            }
          />

          <Route
            path="/admin/places/districts"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <DistrictAllPage />
              </RequirePermission>
            }
          />

          <Route
            path="/admin/places/cantons"
            element={
              <RequirePermission scope="DATASET" level="READ">
                <CantonAllPage />
              </RequirePermission>
            }
          />

          {/* Pages admin (rôle ADMIN uniquement) */}
          <Route
            path="/admin/users/new"
            element={
              <RequirePermission scope="PROJECT" level="WRITE">
                <AddMemberPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequirePermission scope="PROJECT" level="READ">
                <AdminUsersPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/config/placeOfInterest"
            element={
              <RequirePermission scope="PROJECT" level="READ">
                <PlaceOfInterestConfigPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/config/theme"
            element={
              <RequirePermission scope="PROJECT" level="READ">
                <ThemeConfigPage />
              </RequirePermission>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

// Tableau de bord (zone privée) : affiche l’utilisateur connecté et pour l'instant un bouton de déconnexion
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const name = user?.full_name ?? t("dashboard.anonymous");
  const role = user?.role ?? null;
  // TODO modifier entierement la page pour afficher des infos pertinentes

  return (
    <section className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
      <p className="text-gray-600">
        {role
          ? t("dashboard.welcomeWithRole", { name, role })
          : t("dashboard.welcome", { name })}
      </p>

      <button
        type="button"
        onClick={logout}
        className="rounded bg-black text-white px-4 py-2 hover:opacity-90"
      >
        {t("dashboard.logout")}
      </button>
    </section>
  );
}

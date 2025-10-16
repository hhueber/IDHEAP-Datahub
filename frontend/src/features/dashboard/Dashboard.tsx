// Tableau de bord (zone privée) : affiche l’utilisateur connecté et pour l'instant un bouton de déconnexion
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <section className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600">Bienvenue {user?.full_name} ({user?.role})</p>

      <button
        onClick={logout}
        className="rounded bg-black text-white px-4 py-2 hover:opacity-90"
      >
        Se déconnecter
      </button>
    </section>
  );
}

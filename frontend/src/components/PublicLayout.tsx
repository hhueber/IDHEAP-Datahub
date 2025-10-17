import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

// Layout de la zone publique : navbar en haut + contenu scrollable
export default function PublicLayout() {
  return (
    // colle l'app au viewport (pas de calc, pas de bande)
    <div className="fixed inset-0 bg-white">
      <Navbar />                         {/* bouton flottant */}
      <main className="absolute inset-0"> {/* parent pour la map en absolute */}
        <Outlet />
      </main>
    </div>
  );
}

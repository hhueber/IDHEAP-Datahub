import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

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
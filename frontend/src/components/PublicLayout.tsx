import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

// Layout de la zone publique : navbar en haut + contenu scrollable
export default function PublicLayout() {
  return (
    <div className="h-screen overflow-hidden bg-white">
      <Navbar />
      <main className="h-[calc(100vh-4rem)] overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

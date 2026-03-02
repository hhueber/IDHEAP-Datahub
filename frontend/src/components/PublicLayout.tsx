import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/theme/useTheme";

// Layout de la zone publique : navbar en haut + contenu scrollable
export default function PublicLayout() {
  const { background } = useTheme();
  return (
    <div className="h-screen overflow-hidden" style = {{ backgroundColor: background }}>
      <Navbar />
      <main className="h-[calc(100vh-4rem)] overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

import { Outlet, Route, Routes } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

function Layout() {
  return (
    <div className="h-screen overflow-hidden bg-white">
      <Navbar />
      <main className="h-[calc(100vh-4rem)] overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Page publique */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

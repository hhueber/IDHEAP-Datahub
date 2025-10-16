import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Garde d’accès par rôle : autorise l’accès seulement si l’utilisateur possède l’un des rôles requis
export default function RequireRole({
  roles,
  children,
}: {
  roles: Array<"ADMIN" | "MEMBER">;
  children: JSX.Element;
}) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(...roles)) {
    return <Navigate to="/404" replace />;
  }

  return children;
}

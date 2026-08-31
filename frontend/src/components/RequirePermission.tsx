import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { PermissionLevel, PermissionScope } from "@/config/roles";

type RequirePermissionProps = {
  scope: PermissionScope;
  level: PermissionLevel;
  children: React.ReactNode;
};

// Garde d’accès par permission : autorise l’accès seulement si l’utilisateur possède l’une des permissiions requises
export default function RequirePermission({
  scope,
  level,
  children,
}: RequirePermissionProps) {
  const { isAuthenticated, can } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!can(scope, level)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

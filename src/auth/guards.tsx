import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./authContext";
import { safeInternalPath } from "./types";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Outlet />;

  const from = safeInternalPath((location.state as { from?: string } | null)?.from);
  return <Navigate to={from} replace />;
}

export function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return <Navigate to="/projects" replace />;
  return <Outlet />;
}

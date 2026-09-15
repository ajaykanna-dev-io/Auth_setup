import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "../redux/hooks";

/**
 * Wraps protected routes.
 * If the user is not authenticated, redirect to /login.
 */
export default function ProtectedRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

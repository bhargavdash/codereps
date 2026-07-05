import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";

/** Skeleton, not a spinner — consistent with the product register's loading convention. */
function AuthSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg" aria-busy="true">
      <div className="cr-skel h-8 w-8 rounded-full border-2 border-border-2 border-t-primary" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthSkeleton />;
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

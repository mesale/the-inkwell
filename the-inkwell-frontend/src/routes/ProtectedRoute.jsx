import { useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, login } = useAuth();

  useEffect(() => {
    if (!user && !loading) {
      login();
    }
  }, [user, loading, login]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-lg animate-spin" />
          <p className="text-sm font-medium">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && !user.roles.includes(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

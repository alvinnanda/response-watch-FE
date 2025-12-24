import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function RequireProfileCompletion() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, let ProtectedRoute handle it (or redirect to login)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if profile is complete (using organization as the key indicator)
  const isProfileComplete = !!user.organization;

  if (!isProfileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}

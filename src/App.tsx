import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CreateRequestPage } from './pages/dashboard/CreateRequestPage';
import { GroupsPage } from './pages/dashboard/GroupsPage';
import { DashboardMonitoringPage } from './pages/dashboard/DashboardMonitoringPage';
import { SmartLinkPage } from './pages/public/SmartLinkPage';
import { PublicMonitoringPage } from './pages/public/PublicMonitoringPage';
import { PublicCreateRequestPage } from './pages/public/PublicCreateRequestPage';
import { PricingPage } from './pages/public/PricingPage';
import { CompleteProfilePage } from './pages/auth/CompleteProfilePage';
import { RequireProfileCompletion } from './components/auth/RequireProfileCompletion';

// Route component to handle root path logic
function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PublicCreateRequestPage />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Dashboard Routes (Protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            
            <Route element={<RequireProfileCompletion />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="create" element={<CreateRequestPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="monitoring" element={<DashboardMonitoringPage />} />
              </Route>  
            </Route>
          </Route>
          
          
          {/* Public Smart Link */}
          <Route path="/t/:token" element={<SmartLinkPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        <Route path="/m/:username" element={<PublicMonitoringPage />} />
          <Route path="/landing-page" element={<PublicCreateRequestPage />} />
          
          {/* Root Route: Logic is handled in RootRoute component */}
          <Route path="/" element={<RootRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

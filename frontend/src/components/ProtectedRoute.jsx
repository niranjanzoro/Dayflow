import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guards a route behind authentication, and optionally behind a role list.
 * Usage: <ProtectedRoute roles={['HR']}><AdminDashboard/></ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading Dayflow…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    // Authenticated but wrong role - send them to their own dashboard.
    const fallback = user.role === 'HR' ? '/admin' : '/employee';
    return <Navigate to={fallback} replace />;
  }

  return children;
}

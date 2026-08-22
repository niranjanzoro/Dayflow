import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Payroll from './pages/Payroll';
import NotFound from './pages/NotFound';

import { ROLES } from './utils/roles';

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === ROLES.HR ? '/admin' : '/employee'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Employee */}
      <Route path="/employee" element={<ProtectedRoute roles={[ROLES.EMPLOYEE]}><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/employee/profile" element={<ProtectedRoute roles={[ROLES.EMPLOYEE]}><Profile /></ProtectedRoute>} />
      <Route path="/employee/attendance" element={<ProtectedRoute roles={[ROLES.EMPLOYEE]}><Attendance /></ProtectedRoute>} />
      <Route path="/employee/leave" element={<ProtectedRoute roles={[ROLES.EMPLOYEE]}><Leave /></ProtectedRoute>} />
      <Route path="/employee/payroll" element={<ProtectedRoute roles={[ROLES.EMPLOYEE]}><Payroll /></ProtectedRoute>} />

      {/* Admin / HR */}
      <Route path="/admin" element={<ProtectedRoute roles={[ROLES.HR]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute roles={[ROLES.HR]}><EmployeeManagement /></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute roles={[ROLES.HR]}><Attendance /></ProtectedRoute>} />
      <Route path="/admin/leave" element={<ProtectedRoute roles={[ROLES.HR]}><Leave /></ProtectedRoute>} />
      <Route path="/admin/payroll" element={<ProtectedRoute roles={[ROLES.HR]}><Payroll /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute roles={[ROLES.HR]}><Profile /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

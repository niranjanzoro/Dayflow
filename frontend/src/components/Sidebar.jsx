import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, User, CalendarCheck, CalendarClock, Wallet, Users, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const employeeLinks = [
  { to: '/employee', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employee/profile', label: 'Profile', icon: User },
  { to: '/employee/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/employee/leave', label: 'Leave', icon: CalendarClock },
  { to: '/employee/payroll', label: 'Payroll', icon: Wallet },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/leave', label: 'Leave Approvals', icon: CalendarClock },
  { to: '/admin/payroll', label: 'Payroll', icon: Wallet },
  { to: '/admin/profile', label: 'Profile', icon: User },
];

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Sidebar({ open, onNavigate }) {
  const { user, isHR, logout } = useAuth();
  const links = isHR ? adminLinks : employeeLinks;

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <svg width="26" height="26" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#E1A940" />
          <path d="M8 38c6 0 6-14 12-14s6 14 12 14 6-14 12-14 6 14 12 14" stroke="#182940" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
        Dayflow
      </div>

      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials(user?.name)}</div>
          <div>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{isHR ? 'HR / Admin' : 'Employee'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  );
}

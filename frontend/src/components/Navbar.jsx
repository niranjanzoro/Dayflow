import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, onMenuClick }) {
  const { isHR } = useAuth();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="menu-toggle" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-actions">
        <span className="badge badge-neutral">{isHR ? 'HR / Admin Console' : 'Employee Self-Service'}</span>
      </div>
    </header>
  );
}

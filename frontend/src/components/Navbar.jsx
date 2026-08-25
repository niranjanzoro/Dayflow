import { Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ title, onMenuClick }) {
  const { isHR } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="topbar">
      <div className="row gap-12">
        <button type="button" className="menu-toggle" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-actions">
        <span className="badge badge-neutral">{isHR ? 'HR / Admin Console' : 'Employee Self-Service'}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

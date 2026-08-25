import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar open={menuOpen} onNavigate={closeMenu} />
      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} aria-hidden="true" />}
      <div className="main-area">
        <Navbar title={title} onMenuClick={() => setMenuOpen((v) => !v)} />
        <main id="main-content" className="page">{children}</main>
      </div>
    </div>
  );
}

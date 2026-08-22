import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div className="main-area">
        <Navbar title={title} onMenuClick={() => setMenuOpen((v) => !v)} />
        <div className="page">{children}</div>
      </div>
    </div>
  );
}

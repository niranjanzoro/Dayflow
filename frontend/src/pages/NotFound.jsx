import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--bg)' }}>
      <CompassIcon size={34} color="var(--primary)" />
      <h1 style={{ fontSize: 22 }}>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>Back to Dayflow</Link>
    </div>
  );
}

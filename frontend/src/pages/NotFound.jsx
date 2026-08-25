import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="not-found-screen">
      <Compass size={34} color="var(--brand-text)" />
      <h1 className="h2-lg">Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary mt-sm">Back to Dayflow</Link>
    </div>
  );
}

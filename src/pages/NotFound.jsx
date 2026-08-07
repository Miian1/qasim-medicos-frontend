import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={36} />
        </div>
        <h1 className="text-6xl font-bold text-ink">404</h1>
        <h2 className="text-xl font-semibold text-ink mt-2">Page not found</h2>
        <p className="text-sm text-muted mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-flex">
          <Home size={16} /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}

import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={className || 'animate-spin text-primary'} />;
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Spinner size={36} />
      <p className="mt-3 text-sm text-muted">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-lg"></div>
        <div className="flex-1">
          <div className="skeleton h-4 w-24 mb-2"></div>
          <div className="skeleton h-3 w-16"></div>
        </div>
      </div>
      <div className="skeleton h-8 w-32 mt-4"></div>
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div className="skeleton h-4 w-full"></div>
        </td>
      ))}
    </tr>
  );
}

export function SkeletonList({ rows = 5, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      <table className="table">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Spinner;

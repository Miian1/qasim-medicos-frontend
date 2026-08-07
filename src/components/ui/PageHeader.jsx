import { Link } from 'react-router-dom';
import { classNames } from '../../utils/format.js';

export function PageHeader({ title, subtitle, action, back, breadcrumbs = [] }) {
  return (
    <div className="mb-6">
      {breadcrumbs.length > 0 && (
        <nav className="text-xs text-muted mb-2 flex items-center gap-1">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {b.to ? (
                <Link to={b.to} className="hover:text-primary">
                  {b.label}
                </Link>
              ) : (
                <span className={classNames(i === breadcrumbs.length - 1 && 'text-ink font-medium')}>{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary', subtitle }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center', colors[color])}>
          {Icon && <Icon size={20} />}
        </div>
        {trend && (
          <div
            className={classNames(
              'text-xs font-medium px-2 py-0.5 rounded-md',
              trend === 'up' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            )}
          >
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-sm text-muted mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    completed: { cls: 'badge-success', label: 'Completed' },
    refunded: { cls: 'badge-danger', label: 'Refunded' },
    cancelled: { cls: 'badge-muted', label: 'Cancelled' },
    pending: { cls: 'badge-warning', label: 'Pending' },
    received: { cls: 'badge-success', label: 'Received' },
    paid: { cls: 'badge-success', label: 'Paid' },
    partial: { cls: 'badge-warning', label: 'Partial' },
    unpaid: { cls: 'badge-danger', label: 'Unpaid' },
    active: { cls: 'badge-success', label: 'Active' },
    inactive: { cls: 'badge-muted', label: 'Inactive' },
    owner: { cls: 'badge-info', label: 'Owner' },
    manager: { cls: 'badge-info', label: 'Manager' },
    cashier: { cls: 'badge-info', label: 'Cashier' },
  };
  const cfg = map[status] || { cls: 'badge-muted', label: status };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

export default PageHeader;

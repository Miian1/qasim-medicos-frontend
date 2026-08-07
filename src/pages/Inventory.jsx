import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, AlertTriangle, CalendarClock, DollarSign, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatCard } from '../components/ui/PageHeader.jsx';
import { SkeletonCard, SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { reportAPI } from '../api/index.js';
import { formatCurrency, formatDate, daysUntil, classNames } from '../utils/format.js';

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || '';
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState(initialFilter === 'low-stock' ? 'lowStock' : initialFilter === 'expiring-soon' ? 'expiringSoon' : 'all');

  useEffect(() => {
    reportAPI.inventory()
      .then((res) => setReport(res.data))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'all', label: 'All Items', count: report?.summary?.totalItems || 0 },
    { key: 'lowStock', label: 'Low Stock', count: report?.summary?.lowStockCount || 0 },
    { key: 'outOfStock', label: 'Out of Stock', count: report?.summary?.outOfStockCount || 0 },
    { key: 'expiringSoon', label: 'Expiring Soon', count: report?.summary?.expiringSoonCount || 0 },
    { key: 'expired', label: 'Expired', count: report?.summary?.expiredCount || 0 },
  ];

  const getItems = () => {
    if (!report) return [];
    if (tab === 'lowStock') return report.lowStock;
    if (tab === 'outOfStock') return report.outOfStock;
    if (tab === 'expiringSoon') return report.expiringSoon;
    if (tab === 'expired') return report.expired;
    return [];
  };

  const items = getItems();

  return (
    <DashboardLayout>
      <PageHeader
        title="Inventory Management"
        subtitle="Stock levels, valuation, and alerts"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Inventory' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Stock Value (Cost)" value={formatCurrency(report?.summary?.totalStockValue || 0)} icon={DollarSign} color="primary" />
            <StatCard title="Retail Value" value={formatCurrency(report?.summary?.totalRetailValue || 0)} icon={TrendingUp} color="success" />
            <StatCard title="Low Stock Items" value={report?.summary?.lowStockCount || 0} icon={AlertTriangle} color="warning" />
            <StatCard title="Expiring Soon" value={report?.summary?.expiringSoonCount || 0} icon={CalendarClock} color="danger" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden mb-4">
        <div className="flex overflow-x-auto border-b border-line no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={classNames(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
              )}
            >
              {t.label} <span className="ml-1 text-xs">({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {loading ? (
        <SkeletonList rows={6} cols={5} />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="No items in this view" message="Everything looks good in this category." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine</th><th>Category</th><th className="text-right">Stock</th>
                  <th className="text-right">Cost</th><th className="text-right">Value</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => {
                  const expDays = daysUntil(m.expiryDate);
                  return (
                    <tr key={m._id}>
                      <td>
                        <p className="font-medium text-ink">{m.name}</p>
                        <p className="text-xs text-muted">{m.brand}</p>
                      </td>
                      <td>{m.category?.name || '—'}</td>
                      <td className="text-right">
                        <span className={classNames('font-medium', m.stock === 0 ? 'text-danger' : m.stock <= m.reorderLevel ? 'text-warning' : 'text-ink')}>
                          {m.stock}
                        </span>
                      </td>
                      <td className="text-right">{formatCurrency(m.costPrice)}</td>
                      <td className="text-right font-medium">{formatCurrency(m.costPrice * m.stock)}</td>
                      <td>
                        {m.expiryDate ? (
                          <span className={classNames('text-xs', expDays < 0 ? 'text-danger' : expDays <= 30 ? 'text-warning' : 'text-muted')}>
                            {formatDate(m.expiryDate, 'short')}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

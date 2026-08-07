import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Receipt, Eye } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatusBadge } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { purchaseAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function Purchases() {
  const navigate = useNavigate();
  const { can } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await purchaseAPI.list({ search, page, limit: 20, status });
      setPurchases(res.data.docs || []);
      setTotal(res.data.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page, status]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Purchases"
        subtitle={`${total} purchase orders`}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Purchases' }]}
        action={can('purchases', 'create') && <Button size="sm" onClick={() => navigate('/purchases/new')}><Plus size={16} /> New Purchase</Button>}
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search by PO number or supplier..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="input pl-10" />
          </div>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="input">
            <option value="">All status</option>
            <option value="received">Received</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={6} cols={6} />
      ) : purchases.length === 0 ? (
        <div className="card">
          {search || status ? <NoResults onReset={() => { setSearch(''); setStatus(''); }} /> : (
            <EmptyState icon={Receipt} title="No purchases yet" message="Record stock purchases from your suppliers."
              action={can('purchases', 'create') ? () => navigate('/purchases/new') : null} actionLabel="New Purchase" />
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>PO Number</th><th>Supplier</th><th className="text-right">Items</th>
                  <th className="text-right">Total</th><th>Status</th><th>Date</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p._id}>
                    <td className="font-medium">
                      <button onClick={() => navigate(`/purchases/${p._id}`)} className="text-primary hover:underline">{p.purchaseNumber}</button>
                    </td>
                    <td>{p.supplierName || p.supplier?.name || '—'}</td>
                    <td className="text-right">{p.items?.length || 0}</td>
                    <td className="text-right font-semibold">{formatCurrency(p.total)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-sm text-muted">{formatDate(p.createdAt)}</td>
                    <td className="text-right">
                      <button onClick={() => navigate(`/purchases/${p._id}`)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary"><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

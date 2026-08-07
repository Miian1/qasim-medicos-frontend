import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Pill, Edit, Trash2, AlertTriangle, CalendarClock, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatusBadge } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { medicineAPI, categoryAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatCurrency, formatDate, daysUntil, classNames, downloadCSV } from '../utils/format.js';

export default function Medicines() {
  const navigate = useNavigate();
  const { can, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState(''); // low-stock, expiring-soon
  const [categories, setCategories] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [view, setView] = useState('table'); // table or grid

  useEffect(() => {
    categoryAPI.listAll().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [page, search, category, filter]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const params = { page, limit, search, category, sortBy: 'createdAt', sortOrder: 'desc' };
      if (filter === 'low-stock') params.isLowStock = 'true';
      if (filter === 'expiring-soon') params.isExpiringSoon = 'true';
      const res = await medicineAPI.list(params);
      setMedicines(res.data.docs || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await medicineAPI.remove(deleteId);
      toast.success('Medicine deleted');
      loadMedicines();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const rows = medicines.map((m) => ({
      Name: m.name, Generic: m.genericName, Brand: m.brand, Category: m.category?.name || '',
      Stock: m.stock, ReorderLevel: m.reorderLevel, CostPrice: m.costPrice, SellingPrice: m.sellingPrice,
      Expiry: m.expiryDate ? formatDate(m.expiryDate) : '', Barcode: m.barcode,
    }));
    downloadCSV(rows, 'medicines.csv');
    toast.success('Exported to CSV');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <PageHeader
        title="Medicines"
        subtitle={`${total} items in inventory`}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Medicines' }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={16} /> Export
            </Button>
            {can('medicines', 'create') && (
              <Button size="sm" onClick={() => navigate('/medicines/new')}>
                <Plus size={16} /> Add Medicine
              </Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name, generic, brand, barcode..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="input pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setPage(1); setCategory(e.target.value); }}
            className="input"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(e) => { setPage(1); setFilter(e.target.value); }}
            className="input"
          >
            <option value="">All items</option>
            <option value="low-stock">Low stock only</option>
            <option value="expiring-soon">Expiring soon only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonList rows={8} cols={7} />
      ) : medicines.length === 0 ? (
        <div className="card">
          {search || category || filter ? (
            <NoResults onReset={() => { setSearch(''); setCategory(''); setFilter(''); }} />
          ) : (
            <EmptyState
              icon={Pill}
              title="No medicines yet"
              message="Add your first medicine to start tracking inventory."
              action={can('medicines', 'create') ? () => navigate('/medicines/new') : null}
              actionLabel="Add Medicine"
            />
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Price</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => {
                  const expDays = daysUntil(m.expiryDate);
                  const isLow = m.stock <= m.reorderLevel;
                  const isExpiring = expDays !== null && expDays <= 30 && expDays > 0;
                  const isExpired = expDays !== null && expDays < 0;
                  return (
                    <tr key={m._id} className="cursor-pointer" onClick={() => navigate(`/medicines/${m._id}`)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <Pill size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{m.name}</p>
                            <p className="text-xs text-muted">{m.brand} {m.genericName && `• ${m.genericName}`}</p>
                          </div>
                        </div>
                      </td>
                      <td>{m.category?.name || '—'}</td>
                      <td className="text-right">
                        <span className={classNames(
                          'font-medium',
                          m.stock === 0 ? 'text-danger' : isLow ? 'text-warning' : 'text-ink'
                        )}>
                          {m.stock}
                        </span>
                        <span className="text-xs text-muted"> / {m.maxStock}</span>
                      </td>
                      <td className="text-right font-medium">{formatCurrency(m.sellingPrice)}</td>
                      <td>
                        {m.expiryDate ? (
                          <div>
                            <p className={classNames('text-xs', isExpired ? 'text-danger' : isExpiring ? 'text-warning' : 'text-muted')}>
                              {formatDate(m.expiryDate, 'short')}
                            </p>
                            {isExpiring && <p className="text-[10px] text-warning">{expDays}d left</p>}
                            {isExpired && <p className="text-[10px] text-danger">Expired</p>}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {isLow && <span className="badge-warning" title="Low stock"><AlertTriangle size={12} /></span>}
                          {isExpiring && <span className="badge-warning" title="Expiring soon"><CalendarClock size={12} /></span>}
                          {isExpired && <span className="badge-danger" title="Expired">Expired</span>}
                          {!isLow && !isExpiring && !isExpired && <StatusBadge status="active" />}
                        </div>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {can('medicines', 'update') && (
                            <button
                              onClick={() => navigate(`/medicines/${m._id}/edit`)}
                              className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {can('medicines', 'delete') && (
                            <button
                              onClick={() => setDeleteId(m._id)}
                              className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-danger"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-line">
              <p className="text-sm text-muted">
                Page {page} of {totalPages} • {total} items
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete medicine?"
        message="This action cannot be undone. The medicine will be permanently removed."
        confirmText="Delete"
        danger
      />
    </DashboardLayout>
  );
}

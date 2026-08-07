import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, FileText, Download, Eye, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatusBadge } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { saleAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatCurrency, formatDate, downloadCSV } from '../utils/format.js';

export default function Sales() {
  const navigate = useNavigate();
  const { can } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refundId, setRefundId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await saleAPI.list({ search, page, limit: 20, status, paymentMethod, startDate, endDate });
      setSales(res.data.docs || []);
      setTotal(res.data.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page, status, paymentMethod, startDate, endDate]);

  const handleRefund = async () => {
    try {
      await saleAPI.refund(refundId);
      toast.success('Sale refunded. Stock restored.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const rows = sales.map((s) => ({
      Invoice: s.invoiceNumber, Customer: s.customerName, Phone: s.customerPhone,
      Items: s.items?.length || 0, Total: s.total, Payment: s.paymentMethod,
      Status: s.status, Date: formatDate(s.createdAt, 'datetime'),
    }));
    downloadCSV(rows, 'sales.csv');
    toast.success('Exported');
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <DashboardLayout>
      <PageHeader
        title="Sales"
        subtitle={`${total} transactions`}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Sales' }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download size={16} /> Export</Button>
            {can('sales', 'create') && <Button size="sm" onClick={() => navigate('/pos')}>New Sale</Button>}
          </div>
        }
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search invoice, customer, phone..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="input pl-10" />
          </div>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="input">
            <option value="">All status</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={paymentMethod} onChange={(e) => { setPage(1); setPaymentMethod(e.target.value); }} className="input">
            <option value="">All payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile</option>
            <option value="credit">Credit</option>
          </select>
          <div className="flex gap-1">
            <input type="date" value={startDate} onChange={(e) => { setPage(1); setStartDate(e.target.value); }} className="input text-xs" />
            <input type="date" value={endDate} onChange={(e) => { setPage(1); setEndDate(e.target.value); }} className="input text-xs" />
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={8} cols={7} />
      ) : sales.length === 0 ? (
        <div className="card">
          {search || status || paymentMethod || startDate ? <NoResults onReset={() => { setSearch(''); setStatus(''); setPaymentMethod(''); setStartDate(''); setEndDate(''); }} /> : (
            <EmptyState icon={FileText} title="No sales yet" message="Sales will appear here once you start making transactions."
              action={can('sales', 'create') ? () => navigate('/pos') : null} actionLabel="Make First Sale" />
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th><th>Customer</th><th className="text-right">Items</th>
                  <th className="text-right">Total</th><th>Payment</th><th>Status</th>
                  <th>Date</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id}>
                    <td className="font-medium">
                      <Link to={`/sales/${s._id}`} className="text-primary hover:underline">{s.invoiceNumber}</Link>
                    </td>
                    <td>{s.customerName}<br/><span className="text-xs text-muted">{s.customerPhone}</span></td>
                    <td className="text-right">{s.items?.length || 0}</td>
                    <td className="text-right font-semibold">{formatCurrency(s.total)}</td>
                    <td><span className="capitalize text-sm">{s.paymentMethod}</span></td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-sm text-muted">{formatDate(s.createdAt, 'datetime')}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/sales/${s._id}`} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary" title="View"><Eye size={16} /></Link>
                        {can('sales', 'create') && s.status === 'completed' && (
                          <button onClick={() => setRefundId(s._id)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-danger" title="Refund"><RotateCcw size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-line">
              <p className="text-sm text-muted">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!refundId}
        onClose={() => setRefundId(null)}
        onConfirm={handleRefund}
        title="Refund this sale?"
        message="The sale will be marked as refunded and all stock will be restored to inventory. This cannot be undone."
        confirmText="Refund sale"
        danger
      />
    </DashboardLayout>
  );
}

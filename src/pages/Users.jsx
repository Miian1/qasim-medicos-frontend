import { useEffect, useState } from 'react';
import {
  Plus, Search, UserCog, Edit, Trash2, KeyRound, ShieldCheck, Eye, Download, Printer, TrendingUp, ShoppingCart, DollarSign, Users as UsersIcon, Calendar, Activity as ActivityIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatusBadge, StatCard } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { SkeletonList, Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { userAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatDate, formatCurrency, formatRelativeTime, downloadCSV, printElement } from '../utils/format.js';

const EMPTY = { name: '', email: '', password: '', phone: '', role: 'cashier', address: '', isActive: true };

export default function Users() {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // User report modal state
  const [reportUser, setReportUser] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await userAPI.list({ search, page, limit: 20, role });
      setUsers(res.data.docs || []);
      setTotal(res.data.pagination?.total || 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, page, role]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ ...u, password: '' }); setModalOpen(true); };

  const openReport = async (u) => {
    setReportUser(u);
    setReport(null);
    setReportLoading(true);
    try {
      const res = await userAPI.getReport(u._id);
      setReport(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load user report');
      setReportUser(null);
    } finally { setReportLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    if (!editing && !form.password) { toast.error('Password is required for new users'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { password, ...rest } = form;
        await userAPI.update(editing._id, rest);
        toast.success('User updated');
      } else {
        await userAPI.create(form);
        toast.success('User created');
      }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await userAPI.remove(deleteId); toast.success('User deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await userAPI.resetPassword(resetUser._id, newPassword);
      toast.success('Password reset');
      setResetUser(null); setNewPassword('');
    } catch (err) { toast.error(err.message); }
  };

  const exportSalesCSV = () => {
    if (!report?.recentSales?.length) { toast.error('No sales to export'); return; }
    const rows = report.recentSales.map((s) => ({
      invoice: s.invoiceNumber,
      date: new Date(s.createdAt).toISOString(),
      customer: s.customerName || s.customer?.name || '',
      phone: s.customerPhone || s.customer?.phone || '',
      items: s.items?.length || 0,
      quantity: s.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
      subtotal: s.subtotal,
      discount: s.discount,
      tax: s.tax,
      total: s.total,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      status: s.status,
    }));
    downloadCSV(rows, `${reportUser.name.replace(/\s+/g, '_')}_sales.csv`);
  };

  const exportSummaryCSV = () => {
    if (!report) return;
    const s = report.summary;
    const rows = [
      { metric: 'All-time Revenue', value: s.allTime.revenue },
      { metric: 'All-time Orders', value: s.allTime.count },
      { metric: 'Average Order Value', value: s.allTime.avgOrder },
      { metric: 'Estimated Profit', value: s.allTime.estimatedProfit },
      { metric: 'Unique Customers Served', value: s.allTime.uniqueCustomers },
      { metric: 'This Month Revenue', value: s.thisMonth.revenue },
      { metric: 'This Month Orders', value: s.thisMonth.count },
      { metric: 'Today Revenue', value: s.today.revenue },
      { metric: 'Today Orders', value: s.today.count },
      { metric: 'Refunded Count', value: s.refunded.count },
      { metric: 'Refunded Total', value: s.refunded.total },
    ];
    downloadCSV(rows, `${reportUser.name.replace(/\s+/g, '_')}_summary.csv`);
  };

  const exportTopProductsCSV = () => {
    if (!report?.topProducts?.length) { toast.error('No top products to export'); return; }
    const rows = report.topProducts.map((p) => ({
      product: p.name,
      unitsSold: p.totalSold,
      revenue: p.revenue,
    }));
    downloadCSV(rows, `${reportUser.name.replace(/\s+/g, '_')}_top_products.csv`);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="User Management"
        subtitle={`${total} users`}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Users' }]}
        action={<Button size="sm" onClick={openNew}><Plus size={16} /> Add User</Button>}
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search users..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="input pl-10" />
          </div>
          <select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} className="input">
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={5} cols={5} />
      ) : users.length === 0 ? (
        <div className="card">{search || role ? <NoResults onReset={() => { setSearch(''); setRole(''); }} /> : <EmptyState icon={UserCog} title="No users" />}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{u.name}</span>
                        {u._id === currentUser._id && <span className="badge-info text-[10px]">You</span>}
                      </div>
                    </td>
                    <td className="text-sm">{u.email}</td>
                    <td className="text-sm">{u.phone || '—'}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                    <td className="text-sm text-muted">{formatDate(u.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openReport(u)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary" title="View report"><Eye size={16} /></button>
                        <button onClick={() => setResetUser(u)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-warning" title="Reset password"><KeyRound size={16} /></button>
                        {u.role !== 'owner' && (
                          <>
                            <button onClick={() => openEdit(u)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary"><Edit size={16} /></button>
                            <button onClick={() => setDeleteId(u._id)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-danger"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit User' : 'New User'}
        size="lg"
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[{ value: 'manager', label: 'Manager' }, { value: 'cashier', label: 'Cashier' }]} />
          {!editing && (
            <Input label="Password" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} hint="Minimum 6 characters" />
          )}
          <div className="sm:col-span-2">
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-line text-primary focus:ring-primary" />
            <span className="text-sm">Active account</span>
          </label>
        </form>
      </Modal>

      {/* User Report Modal */}
      <Modal
        isOpen={!!reportUser}
        onClose={() => { setReportUser(null); setReport(null); }}
        title={reportUser ? `User Report — ${reportUser.name}` : 'User Report'}
        size="xl"
        footer={<>
          <Button variant="outline" onClick={exportSummaryCSV}><Download size={14} /> Summary CSV</Button>
          <Button variant="outline" onClick={exportTopProductsCSV}><Download size={14} /> Top Products CSV</Button>
          <Button variant="outline" onClick={exportSalesCSV}><Download size={14} /> Sales CSV</Button>
          <Button variant="outline" onClick={() => printElement('user-report-print')}><Printer size={14} /> Print</Button>
          <Button onClick={() => setReportUser(null)}>Close</Button>
        </>}
      >
        {reportLoading ? (
          <div className="flex items-center justify-center py-12"><Spinner size={36} /></div>
        ) : report ? (
          <div id="user-report-print" className="space-y-5">
            {/* User Info */}
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold flex-shrink-0">
                  {reportUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-ink">{reportUser.name}</h3>
                    <StatusBadge status={reportUser.role} />
                    <StatusBadge status={reportUser.isActive ? 'active' : 'inactive'} />
                  </div>
                  <div className="text-sm text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>{reportUser.email}</span>
                    {reportUser.phone && <span>• {reportUser.phone}</span>}
                    <span>• Joined {formatDate(reportUser.createdAt, 'long')}</span>
                    {reportUser.address && <span>• {reportUser.address}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                title="All-time Revenue"
                value={formatCurrency(report.summary.allTime.revenue)}
                subtitle={`${report.summary.allTime.count} orders`}
                icon={DollarSign}
                color="primary"
              />
              <StatCard
                title="Estimated Profit"
                value={formatCurrency(report.summary.allTime.estimatedProfit)}
                subtitle="Revenue minus COGS"
                icon={TrendingUp}
                color="success"
              />
              <StatCard
                title="Avg Order Value"
                value={formatCurrency(report.summary.allTime.avgOrder)}
                subtitle="All-time average"
                icon={ShoppingCart}
                color="secondary"
              />
              <StatCard
                title="Unique Customers"
                value={report.summary.allTime.uniqueCustomers}
                subtitle="Served by this user"
                icon={UsersIcon}
                color="warning"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-primary" />
                  <p className="text-xs text-muted">Today</p>
                </div>
                <p className="text-lg font-semibold text-ink">{formatCurrency(report.summary.today.revenue)}</p>
                <p className="text-xs text-muted">{report.summary.today.count} orders today</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-primary" />
                  <p className="text-xs text-muted">This Month</p>
                </div>
                <p className="text-lg font-semibold text-ink">{formatCurrency(report.summary.thisMonth.revenue)}</p>
                <p className="text-xs text-muted">{report.summary.thisMonth.count} orders this month</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ActivityIcon size={16} className="text-danger" />
                  <p className="text-xs text-muted">Refunded</p>
                </div>
                <p className="text-lg font-semibold text-ink">{formatCurrency(report.summary.refunded.total)}</p>
                <p className="text-xs text-muted">{report.summary.refunded.count} refunds</p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            {report.paymentBreakdown?.length > 0 && (
              <div className="card p-4">
                <h4 className="font-semibold text-ink mb-3">Payment Methods</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {report.paymentBreakdown.map((p) => (
                    <div key={p._id} className="text-center p-3 rounded-md bg-bg">
                      <p className="text-xs text-muted capitalize mb-1">{p._id}</p>
                      <p className="font-semibold text-ink">{formatCurrency(p.total, { decimals: 0 })}</p>
                      <p className="text-xs text-muted">{p.count} sales</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Products */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-line">
                <h4 className="font-semibold text-ink">Top Products Sold by {reportUser.name}</h4>
                <Button size="sm" variant="ghost" onClick={exportTopProductsCSV}><Download size={12} /> CSV</Button>
              </div>
              {report.topProducts?.length === 0 ? (
                <EmptyState icon={TrendingUp} title="No sales by this user yet" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr><th>#</th><th>Product</th><th className="text-right">Units Sold</th><th className="text-right">Revenue</th></tr>
                    </thead>
                    <tbody>
                      {report.topProducts.map((p, i) => (
                        <tr key={i}>
                          <td className="text-muted">{i + 1}</td>
                          <td className="font-medium">{p.name}</td>
                          <td className="text-right">{p.totalSold}</td>
                          <td className="text-right font-medium">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Sales */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-line">
                <h4 className="font-semibold text-ink">Recent Sales ({report.recentSales?.length || 0})</h4>
                <Button size="sm" variant="ghost" onClick={exportSalesCSV}><Download size={12} /> CSV</Button>
              </div>
              {report.recentSales?.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="No sales recorded" />
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="table">
                    <thead>
                      <tr><th>Invoice</th><th>Customer</th><th className="text-right">Items</th><th className="text-right">Total</th><th>Payment</th><th>Status</th><th className="text-right">Date</th></tr>
                    </thead>
                    <tbody>
                      {report.recentSales.map((s) => (
                        <tr key={s._id}>
                          <td className="font-medium text-primary">{s.invoiceNumber}</td>
                          <td>{s.customerName || s.customer?.name || 'Walk-in'}</td>
                          <td className="text-right">{s.items?.length || 0}</td>
                          <td className="text-right font-medium">{formatCurrency(s.total)}</td>
                          <td><span className="badge-info capitalize">{s.paymentMethod}</span></td>
                          <td><StatusBadge status={s.status} /></td>
                          <td className="text-right text-muted text-xs">{formatRelativeTime(s.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {report.recentActivity?.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-line">
                  <h4 className="font-semibold text-ink">Recent Activity</h4>
                </div>
                <div className="p-4 max-h-72 overflow-y-auto">
                  <div className="space-y-3">
                    {report.recentActivity.map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink">{a.description}</p>
                          <p className="text-xs text-muted">{formatRelativeTime(a.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!resetUser}
        onClose={() => { setResetUser(null); setNewPassword(''); }}
        title={`Reset password — ${resetUser?.name}`}
        size="sm"
        footer={<><Button variant="outline" onClick={() => { setResetUser(null); setNewPassword(''); }}>Cancel</Button><Button onClick={handleResetPassword}>Reset</Button></>}
      >
        <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" hint="Minimum 6 characters" autoFocus />
        <p className="text-xs text-muted mt-2 flex items-center gap-1"><ShieldCheck size={12} /> The user will need to use this new password on next login.</p>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete user?"
        message="This will permanently remove the user account. They will lose access immediately."
        confirmText="Delete"
        danger
      />
    </DashboardLayout>
  );
}

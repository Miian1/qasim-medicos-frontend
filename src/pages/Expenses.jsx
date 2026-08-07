import { useEffect, useState } from 'react';
import { Plus, Search, Receipt, Edit, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { expenseAPI } from '../api/index.js';
import { formatCurrency, formatDate, downloadCSV } from '../utils/format.js';

const EMPTY = { title: '', description: '', amount: '', category: 'other', paymentMethod: 'cash', date: '' };
const CATEGORIES = [
  { value: 'rent', label: 'Rent' }, { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' }, { value: 'inventory', label: 'Inventory' },
  { value: 'maintenance', label: 'Maintenance' }, { value: 'marketing', label: 'Marketing' },
  { value: 'supplies', label: 'Supplies' }, { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
];

export default function Expenses() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY, date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await expenseAPI.list({ search, page, limit: 20, category });
      setExpenses(res.data.docs || []);
      setTotal(res.data.pagination?.total || 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, page, category]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] }); setModalOpen(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e, date: e.date ? e.date.split('T')[0] : '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) { toast.error('Title and amount are required'); return; }
    setSaving(true);
    try {
      if (editing) { await expenseAPI.update(editing._id, form); toast.success('Expense updated'); }
      else { await expenseAPI.create(form); toast.success('Expense recorded'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await expenseAPI.remove(deleteId); toast.success('Expense deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const handleExport = () => {
    downloadCSV(expenses.map((e) => ({
      Title: e.title, Amount: e.amount, Category: e.category,
      Payment: e.paymentMethod, Date: formatDate(e.date),
    })), 'expenses.csv');
    toast.success('Exported');
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Expenses"
        subtitle={`${total} expense records`}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Expenses' }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download size={16} /> Export</Button>
            <Button size="sm" onClick={openNew}><Plus size={16} /> Add Expense</Button>
          </div>
        }
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="input pl-10" />
          </div>
          <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }} className="input">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={6} cols={5} />
      ) : expenses.length === 0 ? (
        <div className="card">
          {search || category ? <NoResults onReset={() => { setSearch(''); setCategory(''); }} /> : (
            <EmptyState icon={Receipt} title="No expenses yet" message="Track your business expenses here."
              action={openNew} actionLabel="Add Expense" />
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th><th>Category</th><th className="text-right">Amount</th>
                  <th>Payment</th><th>Date</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e._id}>
                    <td>
                      <p className="font-medium text-ink">{e.title}</p>
                      {e.description && <p className="text-xs text-muted truncate">{e.description}</p>}
                    </td>
                    <td><span className="badge-muted capitalize">{e.category}</span></td>
                    <td className="text-right font-semibold text-danger">{formatCurrency(e.amount)}</td>
                    <td className="capitalize text-sm">{e.paymentMethod}</td>
                    <td className="text-sm text-muted">{formatDate(e.date)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary"><Edit size={16} /></button>
                        <button onClick={() => setDeleteId(e._id)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-danger"><Trash2 size={16} /></button>
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
        title={editing ? 'Edit Expense' : 'New Expense'}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount" required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES} />
            <Select label="Payment method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'bank', label: 'Bank' }, { value: 'other', label: 'Other' }]} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete expense?"
        message="This will permanently remove the expense record."
        confirmText="Delete"
        danger
      />
    </DashboardLayout>
  );
}

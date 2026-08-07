import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Edit, Trash2, Phone, Mail, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { customerAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatCurrency, formatDate } from '../utils/format.js';

const EMPTY = { name: '', phone: '', email: '', address: '', gender: '', dateOfBirth: '', allergies: [], chronicConditions: [], notes: '' };

export default function Customers() {
  const navigate = useNavigate();
  const { can } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await customerAPI.list({ search, page, limit: 20 });
      setCustomers(res.data.docs || []);
      setTotal(res.data.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c, dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split('T')[0] : '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    setSaving(true);
    try {
      if (editing) { await customerAPI.update(editing._id, form); toast.success('Customer updated'); }
      else { await customerAPI.create(form); toast.success('Customer created'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await customerAPI.remove(deleteId); toast.success('Customer deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Customers"
        subtitle={`${total} customers`}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Customers' }]}
        action={can('customers', 'create') && <Button size="sm" onClick={openNew}><Plus size={16} /> Add Customer</Button>}
      />

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search by name, phone, or email..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="input pl-10" />
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={6} cols={5} />
      ) : customers.length === 0 ? (
        <div className="card">
          {search ? <NoResults onReset={() => setSearch('')} /> : (
            <EmptyState icon={Users} title="No customers yet" message="Add customers to track sales, loyalty, and history."
              action={can('customers', 'create') ? openNew : null} actionLabel="Add Customer" />
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>Email</th>
                  <th className="text-right">Orders</th><th className="text-right">Total Spent</th>
                  <th className="text-right">Loyalty</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-ink">{c.name}</p>
                          {c.gender && <p className="text-xs text-muted capitalize">{c.gender}</p>}
                        </div>
                      </div>
                    </td>
                    <td><span className="flex items-center gap-1 text-sm"><Phone size={12} className="text-muted" />{c.phone}</span></td>
                    <td className="text-sm">{c.email || '—'}</td>
                    <td className="text-right font-medium">{c.totalOrders}</td>
                    <td className="text-right font-medium">{formatCurrency(c.totalSpent)}</td>
                    <td className="text-right">
                      <span className="badge-info"><Award size={12} /> {c.loyaltyPoints}</span>
                    </td>
                    <td className="text-sm text-muted">{formatDate(c.createdAt, 'short')}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        {can('customers', 'update') && (
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary"><Edit size={16} /></button>
                        )}
                        {can('customers', 'delete') && (
                          <button onClick={() => setDeleteId(c._id)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-danger"><Trash2 size={16} /></button>
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
        title={editing ? 'Edit Customer' : 'New Customer'}
        size="lg"
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
            placeholder="Select gender" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
          <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Allergies (comma-separated)" value={form.allergies.join(', ')}
              onChange={(e) => setForm({ ...form, allergies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete customer?"
        message="This will permanently remove the customer record."
        confirmText="Delete"
        danger
      />
    </DashboardLayout>
  );
}

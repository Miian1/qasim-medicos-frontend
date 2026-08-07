import { useEffect, useState } from 'react';
import { Plus, Search, Truck, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatusBadge } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { supplierAPI } from '../api/index.js';

const EMPTY = { name: '', company: '', email: '', phone: '', address: '', contactPerson: '', gstNumber: '', paymentTerms: 'Net 30' };

export default function Suppliers() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
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
      const res = await supplierAPI.list({ search, page, limit: 20 });
      setSuppliers(res.data.docs || []);
      setTotal(res.data.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    setSaving(true);
    try {
      if (editing) { await supplierAPI.update(editing._id, form); toast.success('Supplier updated'); }
      else { await supplierAPI.create(form); toast.success('Supplier created'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await supplierAPI.remove(deleteId); toast.success('Supplier deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Suppliers"
        subtitle={`${total} suppliers`}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Suppliers' }]}
        action={<Button size="sm" onClick={openNew}><Plus size={16} /> Add Supplier</Button>}
      />

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="input pl-10" />
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={5} cols={4} />
      ) : suppliers.length === 0 ? (
        <div className="card">
          {search ? <NoResults onReset={() => setSearch('')} /> : (
            <EmptyState icon={Truck} title="No suppliers yet" message="Add suppliers to track purchases and stock sources."
              action={openNew} actionLabel="Add Supplier" />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.map((s) => (
            <div key={s._id} className="card p-5 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <Truck size={22} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary"><Edit size={16} /></button>
                  <button onClick={() => setDeleteId(s._id)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-ink mt-3">{s.name}</h3>
              <p className="text-sm text-muted">{s.company || '—'}</p>
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="flex items-center gap-2 text-muted"><Phone size={14} /> {s.phone}</p>
                {s.email && <p className="flex items-center gap-2 text-muted truncate"><Mail size={14} /> {s.email}</p>}
                {s.address && <p className="flex items-center gap-2 text-muted truncate"><MapPin size={14} /> {s.address}</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                <span className="text-xs text-muted">{s.paymentTerms}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Supplier' : 'New Supplier'}
        size="lg"
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <Input label="GST / Tax number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <Input label="Payment terms" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete supplier?"
        message="This will fail if any medicines are linked to this supplier."
        confirmText="Delete"
        danger
      />
    </DashboardLayout>
  );
}

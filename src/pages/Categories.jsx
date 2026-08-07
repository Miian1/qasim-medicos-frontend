import { useEffect, useState } from 'react';
import { Plus, Search, Tags, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { categoryAPI } from '../api/index.js';
import { classNames } from '../utils/format.js';

const ICONS = ['pill', 'flask-conical', 'syringe', 'hand', 'droplet', 'stethoscope', 'apple', 'baby'];
const COLORS = ['#2563EB', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#22C55E', '#06B6D4'];

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: 'pill', color: '#2563EB' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.list({ search, limit: 100 });
      setCategories(res.data.docs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: 'pill', color: '#2563EB' });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description, icon: cat.icon, color: cat.color });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await categoryAPI.update(editing._id, form);
        toast.success('Category updated');
      } else {
        await categoryAPI.create(form);
        toast.success('Category created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await categoryAPI.remove(deleteId);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories`}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Categories' }]}
        action={<Button size="sm" onClick={openNew}><Plus size={16} /> Add Category</Button>}
      />

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={4} cols={3} />
      ) : categories.length === 0 ? (
        <div className="card">
          {search ? <NoResults onReset={() => setSearch('')} /> : (
            <EmptyState icon={Tags} title="No categories yet" message="Create categories to organize your medicines."
              action={openNew} actionLabel="Add Category" />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c._id} className="card p-5 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15`, color: c.color }}>
                  <Tags size={22} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-primary">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setDeleteId(c._id)} className="p-1.5 rounded-md hover:bg-bg text-muted hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-ink mt-3">{c.name}</h3>
              <p className="text-sm text-muted mt-1 line-clamp-2">{c.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'New Category'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={classNames('w-8 h-8 rounded-full border-2', form.color === c ? 'border-ink' : 'border-transparent')}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        message="This will fail if any medicines are using this category."
        confirmText="Delete"
        danger
      />
    </DashboardLayout>
  );
}

import { useEffect, useState } from 'react';
import { Plus, Search, UserCog, Edit, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatusBadge } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { SkeletonList } from '../components/ui/Spinner.jsx';
import { EmptyState, NoResults } from '../components/ui/EmptyState.jsx';
import { userAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatDate } from '../utils/format.js';

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

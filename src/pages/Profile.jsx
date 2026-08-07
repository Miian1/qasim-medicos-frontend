import { useState } from 'react';
import { Save, User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { useAuthStore } from '../store/auth.js';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', avatar: user?.avatar || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); }
    finally { setSavingProfile(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword || !pwd.newPassword) { toast.error('All fields required'); return; }
    if (pwd.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setSavingPwd(true);
    try {
      const { authAPI } = await import('../api/index.js');
      await authAPI.changePassword(pwd);
      toast.success('Password changed');
      setPwd({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(err.message); }
    finally { setSavingPwd(false); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Profile' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardBody className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-semibold text-ink mt-3">{user?.name}</h3>
            <p className="text-sm text-muted">{user?.email}</p>
            <span className="badge-info capitalize mt-2 inline-block">{user?.role}</span>
          </CardBody>
        </Card>

        {/* Edit forms */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="p-5 border-b border-line flex items-center gap-2">
              <User size={18} className="text-primary" />
              <h3 className="font-semibold text-ink">Personal Information</h3>
            </div>
            <CardBody>
              <form onSubmit={handleProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} icon={<User size={18} />} />
                <Input label="Email" value={user?.email || ''} disabled icon={<Mail size={18} />} />
                <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} icon={<Phone size={18} />} />
                <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} icon={<MapPin size={18} />} />
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" loading={savingProfile}><Save size={16} /> Save changes</Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <div className="p-5 border-b border-line flex items-center gap-2">
              <Lock size={18} className="text-warning" />
              <h3 className="font-semibold text-ink">Change Password</h3>
            </div>
            <CardBody>
              <form onSubmit={handlePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Current password" type="password" required value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
                <Input label="New password" type="password" required value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} hint="Min 6 characters" />
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" loading={savingPwd} variant="secondary"><Lock size={16} /> Update password</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

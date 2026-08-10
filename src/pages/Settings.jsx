import { useEffect, useState } from 'react';
import { Save, Building2, DollarSign, Receipt, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { LoadingPage } from '../components/ui/Spinner.jsx';
import { settingsAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';

export default function Settings() {
  const { can, user } = useAuthStore();
  // Only owner can edit settings. Manager can view but not save changes.
  const canEdit = user?.role === 'owner';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    settingsAPI.get().then((res) => setForm(res.data.settings)).finally(() => setLoading(false));
  }, []);

  const set = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(form);
      toast.success('Settings saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading || !form) return <DashboardLayout><LoadingPage /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        subtitle="Configure your pharmacy"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }]}
        action={canEdit && <Button size="sm" type="submit" form="settings-form" loading={saving}><Save size={16} /> Save</Button>}
      />

      <form id="settings-form" onSubmit={handleSave} className="space-y-4 max-w-4xl">
        <Card>
          <div className="p-5 border-b border-line flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            <h3 className="font-semibold text-ink">Pharmacy Information</h3>
          </div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Pharmacy name" value={form.pharmacyName} onChange={(e) => set('pharmacyName', e.target.value)} disabled={!canEdit} />
            <Input label="Tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} disabled={!canEdit} />
            <div className="sm:col-span-2">
              <Input label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} disabled={!canEdit} />
            </div>
            <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} disabled={!canEdit} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} disabled={!canEdit} />
            <Input label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} disabled={!canEdit} />
            <Input label="GST / Tax number" value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} disabled={!canEdit} />
          </CardBody>
        </Card>

        <Card>
          <div className="p-5 border-b border-line flex items-center gap-2">
            <DollarSign size={18} className="text-success" />
            <h3 className="font-semibold text-ink">Currency</h3>
          </div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Currency code" value={form.currency.code} onChange={(e) => set('currency.code', e.target.value)} disabled={!canEdit} />
            <Input label="Currency symbol" value={form.currency.symbol} onChange={(e) => set('currency.symbol', e.target.value)} disabled={!canEdit} />
            <Select label="Symbol position" value={form.currency.position} onChange={(e) => set('currency.position', e.target.value)} disabled={!canEdit}
              options={[{ value: 'before', label: 'Before amount' }, { value: 'after', label: 'After amount' }]} />
          </CardBody>
        </Card>

        <Card>
          <div className="p-5 border-b border-line flex items-center gap-2">
            <Receipt size={18} className="text-warning" />
            <h3 className="font-semibold text-ink">Tax & Invoicing</h3>
          </div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.taxEnabled} onChange={(e) => set('taxEnabled', e.target.checked)} disabled={!canEdit} className="rounded border-line text-primary" />
              <span className="text-sm">Enable tax on sales</span>
            </label>
            <Input label="Default tax rate %" type="number" step="0.01" value={form.taxRate} onChange={(e) => set('taxRate', Number(e.target.value))} disabled={!canEdit} />
            <Input label="Invoice prefix" value={form.invoicePrefix} onChange={(e) => set('invoicePrefix', e.target.value)} disabled={!canEdit} />
            <Input label="Purchase order prefix" value={form.purchasePrefix} onChange={(e) => set('purchasePrefix', e.target.value)} disabled={!canEdit} />
            <div className="sm:col-span-2">
              <Input label="Invoice footer text" value={form.invoiceFooter} onChange={(e) => set('invoiceFooter', e.target.value)} disabled={!canEdit} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <div className="p-5 border-b border-line flex items-center gap-2">
            <Award size={18} className="text-secondary" />
            <h3 className="font-semibold text-ink">Loyalty Program</h3>
          </div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.loyaltyEnabled} onChange={(e) => set('loyaltyEnabled', e.target.checked)} disabled={!canEdit} className="rounded border-line text-primary" />
              <span className="text-sm">Enable loyalty points</span>
            </label>
            <Input label="Points per currency unit" type="number" value={form.loyaltyPointsPerRupee} onChange={(e) => set('loyaltyPointsPerRupee', Number(e.target.value))} disabled={!canEdit} />
            <Input label="Currency value per point" type="number" step="0.01" value={form.loyaltyRupeePerPoint} onChange={(e) => set('loyaltyRupeePerPoint', Number(e.target.value))} disabled={!canEdit} />
          </CardBody>
        </Card>

        <Card>
          <div className="p-5 border-b border-line">
            <h3 className="font-semibold text-ink">Inventory Alerts</h3>
          </div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Default reorder level" type="number" value={form.defaultReorderLevel} onChange={(e) => set('defaultReorderLevel', Number(e.target.value))} disabled={!canEdit} />
            <Input label="Expiry alert (days)" type="number" value={form.expiryAlertDays} onChange={(e) => set('expiryAlertDays', Number(e.target.value))} disabled={!canEdit} />
          </CardBody>
        </Card>

        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" loading={saving}><Save size={18} /> Save settings</Button>
          </div>
        )}
      </form>
    </DashboardLayout>
  );
}

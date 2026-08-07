import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { LoadingPage } from '../components/ui/Spinner.jsx';
import { purchaseAPI, medicineAPI, supplierAPI } from '../api/index.js';
import { formatCurrency, debounce } from '../utils/format.js';

export default function PurchaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([]);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [notes, setNotes] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [medResults, setMedResults] = useState([]);

  useEffect(() => {
    supplierAPI.listAll().then((res) => setSuppliers(res.data.suppliers || []));
    if (isEdit) {
      purchaseAPI.get(id).then((res) => {
        const p = res.data.purchase;
        setSupplier(p.supplier?._id || '');
        setItems(p.items.map((it) => ({ ...it, medicine: it.medicine?._id || it.medicine, name: it.name || it.medicine?.name })));
        setTax(p.tax); setShipping(p.shipping); setPaidAmount(p.paidAmount);
        setPaymentMethod(p.paymentMethod); setPaymentStatus(p.paymentStatus); setNotes(p.notes);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const searchMeds = debounce(async (q) => {
    if (!q.trim()) { setMedResults([]); return; }
    try {
      const res = await medicineAPI.search(q, 10);
      setMedResults(res.data.medicines || []);
    } catch { setMedResults([]); }
  }, 250);
  useEffect(() => { searchMeds(medSearch); }, [medSearch]);

  const addItem = (m) => {
    if (items.find((i) => i.medicine === m._id)) { toast.error('Already added'); return; }
    setItems((p) => [...p, {
      medicine: m._id, name: m.name, quantity: 1, costPrice: m.costPrice,
      sellingPrice: m.sellingPrice, batchNumber: '', expiryDate: '', total: m.costPrice,
    }]);
    setMedSearch(''); setMedResults([]);
  };

  const updateItem = (idx, field, value) => {
    setItems((p) => p.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: value };
      if (field === 'quantity' || field === 'costPrice') {
        updated.total = Number(updated.quantity) * Number(updated.costPrice);
      }
      return updated;
    }));
  };

  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, it) => s + Number(it.total), 0);
  const total = subtotal + Number(tax) + Number(shipping);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!supplier) { toast.error('Select a supplier'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);
    try {
      const payload = {
        supplier, supplierName: suppliers.find((s) => s._id === supplier)?.name || '',
        items: items.map((it) => ({
          medicine: it.medicine, name: it.name, quantity: Number(it.quantity),
          costPrice: Number(it.costPrice), sellingPrice: Number(it.sellingPrice),
          batchNumber: it.batchNumber, expiryDate: it.expiryDate || null,
          total: Number(it.total),
        })),
        tax: Number(tax), shipping: Number(shipping), paidAmount: Number(paidAmount),
        paymentMethod, paymentStatus, notes, status: 'received',
      };
      if (isEdit) { await purchaseAPI.update(id, payload); toast.success('Purchase updated'); }
      else { await purchaseAPI.create(payload); toast.success('Purchase created — stock added'); }
      navigate('/purchases');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={isEdit ? 'Edit Purchase' : 'New Purchase'}
        subtitle="Record stock received from supplier"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Purchases', to: '/purchases' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={<Button variant="outline" size="sm" onClick={() => navigate('/purchases')}><ArrowLeft size={16} /> Back</Button>}
      />

      <form onSubmit={handleSave} className="space-y-4 max-w-5xl">
        <Card>
          <div className="p-5 border-b border-line"><h3 className="font-semibold text-ink">Supplier & Payment</h3></div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select label="Supplier" required value={supplier} onChange={(e) => setSupplier(e.target.value)}
              placeholder="Select supplier" options={suppliers.map((s) => ({ value: s._id, label: s.name }))} />
            <Select label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'bank', label: 'Bank' }, { value: 'credit', label: 'Credit' }]} />
            <Select label="Payment status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
              options={[{ value: 'paid', label: 'Paid' }, { value: 'partial', label: 'Partial' }, { value: 'unpaid', label: 'Unpaid' }]} />
            <Input label="Paid amount" type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
          </CardBody>
        </Card>

        <Card>
          <div className="p-5 border-b border-line">
            <h3 className="font-semibold text-ink">Items</h3>
          </div>
          <CardBody className="space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Search medicine to add..." value={medSearch} onChange={(e) => setMedSearch(e.target.value)} className="input pl-10" />
              {medResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-card border border-line rounded-lg shadow-pop max-h-60 overflow-y-auto">
                  {medResults.map((m) => (
                    <button key={m._id} type="button" onClick={() => addItem(m)} className="w-full flex items-center justify-between p-2 hover:bg-bg text-left">
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted">{m.brand} • Stock: {m.stock}</p>
                      </div>
                      <Plus size={16} className="text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No items added yet. Search above to add medicines.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medicine</th><th className="w-20">Qty</th><th className="w-28">Cost</th>
                      <th className="w-28">Selling</th><th className="w-28">Batch #</th>
                      <th className="w-36">Expiry</th><th className="w-24 text-right">Total</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{it.name}</td>
                        <td><input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="input py-1 text-sm" /></td>
                        <td><input type="number" step="0.01" value={it.costPrice} onChange={(e) => updateItem(idx, 'costPrice', e.target.value)} className="input py-1 text-sm" /></td>
                        <td><input type="number" step="0.01" value={it.sellingPrice} onChange={(e) => updateItem(idx, 'sellingPrice', e.target.value)} className="input py-1 text-sm" /></td>
                        <td><input type="text" value={it.batchNumber} onChange={(e) => updateItem(idx, 'batchNumber', e.target.value)} className="input py-1 text-sm" /></td>
                        <td><input type="date" value={it.expiryDate ? it.expiryDate.split('T')[0] : ''} onChange={(e) => updateItem(idx, 'expiryDate', e.target.value)} className="input py-1 text-sm" /></td>
                        <td className="text-right font-medium">{formatCurrency(it.total)}</td>
                        <td><button type="button" onClick={() => removeItem(idx)} className="text-muted hover:text-danger"><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="p-5 border-b border-line"><h3 className="font-semibold text-ink">Summary</h3></div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Tax" type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
            <Input label="Shipping" type="number" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-line">
          <div>
            <p className="text-sm text-muted">Total payable</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/purchases')}>Cancel</Button>
            <Button type="submit" loading={saving}><Save size={18} /> {isEdit ? 'Save changes' : 'Create purchase'}</Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}

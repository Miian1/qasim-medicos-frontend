import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Spinner, LoadingPage } from '../components/ui/Spinner.jsx';
import { medicineAPI, categoryAPI, supplierAPI } from '../api/index.js';

export default function MedicineForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: '', genericName: '', brand: '', category: '', supplier: '',
    barcode: '', sku: '', description: '',
    costPrice: '', sellingPrice: '', discount: 0, taxRate: 0,
    stock: 0, reorderLevel: 10, maxStock: 1000, unit: 'piece',
    expiryDate: '', manufactureDate: '',
    isPrescriptionRequired: false, isActive: true,
    storageInstructions: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([categoryAPI.listAll(), supplierAPI.listAll()])
      .then(([cat, sup]) => {
        setCategories(cat.data.categories || []);
        setSuppliers(sup.data.suppliers || []);
      });
    if (isEdit) {
      medicineAPI.get(id).then((res) => {
        const m = res.data.micine || res.data.medicine;
        setForm({
          ...m,
          category: m.category?._id || m.category || '',
          supplier: m.supplier?._id || m.supplier || '',
          expiryDate: m.expiryDate ? m.expiryDate.split('T')[0] : '',
          manufactureDate: m.manufactureDate ? m.manufactureDate.split('T')[0] : '',
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.costPrice === '' || Number(form.costPrice) < 0) e.costPrice = 'Valid cost price required';
    if (form.sellingPrice === '' || Number(form.sellingPrice) < 0) e.sellingPrice = 'Valid selling price required';
    if (Number(form.stock) < 0) e.stock = 'Stock cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock),
        reorderLevel: Number(form.reorderLevel),
        maxStock: Number(form.maxStock),
        discount: Number(form.discount),
        taxRate: Number(form.taxRate),
        expiryDate: form.expiryDate || null,
        manufactureDate: form.manufactureDate || null,
        category: form.category || null,
        supplier: form.supplier || null,
      };
      if (isEdit) {
        await medicineAPI.update(id, payload);
        toast.success('Medicine updated');
      } else {
        await medicineAPI.create(payload);
        toast.success('Medicine created');
      }
      navigate('/medicines');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={isEdit ? 'Edit Medicine' : 'Add New Medicine'}
        subtitle={isEdit ? form.name : 'Create a new medicine entry'}
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Medicines', to: '/medicines' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/medicines')}>
            <ArrowLeft size={16} /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        {/* Basic info */}
        <Card>
          <div className="p-5 border-b border-line">
            <h3 className="font-semibold text-ink">Basic Information</h3>
          </div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Medicine name" required
              value={form.name} onChange={(e) => setField('name', e.target.value)}
              error={errors.name} placeholder="e.g. Panadol Extra"
            />
            <Input
              label="Generic name"
              value={form.genericName} onChange={(e) => setField('genericName', e.target.value)}
              placeholder="e.g. Paracetamol + Caffeine"
            />
            <Input
              label="Brand"
              value={form.brand} onChange={(e) => setField('brand', e.target.value)}
              placeholder="e.g. GSK"
            />
            <Input
              label="Barcode"
              value={form.barcode} onChange={(e) => setField('barcode', e.target.value)}
              placeholder="Scan or type barcode"
            />
            <Select
              label="Category"
              value={form.category} onChange={(e) => setField('category', e.target.value)}
              placeholder="Select category"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
            />
            <Select
              label="Supplier"
              value={form.supplier} onChange={(e) => setField('supplier', e.target.value)}
              placeholder="Select supplier"
              options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
            />
            <div className="sm:col-span-2">
              <Input
                label="Description"
                value={form.description} onChange={(e) => setField('description', e.target.value)}
                placeholder="Optional notes about this medicine"
              />
            </div>
          </CardBody>
        </Card>

        {/* Pricing */}
        <Card>
          <div className="p-5 border-b border-line">
            <h3 className="font-semibold text-ink">Pricing</h3>
          </div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Cost price" required type="number" step="0.01"
              value={form.costPrice} onChange={(e) => setField('costPrice', e.target.value)}
              error={errors.costPrice}
            />
            <Input
              label="Selling price" required type="number" step="0.01"
              value={form.sellingPrice} onChange={(e) => setField('sellingPrice', e.target.value)}
              error={errors.sellingPrice}
            />
            <Input
              label="Discount %" type="number" step="0.01" min="0" max="100"
              value={form.discount} onChange={(e) => setField('discount', e.target.value)}
            />
            <Input
              label="Tax rate %" type="number" step="0.01" min="0" max="100"
              value={form.taxRate} onChange={(e) => setField('taxRate', e.target.value)}
            />
          </CardBody>
        </Card>

        {/* Inventory */}
        <Card>
          <div className="p-5 border-b border-line">
            <h3 className="font-semibold text-ink">Inventory</h3>
          </div>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Current stock" type="number" min="0"
              value={form.stock} onChange={(e) => setField('stock', e.target.value)}
              error={errors.stock}
            />
            <Input
              label="Reorder level" type="number" min="0"
              value={form.reorderLevel} onChange={(e) => setField('reorderLevel', e.target.value)}
              hint="Alert when stock falls to this level"
            />
            <Input
              label="Max stock" type="number" min="0"
              value={form.maxStock} onChange={(e) => setField('maxStock', e.target.value)}
            />
            <Select
              label="Unit"
              value={form.unit} onChange={(e) => setField('unit', e.target.value)}
              options={['piece', 'strip', 'box', 'bottle', 'tube', 'packet', 'ml', 'mg']}
            />
            <Input
              label="Expiry date" type="date"
              value={form.expiryDate} onChange={(e) => setField('expiryDate', e.target.value)}
            />
            <Input
              label="Manufacture date" type="date"
              value={form.manufactureDate} onChange={(e) => setField('manufactureDate', e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Storage instructions"
                value={form.storageInstructions} onChange={(e) => setField('storageInstructions', e.target.value)}
                placeholder="e.g. Store below 25°C, away from light"
              />
            </div>
          </CardBody>
        </Card>

        {/* Status */}
        <Card>
          <div className="p-5 border-b border-line">
            <h3 className="font-semibold text-ink">Status</h3>
          </div>
          <CardBody className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrescriptionRequired}
                onChange={(e) => setField('isPrescriptionRequired', e.target.checked)}
                className="rounded border-line text-primary focus:ring-primary"
              />
              <span className="text-sm text-ink">Prescription required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                className="rounded border-line text-primary focus:ring-primary"
              />
              <span className="text-sm text-ink">Active (available for sale)</span>
            </label>
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => navigate('/medicines')}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {!saving && <Save size={18} />}
            {isEdit ? 'Save changes' : 'Create medicine'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

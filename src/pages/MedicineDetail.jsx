import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Pill, Package, DollarSign, Calendar, AlertTriangle, Truck, Tag,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatusBadge } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { LoadingPage } from '../components/ui/Spinner.jsx';
import { medicineAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatCurrency, formatDate, daysUntil, classNames } from '../utils/format.js';

export default function MedicineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState(null);

  useEffect(() => {
    medicineAPI.get(id)
      .then((res) => setMedicine(res.data.medicine || res.data.micine))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>;
  if (!medicine) return <DashboardLayout><div className="card p-8 text-center text-muted">Medicine not found.</div></DashboardLayout>;

  const expDays = daysUntil(medicine.expiryDate);
  const isLow = medicine.stock <= medicine.reorderLevel;
  const isExpiring = expDays !== null && expDays <= 30 && expDays > 0;
  const isExpired = expDays !== null && expDays < 0;
  const margin = medicine.sellingPrice - medicine.costPrice;
  const marginPercent = medicine.costPrice > 0 ? (margin / medicine.costPrice) * 100 : 0;

  return (
    <DashboardLayout>
      <PageHeader
        title={medicine.name}
        subtitle={`${medicine.brand} ${medicine.genericName ? `• ${medicine.genericName}` : ''}`}
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Medicines', to: '/medicines' },
          { label: medicine.name },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/medicines')}>
              <ArrowLeft size={16} /> Back
            </Button>
            {can('medicines', 'update') && (
              <Button size="sm" onClick={() => navigate(`/medicines/${medicine._id}/edit`)}>
                <Edit size={16} /> Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="p-5 border-b border-line">
              <h3 className="font-semibold text-ink">Product Information</h3>
            </div>
            <CardBody className="grid grid-cols-2 gap-4">
              <InfoRow label="Generic name" value={medicine.genericName || '—'} />
              <InfoRow label="Brand" value={medicine.brand || '—'} />
              <InfoRow label="Category" value={medicine.category?.name || '—'} />
              <InfoRow label="Supplier" value={medicine.supplier?.name || '—'} />
              <InfoRow label="Barcode" value={medicine.barcode || '—'} />
              <InfoRow label="SKU" value={medicine.sku || '—'} />
              <InfoRow label="Unit" value={medicine.unit} />
              <InfoRow label="Status" value={medicine.isActive ? <StatusBadge status="active" /> : <StatusBadge status="inactive" />} />
              <div className="col-span-2">
                <InfoRow label="Description" value={medicine.description || 'No description'} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <div className="p-5 border-b border-line">
              <h3 className="font-semibold text-ink">Pricing & Profit</h3>
            </div>
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted">Cost price</p>
                  <p className="text-lg font-semibold text-ink mt-1">{formatCurrency(medicine.costPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Selling price</p>
                  <p className="text-lg font-semibold text-ink mt-1">{formatCurrency(medicine.sellingPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Profit / unit</p>
                  <p className="text-lg font-semibold text-success mt-1">{formatCurrency(margin)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Margin</p>
                  <p className="text-lg font-semibold text-success mt-1">{marginPercent.toFixed(1)}%</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {medicine.batches && medicine.batches.length > 0 && (
            <Card>
              <div className="p-5 border-b border-line">
                <h3 className="font-semibold text-ink">Batches</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Batch #</th><th className="text-right">Quantity</th><th>Expiry</th><th className="text-right">Cost</th></tr>
                  </thead>
                  <tbody>
                    {medicine.batches.map((b, i) => (
                      <tr key={i}>
                        <td className="font-medium">{b.batchNumber}</td>
                        <td className="text-right">{b.quantity}</td>
                        <td>{formatDate(b.expiryDate)}</td>
                        <td className="text-right">{formatCurrency(b.costPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Stock status */}
        <div className="space-y-4">
          <Card>
            <div className="p-5 border-b border-line">
              <h3 className="font-semibold text-ink">Stock Status</h3>
            </div>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={classNames(
                  'w-12 h-12 rounded-lg flex items-center justify-center',
                  isLow ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                )}>
                  <Package size={22} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink">{medicine.stock}</p>
                  <p className="text-xs text-muted">in stock / {medicine.maxStock} max</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Reorder level</span>
                  <span className="font-medium">{medicine.reorderLevel}</span>
                </div>
                {isLow && (
                  <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-md text-warning text-sm">
                    <AlertTriangle size={14} /> Stock is low — reorder soon
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {medicine.expiryDate && (
            <Card>
              <div className="p-5 border-b border-line">
                <h3 className="font-semibold text-ink">Expiry</h3>
              </div>
              <CardBody className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={classNames(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    isExpired ? 'bg-danger/10 text-danger' : isExpiring ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  )}>
                    <Calendar size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{formatDate(medicine.expiryDate, 'long')}</p>
                    <p className={classNames('text-xs', isExpired ? 'text-danger' : isExpiring ? 'text-warning' : 'text-muted')}>
                      {isExpired ? 'Expired' : isExpiring ? `${expDays} days left` : `${expDays} days left`}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {medicine.isPrescriptionRequired && (
            <Card>
              <CardBody className="flex items-center gap-3 bg-warning/5">
                <div className="w-10 h-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="font-medium text-ink">Prescription required</p>
                  <p className="text-xs text-muted">Verify prescription before sale</p>
                </div>
              </CardBody>
            </Card>
          )}

          {medicine.storageInstructions && (
            <Card>
              <div className="p-5 border-b border-line">
                <h3 className="font-semibold text-ink">Storage</h3>
              </div>
              <CardBody>
                <p className="text-sm text-muted">{medicine.storageInstructions}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted mb-1">{label}</p>
      <div className="text-sm text-ink font-medium">{value}</div>
    </div>
  );
}

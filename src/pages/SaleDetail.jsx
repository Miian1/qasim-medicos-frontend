import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, RotateCcw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatusBadge } from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { LoadingPage } from '../components/ui/Spinner.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { saleAPI, settingsAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatCurrency, formatDate, printElement } from '../utils/format.js';

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [refundConfirm, setRefundConfirm] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    Promise.all([saleAPI.get(id), settingsAPI.get()])
      .then(([s, st]) => {
        setSale(s.data.sale);
        setSettings(st.data.settings);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRefund = async () => {
    try {
      await saleAPI.refund(id);
      toast.success('Sale refunded');
      const res = await saleAPI.get(id);
      setSale(res.data.sale);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>;
  if (!sale) return <DashboardLayout><div className="card p-8 text-center text-muted">Sale not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={sale.invoiceNumber}
        subtitle={formatDate(sale.createdAt, 'datetime')}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Sales', to: '/sales' }, { label: sale.invoiceNumber }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/sales')}><ArrowLeft size={16} /> Back</Button>
            <Button variant="outline" size="sm" onClick={() => printElement('invoice-print')}><Printer size={16} /> Print</Button>
            {can('sales', 'create') && sale.status === 'completed' && (
              <Button variant="danger" size="sm" onClick={() => setRefundConfirm(true)}><RotateCcw size={16} /> Refund</Button>
            )}
          </div>
        }
      />

      <div id="invoice-print" className="max-w-3xl mx-auto">
        <Card>
          {/* Invoice header */}
          <div className="p-6 border-b border-line">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ink">{settings?.pharmacyName || 'Qasim Medicos'}</h1>
                <p className="text-sm text-muted mt-1">{settings?.address || ''}</p>
                <p className="text-sm text-muted">{settings?.phone} {settings?.email && `• ${settings.email}`}</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-ink">INVOICE</h2>
                <p className="text-sm text-muted">{sale.invoiceNumber}</p>
                <div className="mt-2"><StatusBadge status={sale.status} /></div>
              </div>
            </div>
          </div>

          {/* Customer & cashier */}
          <div className="p-6 grid grid-cols-2 gap-4 border-b border-line">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Billed To</p>
              <p className="font-semibold text-ink">{sale.customerName}</p>
              {sale.customerPhone && <p className="text-sm text-muted">{sale.customerPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Served By</p>
              <p className="font-semibold text-ink">{sale.cashierName}</p>
              <p className="text-sm text-muted">{formatDate(sale.createdAt, 'datetime')}</p>
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th><th className="text-right">Qty</th>
                  <th className="text-right">Price</th><th className="text-right">Disc</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, i) => (
                  <tr key={i}>
                    <td className="font-medium">{item.name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.price)}</td>
                    <td className="text-right">{item.discount ? `${item.discount}%` : '—'}</td>
                    <td className="text-right font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-6 border-t border-line">
            <div className="ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span><span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.tax > 0 && (
                <div className="flex justify-between text-muted"><span>Tax</span><span>{formatCurrency(sale.tax)}</span></div>
              )}
              {sale.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount {sale.discountPercent ? `(${sale.discountPercent}%)` : ''}</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-line">
                <span className="font-semibold text-ink">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-muted"><span>Paid ({sale.paymentMethod})</span><span>{formatCurrency(sale.paidAmount)}</span></div>
              {sale.change > 0 && (
                <div className="flex justify-between text-muted"><span>Change</span><span>{formatCurrency(sale.change)}</span></div>
              )}
              <div className="flex justify-between pt-2"><span className="text-muted">Payment status</span><StatusBadge status={sale.paymentStatus} /></div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-line text-center bg-bg/50">
            <p className="text-sm text-muted">{settings?.invoiceFooter || 'Thank you for your business!'}</p>
            {sale.notes && <p className="text-xs text-muted mt-2">Note: {sale.notes}</p>}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={refundConfirm}
        onClose={() => setRefundConfirm(false)}
        onConfirm={handleRefund}
        title="Refund this sale?"
        message="All stock will be restored to inventory. This action cannot be undone."
        confirmText="Confirm refund"
        danger
      />
    </DashboardLayout>
  );
}

import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, Package, Users, Download, FileBarChart,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatCard } from '../components/ui/PageHeader.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { SkeletonCard } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { reportAPI } from '../api/index.js';
import { formatCurrency, formatDate, downloadCSV, classNames } from '../utils/format.js';
import toast from 'react-hot-toast';

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ startDate: '', endDate: '' });
  const [data, setData] = useState(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = { startDate: range.startDate || undefined, endDate: range.endDate || undefined };
      let res;
      if (tab === 'sales') res = await reportAPI.sales({ ...params, groupBy: 'day' });
      else if (tab === 'inventory') res = await reportAPI.inventory();
      else if (tab === 'profit-loss') res = await reportAPI.profitLoss(params);
      else if (tab === 'customers') res = await reportAPI.customers(20);
      setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadReport(); }, [tab, range.startDate, range.endDate]);

  const handleExport = () => {
    let rows = [];
    let filename = `${tab}-report.csv`;
    if (tab === 'sales' && data?.data) {
      rows = data.data.map((d) => ({ Date: d._id, Sales: d.totalSales, Orders: d.count, Avg: d.avgSale, Tax: d.totalTax, Discount: d.totalDiscount }));
    } else if (tab === 'inventory' && data?.lowStock) {
      rows = [...data.lowStock, ...data.outOfStock, ...data.expiringSoon].map((m) => ({
        Name: m.name, Stock: m.stock, CostPrice: m.costPrice, Value: m.costPrice * m.stock,
      }));
    } else if (tab === 'profit-loss' && data?.summary) {
      rows = [{ Metric: 'Revenue', Value: data.summary.revenue }, { Metric: 'COGS', Value: data.summary.cogs },
        { Metric: 'Gross Profit', Value: data.summary.grossProfit }, { Metric: 'Expenses', Value: data.summary.totalExpenses },
        { Metric: 'Net Profit', Value: data.summary.netProfit }];
    } else if (tab === 'customers' && data?.top) {
      rows = data.top.map((c) => ({ Name: c.name, Phone: c.phone, Spent: c.totalSpent, Orders: c.totalOrders }));
    }
    downloadCSV(rows, filename);
    toast.success('Exported');
  };

  const tabs = [
    { key: 'sales', label: 'Sales', icon: TrendingUp },
    { key: 'profit-loss', label: 'Profit & Loss', icon: DollarSign },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'customers', label: 'Customers', icon: Users },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Business insights at a glance"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Reports' }]}
        action={<button onClick={handleExport} className="btn-outline btn-sm"><Download size={16} /> Export CSV</button>}
      />

      {/* Tabs */}
      <div className="card p-1 mb-4 inline-flex gap-1 flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setData(null); }}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                tab === t.key ? 'bg-primary text-white' : 'text-muted hover:bg-bg'
              )}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Date range (sales & P&L) */}
      {(tab === 'sales' || tab === 'profit-loss') && (
        <div className="card p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Start date</label>
            <input type="date" value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} className="input" />
          </div>
          <div className="flex-1">
            <label className="label">End date</label>
            <input type="date" value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} className="input" />
          </div>
          <button onClick={() => setRange({ startDate: '', endDate: '' })} className="btn-ghost btn-sm">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Sales report */}
          {tab === 'sales' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard title="Total Sales" value={formatCurrency(data.summary?.totalSales || 0)} icon={DollarSign} color="primary" />
                <StatCard title="Orders" value={data.summary?.count || 0} icon={TrendingUp} color="secondary" />
                <StatCard title="Avg Sale" value={formatCurrency(data.summary?.avgSale || 0)} icon={BarChart3} color="warning" />
                <StatCard title="Tax Collected" value={formatCurrency(data.summary?.totalTax || 0)} icon={DollarSign} color="success" />
              </div>
              <Card>
                <div className="p-5 border-b border-line"><h3 className="font-semibold text-ink">Daily Sales</h3></div>
                <CardBody>
                  {data.data?.length === 0 ? <EmptyState icon={BarChart3} title="No data" /> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                        <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="totalSales" fill="#2563EB" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {/* Profit & Loss */}
          {tab === 'profit-loss' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard title="Revenue" value={formatCurrency(data.summary?.revenue || 0)} icon={DollarSign} color="primary" />
                <StatCard title="Gross Profit" value={formatCurrency(data.summary?.grossProfit || 0)} icon={TrendingUp} color="success" />
                <StatCard title="Total Expenses" value={formatCurrency(data.summary?.totalExpenses || 0)} icon={DollarSign} color="warning" />
                <StatCard title="Net Profit" value={formatCurrency(data.summary?.netProfit || 0)} icon={TrendingUp} color={data.summary?.netProfit >= 0 ? 'success' : 'danger'} />
              </div>
              <Card>
                <div className="p-5 border-b border-line"><h3 className="font-semibold text-ink">Expenses Breakdown</h3></div>
                <CardBody>
                  {Object.keys(data.expensesByCategory || {}).length === 0 ? <EmptyState icon={FileBarChart} title="No expenses in this period" /> : (
                    <div className="space-y-2">
                      {Object.entries(data.expensesByCategory).map(([cat, amt]) => (
                        <div key={cat} className="flex items-center justify-between p-3 bg-bg rounded-lg">
                          <span className="capitalize text-sm font-medium">{cat}</span>
                          <span className="font-semibold text-danger">{formatCurrency(amt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {/* Inventory report */}
          {tab === 'inventory' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard title="Total Items" value={data.summary?.totalItems || 0} icon={Package} color="primary" />
                <StatCard title="Stock Value" value={formatCurrency(data.summary?.totalStockValue || 0)} icon={DollarSign} color="success" />
                <StatCard title="Low Stock" value={data.summary?.lowStockCount || 0} icon={Package} color="warning" />
                <StatCard title="Expired" value={data.summary?.expiredCount || 0} icon={Package} color="danger" />
              </div>
              <Card>
                <div className="p-5 border-b border-line"><h3 className="font-semibold text-ink">Low Stock Items</h3></div>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>Medicine</th><th className="text-right">Stock</th><th className="text-right">Reorder Level</th><th className="text-right">Value</th></tr></thead>
                    <tbody>
                      {(data.lowStock || []).map((m) => (
                        <tr key={m._id}><td className="font-medium">{m.name}</td><td className="text-right text-warning">{m.stock}</td><td className="text-right">{m.reorderLevel}</td><td className="text-right">{formatCurrency(m.costPrice * m.stock)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Customers report */}
          {tab === 'customers' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard title="Total Customers" value={data.summary?.totalCustomers || 0} icon={Users} color="primary" />
                <StatCard title="Total Spent" value={formatCurrency(data.summary?.totalSpent || 0)} icon={DollarSign} color="success" />
                <StatCard title="Total Orders" value={data.summary?.totalOrders || 0} icon={TrendingUp} color="warning" />
              </div>
              <Card>
                <div className="p-5 border-b border-line"><h3 className="font-semibold text-ink">Top Customers</h3></div>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>Customer</th><th>Phone</th><th className="text-right">Orders</th><th className="text-right">Total Spent</th></tr></thead>
                    <tbody>
                      {(data.top || []).map((c) => (
                        <tr key={c._id}><td className="font-medium">{c.name}</td><td>{c.phone}</td><td className="text-right">{c.totalOrders}</td><td className="text-right font-semibold">{formatCurrency(c.totalSpent)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

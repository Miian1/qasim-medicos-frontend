import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, Package, Users, AlertTriangle, CalendarClock,
  DollarSign, Activity, ArrowUpRight, Plus, Pill,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { PageHeader, StatCard, StatusBadge } from '../components/ui/PageHeader.jsx';
import { SkeletonCard } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { dashboardAPI } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import { formatCurrency, formatRelativeTime, formatDate, classNames } from '../utils/format.js';

const COLORS = ['#2563EB', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#22C55E', '#06B6D4'];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [chartRange, setChartRange] = useState(7);

  useEffect(() => {
    Promise.all([
      dashboardAPI.overview(),
      dashboardAPI.salesChart(chartRange),
      dashboardAPI.topProducts(5, 30),
      dashboardAPI.categorySales(30),
    ])
      .then(([ov, chart, top, cat]) => {
        setData(ov.data);
        setChartData(chart.data.chart || []);
        setTopProducts(top.data.products || []);
        setCategorySales(cat.data.categories || []);
      })
      .finally(() => setLoading(false));
  }, [chartRange]);

  return (
    <DashboardLayout>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={formatDate(new Date(), 'long')}
        action={
          <Link to="/pos" className="btn-primary btn-sm hidden sm:inline-flex">
            <Plus size={16} /> New Sale
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Today's Sales"
              value={formatCurrency(data?.stats?.todaySales?.total || 0)}
              subtitle={`${data?.stats?.todaySales?.count || 0} orders`}
              icon={DollarSign}
              color="primary"
              trend="up"
              trendValue="12%"
            />
            <StatCard
              title="Today's Profit"
              value={formatCurrency(data?.stats?.todayProfit || 0)}
              subtitle="After COGS & expenses"
              icon={TrendingUp}
              color="success"
            />
            <StatCard
              title="Total Medicines"
              value={data?.stats?.totalMedicines || 0}
              subtitle="Active items"
              icon={Pill}
              color="secondary"
            />
            <StatCard
              title="Total Customers"
              value={data?.stats?.totalCustomers || 0}
              subtitle={`${data?.stats?.totalSalesCount || 0} total sales`}
              icon={Users}
              color="warning"
            />
          </>
        )}
      </div>

      {!loading && (data?.stats?.lowStockCount > 0 || data?.stats?.expiringSoonCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {data.stats.lowStockCount > 0 && (
            <Link to="/inventory?filter=low-stock" className="card p-4 flex items-center gap-3 hover:shadow-soft transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink">{data.stats.lowStockCount} items low on stock</p>
                <p className="text-xs text-muted">Tap to review and reorder</p>
              </div>
              <ArrowUpRight size={18} className="text-muted" />
            </Link>
          )}
          {data.stats.expiringSoonCount > 0 && (
            <Link to="/inventory?filter=expiring-soon" className="card p-4 flex items-center gap-3 hover:shadow-soft transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                <CalendarClock size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink">{data.stats.expiringSoonCount} items expiring soon</p>
                <p className="text-xs text-muted">Within 30 days — review now</p>
              </div>
              <ArrowUpRight size={18} className="text-muted" />
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-line">
            <div>
              <h3 className="font-semibold text-ink">Sales Trend</h3>
              <p className="text-sm text-muted">Revenue over time</p>
            </div>
            <div className="flex gap-1 bg-bg rounded-md p-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setChartRange(d)}
                  className={classNames(
                    'px-3 py-1 text-xs rounded-md transition-colors',
                    chartRange === d ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            {chartData.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No sales data yet" message="Sales will appear here once you make your first sale." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(value) => [formatCurrency(value), 'Sales']}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-line">
            <h3 className="font-semibold text-ink">Sales by Category</h3>
            <p className="text-sm text-muted">Last 30 days</p>
          </div>
          <div className="p-5">
            {categorySales.length === 0 ? (
              <EmptyState icon={Package} title="No data" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {categorySales.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-line">
            <div>
              <h3 className="font-semibold text-ink">Top Products</h3>
              <p className="text-sm text-muted">Best sellers (30 days)</p>
            </div>
            <Link to="/reports" className="text-sm text-primary hover:underline">View report</Link>
          </div>
          <div className="p-5">
            {topProducts.length === 0 ? (
              <EmptyState icon={Pill} title="No sales yet" />
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                      <p className="text-xs text-muted">{p.totalSold} units sold</p>
                    </div>
                    <p className="text-sm font-semibold text-ink">{formatCurrency(p.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-line">
            <div>
              <h3 className="font-semibold text-ink">Recent Activity</h3>
              <p className="text-sm text-muted">Latest events</p>
            </div>
            <Activity size={18} className="text-muted" />
          </div>
          <div className="p-5">
            {!data?.recentActivities || data.recentActivities.length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet" />
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.recentActivities.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink">{a.description}</p>
                      <p className="text-xs text-muted">{a.userName} • {formatRelativeTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <div>
            <h3 className="font-semibold text-ink">Recent Sales</h3>
            <p className="text-sm text-muted">Latest transactions</p>
          </div>
          <Link to="/sales" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th className="text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {!data?.recentSales || data.recentSales.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted">No sales yet</td></tr>
              ) : (
                data.recentSales.map((s) => (
                  <tr key={s._id}>
                    <td className="font-medium">
                      <Link to={`/sales/${s._id}`} className="text-primary hover:underline">{s.invoiceNumber}</Link>
                    </td>
                    <td>{s.customerName}</td>
                    <td className="text-right font-medium">{formatCurrency(s.total)}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-right text-muted text-xs">{formatRelativeTime(s.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

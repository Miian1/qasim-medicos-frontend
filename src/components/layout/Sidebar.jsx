import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Pill, Tags, Truck,
  Receipt, FileText, BarChart3, Settings, UserCog, LogOut, X, HeartPulse,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.js';
import { classNames } from '../../utils/format.js';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'manager', 'cashier'], resource: 'dashboard' },
  { to: '/pos', label: 'POS / New Sale', icon: ShoppingCart, roles: ['owner', 'cashier'], resource: 'pos' },
  { to: '/medicines', label: 'Medicines', icon: Pill, roles: ['owner', 'manager', 'cashier'], resource: 'medicines' },
  { to: '/categories', label: 'Categories', icon: Tags, roles: ['owner', 'manager'], resource: 'categories' },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['owner', 'manager'], resource: 'suppliers' },
  { to: '/inventory', label: 'Inventory', icon: Package, roles: ['owner', 'manager'], resource: 'inventory' },
  { to: '/purchases', label: 'Purchases', icon: Receipt, roles: ['owner', 'manager'], resource: 'purchases' },
  { to: '/sales', label: 'Sales', icon: FileText, roles: ['owner', 'manager', 'cashier'], resource: 'sales' },
  { to: '/customers', label: 'Customers', icon: Users, roles: ['owner', 'manager', 'cashier'], resource: 'customers' },
  { to: '/expenses', label: 'Expenses', icon: Receipt, roles: ['owner', 'manager'], resource: 'expenses' },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['owner', 'manager'], resource: 'reports' },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['owner'], resource: 'users' },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['owner', 'manager'], resource: 'settings' },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { user, logout, can } = useAuthStore();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role) || user?.role === 'owner');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={classNames(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-card border-r border-line flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
              <HeartPulse size={20} />
            </div>
            <div>
              <h1 className="font-bold text-ink leading-tight">Qasim Medicos</h1>
              <p className="text-[10px] text-muted uppercase tracking-wider">Pharmacy SaaS</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-md hover:bg-bg">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 no-scrollbar">
          <p className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wider">Menu</p>
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const allowed = user?.role === 'owner' || can(item.resource, 'view');
              if (!allowed) return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted hover:bg-bg hover:text-ink'
                    )
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-line">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
              <p className="text-xs text-muted capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-danger/10 hover:text-danger text-muted"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

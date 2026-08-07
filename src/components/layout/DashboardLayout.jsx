import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import BottomNav from './BottomNav.jsx';
import { Modal } from '../ui/Modal.jsx';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Tags, Truck, Package, Receipt, BarChart3, UserCog, Settings, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.js';
import { classNames } from '../../utils/format.js';

const MORE_ITEMS = [
  { to: '/categories', label: 'Categories', icon: Tags, roles: ['owner', 'manager'] },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['owner', 'manager'] },
  { to: '/inventory', label: 'Inventory', icon: Package, roles: ['owner', 'manager'] },
  { to: '/purchases', label: 'Purchases', icon: Receipt, roles: ['owner', 'manager'] },
  { to: '/expenses', label: 'Expenses', icon: Receipt, roles: ['owner', 'manager'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['owner', 'manager'] },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['owner'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['owner', 'manager'] },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav onMoreClick={() => setMoreOpen(true)} />

      {/* More menu modal (mobile) */}
      <Modal isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="More" size="sm">
        <div className="grid grid-cols-2 gap-2">
          {MORE_ITEMS.filter((i) => i.roles.includes(user?.role) || user?.role === 'owner').map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  classNames(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border',
                    isActive ? 'bg-primary/10 border-primary text-primary' : 'bg-bg border-line text-ink hover:bg-bg/70'
                  )
                }
              >
                <Icon size={22} />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

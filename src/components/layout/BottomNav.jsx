import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Pill, ShoppingCart, Users, Menu as MenuIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.js';
import { classNames } from '../../utils/format.js';

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['owner', 'manager', 'cashier'] },
  { to: '/medicines', label: 'Medicines', icon: Pill, roles: ['owner', 'manager', 'cashier'] },
  { to: '/pos', label: 'New Sale', icon: ShoppingCart, roles: ['owner', 'cashier'], highlight: true },
  { to: '/sales', label: 'Sales', icon: ShoppingCart, roles: ['owner', 'manager', 'cashier'] },
  { to: '/customers', label: 'Customers', icon: Users, roles: ['owner', 'manager', 'cashier'] },
];

export default function BottomNav({ onMoreClick }) {
  const { user } = useAuthStore();
  const items = ITEMS.filter((i) => i.roles.includes(user?.role) || user?.role === 'owner');

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-line safe-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.highlight) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-pop">
                  <Icon size={22} />
                </div>
                <span className="text-[10px] mt-1 text-primary font-medium">{item.label}</span>
              </NavLink>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                classNames(
                  'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg flex-1',
                  isActive ? 'text-primary' : 'text-muted'
                )
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg flex-1 text-muted"
        >
          <MenuIcon size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}

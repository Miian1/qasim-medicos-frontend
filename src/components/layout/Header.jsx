import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Sun, Moon, ChevronDown, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.js';
import { dashboardAPI } from '../../api/index.js';
import { formatRelativeTime, classNames } from '../../utils/format.js';

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    dashboardAPI.notifications().then((res) => {
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await dashboardAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-card border-b border-line h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-bg"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="hidden sm:flex relative max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search medicines, customers, invoices..."
            className="input pl-10 py-2 text-sm"
            onFocus={() => navigate('/medicines')}
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((s) => !s)}
            className="relative p-2 rounded-md hover:bg-bg"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card rounded-lg shadow-pop border border-line overflow-hidden animate-slide-down">
              <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <h3 className="font-semibold text-ink">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      className={classNames(
                        'px-4 py-3 border-b border-line hover:bg-bg cursor-pointer',
                        !n.isRead && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={classNames(
                          'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                          n.severity === 'danger' ? 'bg-danger' : n.severity === 'warning' ? 'bg-warning' : 'bg-primary'
                        )} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{n.title}</p>
                          <p className="text-xs text-muted mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted mt-1">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen((s) => !s)}
            className="flex items-center gap-2 p-1.5 pr-2 rounded-md hover:bg-bg"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-ink leading-tight">{user?.name}</p>
              <p className="text-xs text-muted capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={16} className="text-muted hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-pop border border-line overflow-hidden animate-slide-down">
              <div className="px-4 py-3 border-b border-line">
                <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-bg"
                >
                  <User size={16} /> My Profile
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-bg"
                >
                  <SettingsIcon size={16} /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

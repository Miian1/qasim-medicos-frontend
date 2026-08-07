import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../api/index.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (email, password) => {
        set({ loading: true });
        try {
          const res = await authAPI.login(email, password);
          const { user, token } = res.data;
          localStorage.setItem('qm_token', token);
          localStorage.setItem('qm_user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true, user };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.message };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch {
          // ignore
        }
        localStorage.removeItem('qm_token');
        localStorage.removeItem('qm_user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const res = await authAPI.getMe();
          set({ user: res.data.user });
          localStorage.setItem('qm_user', JSON.stringify(res.data.user));
          return res.data.user;
        } catch {
          get().logout();
          return null;
        }
      },

      updateProfile: async (data) => {
        const res = await authAPI.updateProfile(data);
        set({ user: res.data.user });
        localStorage.setItem('qm_user', JSON.stringify(res.data.user));
        return res.data.user;
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      can: (resource, action = 'view') => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'owner') return true;
        // Simple client-side mirror of backend permission matrix
        const perms = {
          manager: {
            dashboard: ['view'], medicines: ['view', 'create', 'update', 'delete'],
            categories: ['view', 'create', 'update', 'delete'],
            suppliers: ['view', 'create', 'update', 'delete'],
            purchases: ['view', 'create', 'update'],
            inventory: ['view', 'update'], reports: ['view', 'export'],
            expenses: ['view', 'create', 'update', 'delete'],
            customers: ['view', 'create', 'update'], settings: ['view'],
          },
          cashier: {
            dashboard: ['view'], pos: ['use'], sales: ['view', 'create'],
            customers: ['view', 'create', 'update'],
            invoices: ['view', 'create'], medicines: ['view'],
          },
        };
        const actions = perms[user.role]?.[resource];
        if (!actions) return false;
        return actions.includes(action);
      },
    }),
    {
      name: 'qm-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

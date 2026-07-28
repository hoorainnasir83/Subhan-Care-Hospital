import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const json = await res.json();
          if (json.success) {
            set({ user: json.user, token: json.token, isLoading: false });
            return { success: true };
          }
          set({ error: json.error, isLoading: false });
          return { success: false, error: json.error };
        } catch (err) {
          set({ error: 'Cannot connect to server', isLoading: false });
          return { success: false, error: 'Cannot connect to server' };
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      getAuthHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${get().token}`
      }),

      checkSession: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success) {
            set({ user: json.user });
          } else {
            set({ user: null, token: null });
          }
        } catch (err) {
          set({ user: null, token: null });
        }
      },

      canWrite: (page) => {
        const WRITE_ACCESS = {
          Admin:        ['patients', 'doctors', 'appointments', 'billing'],
          Doctor:       [],
          Receptionist: ['patients', 'appointments'],
          Billing:      ['billing'],
          Staff:        ['patients', 'doctors', 'appointments', 'billing'],
        };
        const role = get().user?.role || 'Staff';
        return (WRITE_ACCESS[role] || WRITE_ACCESS.Staff).includes(page);
      }
    }),
    {
      name: 'hms-auth',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);

export default useAuthStore;
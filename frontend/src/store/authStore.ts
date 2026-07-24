import { create } from 'zustand';
import { User } from '@/types';
import { api, apiErrorMessage } from '@/lib/api';
import { useThemeStore } from '@/store/themeStore';

/** Only adopt the account's saved theme if this browser has no local choice yet — avoids clobbering a preference the user just set on this device. */
function adoptAccountTheme(user: User) {
  if (!localStorage.getItem('em_theme')) {
    useThemeStore.getState().setTheme(user.theme, { sync: false });
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  hydrate: () => {
    const token = sessionStorage.getItem('em_token');
    const userRaw = sessionStorage.getItem('em_user');
    if (token && userRaw) {
      const user = JSON.parse(userRaw);
      adoptAccountTheme(user);
      set({ token, user });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth.php?action=login', { email, password });
      sessionStorage.setItem('em_token', data.token);
      sessionStorage.setItem('em_user', JSON.stringify(data.user));
      adoptAccountTheme(data.user);
      set({ user: data.user, token: data.token, loading: false });
    } catch (err) {
      set({ loading: false, error: apiErrorMessage(err, 'Could not log in.') });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth.php?action=register', { name, email, password });
      sessionStorage.setItem('em_token', data.token);
      sessionStorage.setItem('em_user', JSON.stringify(data.user));
      adoptAccountTheme(data.user);
      set({ user: data.user, token: data.token, loading: false });
    } catch (err) {
      set({ loading: false, error: apiErrorMessage(err, 'Could not create account.') });
      throw err;
    }
  },

  logout: () => {
    sessionStorage.removeItem('em_token');
    sessionStorage.removeItem('em_user');
    set({ user: null, token: null });
  },
}));

import { create } from 'zustand';
import { api } from '@/lib/api';
import { Account, Category, ExpenseGroup } from '@/types';

interface AppState {
  accounts: Account[];
  categories: Category[];
  groups: ExpenseGroup[];
  refreshAccounts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshAll: () => Promise<void>;
  /** Returns the id of the category matching name+type, creating it first if the user doesn't have it yet. */
  ensureCategory: (name: string, type: 'income' | 'expense', icon: string, color: string) => Promise<number>;
}

export const useAppStore = create<AppState>((set, get) => ({
  accounts: [],
  categories: [],
  groups: [],

  refreshAccounts: async () => {
    try {
      const { data } = await api.get('/accounts.php');
      set({ accounts: data.accounts ?? [] });
    } catch {
      set({ accounts: [] });
    }
  },
  refreshCategories: async () => {
    try {
      const { data } = await api.get('/categories.php');
      set({ categories: data.categories ?? [] });
    } catch {
      set({ categories: [] });
    }
  },
  refreshGroups: async () => {
    try {
      const { data } = await api.get('/groups.php');
      set({ groups: data.groups ?? [] });
    } catch {
      set({ groups: [] });
    }
  },
  refreshAll: async () => {
    await Promise.all([get().refreshAccounts(), get().refreshCategories(), get().refreshGroups()]);
  },
  ensureCategory: async (name, type, icon, color) => {
    const findLocal = () => get().categories.find((c) => c.type === type && c.name.toLowerCase() === name.toLowerCase());
    const existing = findLocal();
    if (existing) return existing.id;
    try {
      const { data } = await api.post('/categories.php', { name, type, icon, color });
      await get().refreshCategories();
      return data.id as number;
    } catch (err) {
      // The local list can be stale/not-yet-loaded on a fresh navigation, causing a false
      // "doesn't exist" read; the backend enforces uniqueness so a failed create almost always
      // means it already exists elsewhere — refresh and look again before giving up.
      await get().refreshCategories();
      const match = findLocal();
      if (match) return match.id;
      throw err;
    }
  },
}));

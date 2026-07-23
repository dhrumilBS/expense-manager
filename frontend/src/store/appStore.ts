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
}

export const useAppStore = create<AppState>((set, get) => ({
  accounts: [],
  categories: [],
  groups: [],

  refreshAccounts: async () => {
    const { data } = await api.get('/accounts.php');
    set({ accounts: data.accounts });
  },
  refreshCategories: async () => {
    const { data } = await api.get('/categories.php');
    set({ categories: data.categories });
  },
  refreshGroups: async () => {
    const { data } = await api.get('/groups.php');
    set({ groups: data.groups });
  },
  refreshAll: async () => {
    await Promise.all([get().refreshAccounts(), get().refreshCategories(), get().refreshGroups()]);
  },
}));

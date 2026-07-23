export type TxnType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'bank' | 'credit_card' | 'wallet' | 'upi' | 'other';

export interface User {
  id: number;
  name: string;
  email: string;
  currency: string;
  theme: 'light' | 'dark';
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  opening_balance: string | number;
  current_balance: string | number;
  color: string;
  is_archived: number;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface ExpenseGroup {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_default: number;
}

export interface Transaction {
  id: number;
  type: TxnType;
  amount: string | number;
  expense_group_id: number | null;
  category_id: number | null;
  account_id: number | null;
  to_account_id: number | null;
  payment_method: string | null;
  txn_date: string;
  description: string | null;
  notes: string | null;
  receipt_path: string | null;
  tags: string | null;
  category_name?: string;
  category_color?: string;
  group_name?: string;
  group_color?: string;
  account_name?: string;
  to_account_name?: string;
}

export interface Budget {
  id: number;
  category_id: number | null;
  expense_group_id: number | null;
  amount: string | number;
  period_month: number;
  period_year: number;
  category_name?: string;
  category_color?: string;
  group_name?: string;
  spent?: number;
}

export interface DashboardData {
  current_balance: number;
  total_income: number;
  total_expense: number;
  savings: number;
  overall_budget: number | null;
  recent_transactions: Transaction[];
  top_categories: { name: string; color: string; total: number }[];
  spending_by_group: { name: string; color: string; total: number }[];
  income_vs_expense_trend: { month: string; income: number; expense: number }[];
  upcoming_bills: unknown[];
}

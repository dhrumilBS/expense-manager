export interface QuickBillDef {
  key: string;
  label: string;
  categoryName: string;
  icon: string;
  color: string;
  group: 'daily' | 'bill';
}

export const QUICK_BILLS: QuickBillDef[] = [
  // Daily spends — logged most often, one tap away
  { key: 'food', label: 'Food', categoryName: 'Food', icon: 'Utensils', color: '#B33A3A', group: 'daily' },
  { key: 'grocery', label: 'Grocery', categoryName: 'Grocery', icon: 'ShoppingCart', color: '#B3541E', group: 'daily' },
  { key: 'fuel', label: 'Fuel', categoryName: 'Fuel', icon: 'Fuel', color: '#8A5A00', group: 'daily' },
  { key: 'shopping', label: 'Shopping', categoryName: 'Shopping', icon: 'ShoppingBag', color: '#B3387A', group: 'daily' },

  // Recurring bills
  { key: 'electricity', label: 'Electricity', categoryName: 'Electricity', icon: 'Zap', color: '#C08A00', group: 'bill' },
  { key: 'gas', label: 'Gas', categoryName: 'Gas', icon: 'Flame', color: '#B3541E', group: 'bill' },
  { key: 'water', label: 'Water', categoryName: 'Water', icon: 'Droplet', color: '#3B5BA9', group: 'bill' },
  { key: 'mobile', label: 'Mobile', categoryName: 'Mobile Recharge', icon: 'Smartphone', color: '#3B5BA9', group: 'bill' },
  { key: 'internet', label: 'Internet', categoryName: 'Internet', icon: 'Wifi', color: '#3B5BA9', group: 'bill' },
  { key: 'dth', label: 'DTH/Cable', categoryName: 'DTH/Cable', icon: 'Tv', color: '#7A3FB3', group: 'bill' },
  { key: 'rent', label: 'Rent', categoryName: 'Rent', icon: 'Home', color: '#6D4AFF', group: 'bill' },
  { key: 'emi', label: 'EMI', categoryName: 'EMI', icon: 'CreditCard', color: '#946200', group: 'bill' },
  { key: 'insurance', label: 'Insurance', categoryName: 'Insurance', icon: 'ShieldCheck', color: '#2E7D5B', group: 'bill' },
];

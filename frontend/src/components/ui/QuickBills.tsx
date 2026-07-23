import {
  Zap, Flame, Smartphone, CreditCard, Utensils, ShoppingCart, Fuel,
  ShoppingBag, Droplet, Wifi, Tv, Home, ShieldCheck,
} from 'lucide-react';
import { QuickBillDef } from '@/lib/quickBills';

const ICONS: Record<string, typeof Zap> = {
  food: Utensils, grocery: ShoppingCart, fuel: Fuel, shopping: ShoppingBag,
  electricity: Zap, gas: Flame, water: Droplet, mobile: Smartphone,
  internet: Wifi, dth: Tv, rent: Home, emi: CreditCard, insurance: ShieldCheck,
};

export default function QuickBills({ bills, onSelect }: { bills: QuickBillDef[]; onSelect: (bill: QuickBillDef) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {bills.map((b) => {
        const Icon = ICONS[b.key];
        return (
          <button
            key={b.key}
            type="button"
            onClick={() => onSelect(b)}
            className="flex items-center gap-2 shrink-0 px-3.5 py-2.5 rounded-xl border border-line bg-surface text-sm font-medium hover:bg-ink/5 active:scale-95 transition-transform"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: b.color + '1A', color: b.color }}>
              <Icon size={15} />
            </span>
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

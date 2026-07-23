import { useAuthStore } from '@/store/authStore';
import { LogOut, User, CircleDollarSign, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROADMAP = [
  'Recurring Transactions', 'Subscription Tracker', 'EMI Tracker', 'Loan Tracker',
  'Savings Goals', 'Split Expenses', 'Bill Reminders', 'OCR Receipt Scanner',
  'Dark Mode', 'Multi-Currency', 'Cloud Backup', 'PWA Support', 'Multi-User Support',
];

export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Your profile and what's coming next.</p>
      </div>

      <div className="card">
        <h3 className="font-medium mb-4 flex items-center gap-2"><User size={17} /> Profile</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Name</label><input className="input" value={user?.name ?? ''} disabled /></div>
          <div><label className="label">Email</label><input className="input" value={user?.email ?? ''} disabled /></div>
        </div>
        <p className="text-xs text-muted mt-3">Profile editing is coming soon — for now, changes can be made directly in the database if needed.</p>
      </div>

      <div className="card">
        <h3 className="font-medium mb-4 flex items-center gap-2"><CircleDollarSign size={17} /> Currency</h3>
        <select className="input max-w-xs" defaultValue={user?.currency ?? 'INR'} disabled>
          <option value="INR">₹ Indian Rupee (INR)</option>
          <option value="USD">$ US Dollar (USD)</option>
          <option value="EUR">€ Euro (EUR)</option>
          <option value="GBP">£ British Pound (GBP)</option>
        </select>
        <p className="text-xs text-muted mt-2">Multi-currency support is on the roadmap below.</p>
      </div>

      <div className="card">
        <h3 className="font-medium mb-3 flex items-center gap-2"><Sparkles size={17} /> Coming Soon</h3>
        <div className="flex flex-wrap gap-2">
          {ROADMAP.map((r) => (
            <span key={r} className="text-xs px-3 py-1.5 rounded-full bg-ink/5 text-muted">{r}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger w-full">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}

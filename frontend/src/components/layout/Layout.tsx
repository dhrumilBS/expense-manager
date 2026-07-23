import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, FolderKanban,
  Tags, Wallet, PiggyBank, FileBarChart, BarChart3, Settings, LogOut, Receipt,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import clsx from 'clsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/groups', label: 'Expense Groups', icon: FolderKanban },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed z-30 inset-y-0 left-0 w-64 bg-surface border-r border-line transform transition-transform lg:translate-x-0 lg:static',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="h-16 flex items-center gap-2 px-5 border-b border-line">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-display font-semibold">₹</div>
          <span className="font-display text-lg font-semibold tracking-tight">Ledger</span>
        </div>
        <nav className="p-3 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem - 4rem)' }}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                isActive ? 'bg-brand/10 text-brand' : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-line">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-lg hover:bg-expense/10 text-muted hover:text-expense transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="h-16 flex items-center gap-3 px-4 lg:px-8 border-b border-line bg-surface/70 backdrop-blur sticky top-0 z-10">
          <button className="lg:hidden btn-ghost p-2" onClick={() => setMobileOpen(true)}>☰</button>
          <div className="flex-1" />
        </header>
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

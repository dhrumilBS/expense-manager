import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, FolderKanban, Plus,
  Tags, Wallet, PiggyBank, FileBarChart, BarChart3, Settings, LogOut, Receipt, Menu,
  Sun, Moon, Calculator,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useState } from 'react';
import clsx from 'clsx';
import MiniCalculator from '@/components/ui/MiniCalculator';

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

const TAB_BAR = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Txns', icon: Receipt },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar — always visible on desktop, off-canvas "More" panel on mobile */}
      <aside className={clsx(
        'fixed z-30 inset-y-0 left-0 w-64 h-dvh flex flex-col bg-surface border-r border-line transform transition-transform lg:translate-x-0 lg:static',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="h-16 shrink-0 flex items-center gap-2 px-5 border-b border-line">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-display font-semibold">₹</div>
          <span className="font-display text-lg font-semibold tracking-tight">Ledger</span>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-0.5">
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
        <div className="relative shrink-0 p-3 border-t border-line">
          {calcOpen && <MiniCalculator onClose={() => setCalcOpen(false)} />}
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => setCalcOpen((v) => !v)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                calcOpen ? 'bg-brand/10 text-brand' : 'hover:bg-ink/5 text-muted hover:text-ink'
              )}
              title="Quick calculator"
            >
              <Calculator size={16} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-ink/5 text-muted hover:text-ink transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
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
        <main className="p-4 pb-24 lg:p-8 lg:pb-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="fixed inset-x-0 bottom-0 z-30 lg:hidden bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-center h-16">
          {TAB_BAR.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => clsx(
                'flex flex-col items-center justify-center gap-0.5 h-full text-[11px] font-medium',
                isActive ? 'text-brand' : 'text-muted'
              )}
            >
              <Icon size={20} strokeWidth={2} />
              {label}
            </NavLink>
          ))}

          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => navigate('/transactions', { state: { openAdd: 'expense' } })}
              className="w-12 h-12 -mt-6 rounded-full bg-brand text-white shadow-soft flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Add transaction"
            >
              <Plus size={24} />
            </button>
          </div>

          <NavLink
            to="/accounts"
            className={({ isActive }) => clsx(
              'flex flex-col items-center justify-center gap-0.5 h-full text-[11px] font-medium',
              isActive ? 'text-brand' : 'text-muted'
            )}
          >
            <Wallet size={20} strokeWidth={2} />
            Accounts
          </NavLink>

          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 h-full text-[11px] font-medium text-muted"
          >
            <Menu size={20} strokeWidth={2} />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}

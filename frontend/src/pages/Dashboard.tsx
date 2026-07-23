import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { DashboardData } from '@/types';
import { formatMoney, formatDate } from '@/lib/format';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import QuickBills from '@/components/ui/QuickBills';
import { QUICK_BILLS, QuickBillDef } from '@/lib/quickBills';

const TYPE_ICON = { income: ArrowUpCircle, expense: ArrowDownCircle, transfer: ArrowLeftRight };
const TYPE_CLASS = { income: 'amount-income', expense: 'amount-expense', transfer: 'amount-transfer' };
const TYPE_BG = { income: 'bg-income/10', expense: 'bg-expense/10', transfer: 'bg-transfer/10' };
const TYPE_TEXT = { income: 'text-income', expense: 'text-expense', transfer: 'text-transfer' };

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleQuickBill = (bill: QuickBillDef) => {
    navigate('/transactions', { state: { openAdd: 'expense', billKey: bill.key } });
  };

  useEffect(() => {
    api.get('/dashboard.php')
      .then((res) => setData({
        ...res.data,
        top_categories: res.data.top_categories ?? [],
        spending_by_group: res.data.spending_by_group ?? [],
        income_vs_expense_trend: res.data.income_vs_expense_trend ?? [],
        recent_transactions: res.data.recent_transactions ?? [],
        upcoming_bills: res.data.upcoming_bills ?? [],
      }))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (!data) return <p className="text-muted">Could not load dashboard data.</p>;

  const budgetPct = data.overall_budget ? Math.min(100, (data.total_expense / data.overall_budget) * 100) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Here's where your money stands this month.</p>
      </div>

      {/* Quick add */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted mb-2">Daily</p>
          <QuickBills bills={QUICK_BILLS.filter((b) => b.group === 'daily')} onSelect={handleQuickBill} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted mb-2">Bill Pay</p>
          <QuickBills bills={QUICK_BILLS.filter((b) => b.group === 'bill')} onSelect={handleQuickBill} />
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Current Balance" value={data.current_balance} accent="text-brand" />
        <StatCard icon={TrendingUp} label="Total Income" value={data.total_income} accent="text-income" />
        <StatCard icon={TrendingDown} label="Total Expense" value={data.total_expense} accent="text-expense" />
        <StatCard icon={PiggyBank} label="Savings" value={data.savings} accent={data.savings >= 0 ? 'text-income' : 'text-expense'} />
      </div>

      {/* Budget progress */}
      {data.overall_budget !== null && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Monthly Budget Progress</h3>
            <span className="text-sm text-muted amount">
              {formatMoney(data.total_expense)} / {formatMoney(data.overall_budget)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-ink/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetPct! > 90 ? 'bg-expense' : 'bg-brand'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Income vs Expense trend */}
        <div className="card lg:col-span-2">
          <h3 className="font-medium mb-4">Income vs Expense (6 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.income_vs_expense_trend}>
              <defs>
                <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B8457" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0B8457" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B33A3A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#B33A3A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E0', fontSize: 13 }} />
              <Area type="monotone" dataKey="income" stroke="#0B8457" fill="url(#inc)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#B33A3A" fill="url(#exp)" strokeWidth={2} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top categories */}
        <div className="card">
          <h3 className="font-medium mb-4">Top Categories</h3>
          {data.top_categories.length === 0 ? (
            <EmptyHint text="No expenses logged yet this month." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.top_categories} dataKey="total" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {data.top_categories.map((c, i) => <Cell key={i} fill={c.color || '#6B7280'} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-2">
            {data.top_categories.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.name}</span>
                <span className="amount amount-expense">{formatMoney(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending by group */}
        <div className="card">
          <h3 className="font-medium mb-4">Spending by Expense Group</h3>
          {data.spending_by_group.length === 0 ? (
            <EmptyHint text="Assign a group to your expenses to see this breakdown." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.spending_by_group} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E7E5E0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#12181B' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {data.spending_by_group.map((g, i) => <Cell key={i} fill={g.color || '#6B7280'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card">
          <h3 className="font-medium mb-4">Recent Transactions</h3>
          {data.recent_transactions.length === 0 ? (
            <EmptyHint text="Your recent income, expenses, and transfers will show up here." />
          ) : (
            <div className="divide-y divide-line">
              {data.recent_transactions.map((t) => {
                const Icon = TYPE_ICON[t.type];
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TYPE_BG[t.type]}`}>
                      <Icon size={16} className={TYPE_TEXT[t.type]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description || t.category_name || t.type}</p>
                      <p className="text-xs text-muted">{formatDate(t.txn_date)} · {t.account_name}{t.to_account_name ? ` → ${t.to_account_name}` : ''}</p>
                    </div>
                    <span className={`amount text-sm ${TYPE_CLASS[t.type]}`}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}{formatMoney(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming bills placeholder */}
      <div className="card">
        <h3 className="font-medium mb-1">Upcoming Bills</h3>
        <p className="text-sm text-muted">Recurring bills & reminders are coming in a future update — track EMIs and subscriptions manually via Categories for now.</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted">{label}</span>
        <Icon size={18} className={accent} />
      </div>
      <p className={`amount text-xl font-semibold ${accent}`}>{formatMoney(value)}</p>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted py-8 text-center">{text}</p>;
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-ink/10 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-ink/5 rounded-2xl" />)}
      </div>
      <div className="h-72 bg-ink/5 rounded-2xl" />
    </div>
  );
}

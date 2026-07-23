import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const GRID = { stroke: '#E7E5E0' };
const AXIS = { fontSize: 12, fill: '#6B7280' };

export default function Analytics() {
  const year = new Date().getFullYear();
  const [trend, setTrend] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [byGroup, setByGroup] = useState<any[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [highest, setHighest] = useState<any[]>([]);
  const [yoy, setYoy] = useState<any[]>([]);

  useEffect(() => {
    api.get('/analytics.php', { params: { action: 'monthly_trend' } }).then((r) => setTrend(r.data.monthly_trend));
    api.get('/analytics.php', { params: { action: 'expense_by_category', year } }).then((r) => setByCategory(r.data.expense_by_category));
    api.get('/analytics.php', { params: { action: 'expense_by_group', year } }).then((r) => setByGroup(r.data.expense_by_group));
    api.get('/analytics.php', { params: { action: 'budget_vs_actual' } }).then((r) => setBudgetVsActual(r.data.budget_vs_actual));
    api.get('/analytics.php', { params: { action: 'spending_heatmap', year } }).then((r) => setHeatmap(r.data.spending_heatmap));
    api.get('/analytics.php', { params: { action: 'highest_expenses', limit: 8 } }).then((r) => setHighest(r.data.highest_expenses));
    api.get('/analytics.php', { params: { action: 'year_over_year', year } }).then((r) => setYoy(r.data.year_over_year));
  }, [year]);

  const maxHeat = Math.max(1, ...heatmap.map((h) => Number(h.total)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted">Deeper patterns in how money moves for you.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-medium mb-4">Monthly Trend & Cash Flow (12 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} {...GRID} />
              <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E0', fontSize: 13 }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#0B8457" strokeWidth={2} dot={false} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#B33A3A" strokeWidth={2} dot={false} name="Expense" />
              <Line type="monotone" dataKey="net" stroke="#3B5BA9" strokeWidth={2} strokeDasharray="4 3" dot={false} name="Net cash flow" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-medium mb-4">Expense by Category ({year})</h3>
          {byCategory.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byCategory} dataKey="total" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {byCategory.map((c, i) => <Cell key={i} fill={c.color || '#6B7280'} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-medium mb-4">Expense by Group ({year})</h3>
          {byGroup.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byGroup}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} {...GRID} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} width={50} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {byGroup.map((g, i) => <Cell key={i} fill={g.color || '#6B7280'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-medium mb-4">Budget vs Actual (this month)</h3>
          {budgetVsActual.length === 0 ? <EmptyState text="Set category budgets to see this comparison." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetVsActual}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} {...GRID} />
                <XAxis dataKey="category" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} width={50} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Legend />
                <Bar dataKey="budget" fill="#6B7280" radius={[6, 6, 0, 0]} name="Budget" />
                <Bar dataKey="actual" fill="#B33A3A" radius={[6, 6, 0, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-medium mb-4">Year-over-Year Expense Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={yoy}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} {...GRID} />
              <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v: number) => formatMoney(v)} />
              <Legend />
              {yoy[0] && Object.keys(yoy[0]).filter((k) => k !== 'month').map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={i === 0 ? '#6B7280' : '#B33A3A'} strokeWidth={2} dot={false} name={k} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-medium mb-4">Spending Heatmap ({year})</h3>
          {heatmap.length === 0 ? <EmptyState /> : (
            <div className="flex flex-wrap gap-1">
              {heatmap.map((h, i) => {
                const intensity = Number(h.total) / maxHeat;
                return (
                  <div key={i} title={`${formatDate(h.d)}: ${formatMoney(h.total)}`}
                    className="w-3.5 h-3.5 rounded-sm"
                    style={{ background: `rgba(179,58,58,${0.12 + intensity * 0.8})` }} />
                );
              })}
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-medium mb-4">Highest Expenses</h3>
          {highest.length === 0 ? <EmptyState /> : (
            <div className="divide-y divide-line">
              {highest.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{h.description || h.category || 'Expense'}</p>
                    <p className="text-xs text-muted">{formatDate(h.txn_date)} · {h.category}{h.expense_group ? ` · ${h.expense_group}` : ''}</p>
                  </div>
                  <span className="amount amount-expense">{formatMoney(h.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text = 'Not enough data yet for this chart.' }: { text?: string }) {
  return <p className="text-sm text-muted text-center py-10">{text}</p>;
}

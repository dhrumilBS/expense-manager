import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { api, apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import SwipeToReveal from '@/components/ui/SwipeToReveal';
import AmountInput from '@/components/ui/AmountInput';
import { Plus, Trash2 } from 'lucide-react';
import { Budget } from '@/types';
import { formatMoney } from '@/lib/format';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Budgets() {
  const { categories, groups, refreshAll } = useAppStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ scope: 'overall' as 'overall' | 'category' | 'group', category_id: '', expense_group_id: '', amount: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { refreshAll(); }, [refreshAll]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month, year]);

  const load = () => {
    setLoading(true);
    api.get('/budgets.php', { params: { month, year } })
      .then((r) => setBudgets(r.data.budgets ?? []))
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false));
  };

  const save = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Enter a budget amount greater than zero.'); return; }
    setSaving(true); setError(null);
    try {
      await api.post('/budgets.php', {
        amount,
        period_month: month,
        period_year: year,
        category_id: form.scope === 'category' ? Number(form.category_id) || null : null,
        expense_group_id: form.scope === 'group' ? Number(form.expense_group_id) || null : null,
      });
      setModalOpen(false);
      setForm({ scope: 'overall', category_id: '', expense_group_id: '', amount: '' });
      load();
    } catch (err) { setError(apiErrorMessage(err, 'Could not save budget.')); } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this budget?')) return;
    await api.delete('/budgets.php', { params: { id } });
    load();
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Budgets</h1>
          <p className="text-sm text-muted">Set monthly limits overall, per category, or per expense group.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Budget</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-muted col-span-full text-center py-10">Loading…</p>
        ) : budgets.length === 0 ? (
          <p className="text-sm text-muted col-span-full text-center py-10">No budgets set for {MONTH_NAMES[month - 1]} {year} yet.</p>
        ) : budgets.map((b) => {
          const spent = b.spent ?? 0;
          const amount = Number(b.amount);
          const pct = Math.min(100, (spent / amount) * 100);
          const over = spent > amount;
          const label = b.category_name || b.group_name || 'Overall Budget';
          return (
            <SwipeToReveal
              key={b.id}
              className="rounded-2xl"
              actions={[{ icon: <Trash2 size={16} />, label: 'Delete', onClick: () => remove(b.id), className: 'bg-expense text-white' }]}
            >
              <div className="card group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    {b.category_color && <span className="w-2 h-2 rounded-full" style={{ background: b.category_color }} />}
                    {label}
                  </span>
                  <button onClick={() => remove(b.id)} className="hidden md:group-hover:block p-2 rounded-lg hover:bg-expense/10 text-muted hover:text-expense"><Trash2 size={14} /></button>
                </div>
                <div className="h-2.5 rounded-full bg-ink/5 overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${over ? 'bg-expense' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`amount ${over ? 'text-expense' : 'text-ink'}`}>{formatMoney(spent)}</span>
                  <span className="amount text-muted">of {formatMoney(amount)}</span>
                </div>
              </div>
            </SwipeToReveal>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Budget">
        <div className="space-y-4">
          <div>
            <label className="label">Applies to</label>
            <div className="flex gap-2">
              {(['overall', 'category', 'group'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, scope: s }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize border ${form.scope === s ? 'bg-brand/10 border-brand text-brand' : 'border-line text-muted'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {form.scope === 'category' && (
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
                <option value="">Select…</option>
                {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {form.scope === 'group' && (
            <div>
              <label className="label">Expense Group</label>
              <select className="input" value={form.expense_group_id} onChange={(e) => setForm((f) => ({ ...f, expense_group_id: e.target.value }))}>
                <option value="">Select…</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Monthly Amount</label>
            <AmountInput value={form.amount} onChange={(n) => setForm((f) => ({ ...f, amount: String(n) }))} />
          </div>
          {error && <p className="text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

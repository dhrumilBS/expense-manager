import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { Transaction } from '@/types';
import { formatMoney, formatDateTime } from '@/lib/format';
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SwipeToReveal from '@/components/ui/SwipeToReveal';
import QuickBills from '@/components/ui/QuickBills';
import TransactionForm from '@/components/forms/TransactionForm';
import { QUICK_BILLS, QuickBillDef } from '@/lib/quickBills';

const TYPE_ICON = { income: ArrowUpCircle, expense: ArrowDownCircle, transfer: ArrowLeftRight };
// Literal class strings (not built dynamically) so Tailwind's scanner can see and generate them.
const TYPE_BG = { income: 'bg-income/10', expense: 'bg-expense/10', transfer: 'bg-transfer/10' };
const TYPE_TEXT = { income: 'text-income', expense: 'text-expense', transfer: 'text-transfer' };
const TYPE_AMOUNT = { income: 'amount-income', expense: 'amount-expense', transfer: 'amount-transfer' };

export default function Transactions() {
  const { accounts, categories, refreshAll, ensureCategory } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ type: '', category_id: '', account_id: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>(undefined);
  const [addType, setAddType] = useState<'income' | 'expense'>('expense');
  const [prefill, setPrefill] = useState<{ categoryId?: number; description?: string }>({});

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/transactions.php', { params })
      .then((res) => { setTxns(res.data.transactions ?? []); setTotal(res.data.total ?? 0); })
      .catch((err) => { setError(apiErrorMessage(err)); setTxns([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, filters]);

  useEffect(() => {
    const state = location.state as { openAdd?: 'income' | 'expense'; billKey?: string } | null;
    if (state?.openAdd) {
      (async () => {
        const bill = state.billKey ? QUICK_BILLS.find((b) => b.key === state.billKey) : undefined;
        if (bill) {
          const categoryId = await ensureCategory(bill.categoryName, 'expense', bill.icon, bill.color);
          openAdd('expense', { categoryId, description: `${bill.label} Bill` });
        } else {
          openAdd(state.openAdd!);
        }
      })();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line
  }, []);

  const openAdd = (type: 'income' | 'expense', opts?: { categoryId?: number; description?: string }) => {
    setEditing(undefined); setAddType(type); setPrefill(opts ?? {}); setModalOpen(true);
  };
  const openEdit = (t: Transaction) => { setEditing(t); setAddType(t.type as 'income' | 'expense'); setModalOpen(true); };

  const handleQuickBill = async (bill: QuickBillDef) => {
    const categoryId = await ensureCategory(bill.categoryName, 'expense', bill.icon, bill.color);
    openAdd('expense', { categoryId, description: `${bill.label} Bill` });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this transaction? Account balances will be adjusted.')) return;
    await api.delete('/transactions.php', { params: { id } });
    if (page > 1 && txns.length === 1) setPage((p) => p - 1); else load();
    refreshAll();
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Transactions</h1>
          <p className="text-sm text-muted">Every income, expense, and transfer in one ledger.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAdd('income')} className="btn-secondary"><Plus size={16} /> Income</button>
          <button onClick={() => openAdd('expense')} className="btn-primary"><Plus size={16} /> Expense</button>
        </div>
      </div>

      <div className="space-y-2.5">
        <QuickBills bills={QUICK_BILLS.filter((b) => b.group === 'daily')} onSelect={handleQuickBill} />
        <QuickBills bills={QUICK_BILLS.filter((b) => b.group === 'bill')} onSelect={handleQuickBill} />
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="label">Search</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Description or notes…" value={filters.search}
              onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, search: e.target.value })); }} />
          </div>
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={filters.type} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, type: e.target.value })); }}>
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={filters.category_id} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, category_id: e.target.value })); }}>
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Account</label>
          <select className="input" value={filters.account_id} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, account_id: e.target.value })); }}>
            <option value="">All</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-expense">{error}</div>
        ) : txns.length === 0 ? (
          <div className="p-10 text-center text-muted">No transactions match these filters yet.</div>
        ) : (
          <div className="divide-y divide-line">
            {txns.map((t) => {
              const Icon = TYPE_ICON[t.type];
              const actions = [
                ...(t.type !== 'transfer' ? [{ icon: <Pencil size={16} />, label: 'Edit', onClick: () => openEdit(t), className: 'bg-ink/5 text-ink' }] : []),
                { icon: <Trash2 size={16} />, label: 'Delete', onClick: () => remove(t.id), className: 'bg-expense text-white' },
              ];
              return (
                <SwipeToReveal key={t.id} actions={actions}>
                  <div className="flex items-center gap-3 px-5 py-3 hover:bg-ink/[0.02] group">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${TYPE_BG[t.type]} shrink-0`}>
                      <Icon size={17} className={TYPE_TEXT[t.type]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description || t.category_name || (t.type === 'transfer' ? 'Transfer' : t.type)}</p>
                      <p className="text-xs text-muted truncate">
                        {formatDateTime(t.txn_date)} · {t.account_name}{t.to_account_name ? ` → ${t.to_account_name}` : ''}
                        {t.group_name ? ` · ${t.group_name}` : ''}{t.tags ? ` · #${t.tags.split(',').join(' #')}` : ''}
                      </p>
                    </div>
                    <span className={`amount text-sm shrink-0 ${TYPE_AMOUNT[t.type]}`}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}{formatMoney(t.amount)}
                    </span>
                    <div className="hidden md:group-hover:flex items-center gap-1 shrink-0">
                      {t.type !== 'transfer' && (
                        <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-ink/5 text-muted"><Pencil size={15} /></button>
                      )}
                      <button onClick={() => remove(t.id)} className="p-2 rounded-lg hover:bg-expense/10 text-muted hover:text-expense"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </SwipeToReveal>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-line text-sm">
            <span className="text-muted">Page {page} of {totalPages} · {total} total</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost px-3 py-1">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost px-3 py-1">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Transaction' : `Add ${addType === 'income' ? 'Income' : 'Expense'}`}>
        <TransactionForm
          defaultType={addType}
          existing={editing}
          initialCategoryId={prefill.categoryId}
          initialDescription={prefill.description}
          onCancel={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            // Jump back to page 1 (newest-first sort) and drop a Type filter that would
            // hide the transaction just saved — otherwise it's added but invisible.
            setPage(1);
            setFilters((f) => (f.type && f.type !== addType ? { ...f, type: '' } : f));
            load();
            refreshAll();
          }}
        />
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { api, apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Archive, Wallet, Landmark, CreditCard, Smartphone, QrCode, MoreHorizontal } from 'lucide-react';
import { Account, AccountType } from '@/types';
import { formatMoney } from '@/lib/format';

const TYPE_META: Record<AccountType, { label: string; icon: any }> = {
  cash: { label: 'Cash', icon: Wallet },
  bank: { label: 'Bank Account', icon: Landmark },
  credit_card: { label: 'Credit Card', icon: CreditCard },
  wallet: { label: 'Wallet', icon: Smartphone },
  upi: { label: 'UPI', icon: QrCode },
  other: { label: 'Other', icon: MoreHorizontal },
};
const COLORS = ['#3B5BA9', '#0B8457', '#B33A3A', '#946200', '#7A3FB3', '#0E7C86'];

export default function Accounts() {
  const { accounts, refreshAccounts } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>();
  const [form, setForm] = useState({ name: '', type: 'bank' as AccountType, opening_balance: '0', color: COLORS[0] });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { refreshAccounts(); }, [refreshAccounts]);

  const openAdd = () => { setEditing(undefined); setForm({ name: '', type: 'bank', opening_balance: '0', color: COLORS[0] }); setModalOpen(true); };
  const openEdit = (a: Account) => { setEditing(a); setForm({ name: a.name, type: a.type, opening_balance: String(a.opening_balance), color: a.color }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { setError('Account name is required.'); return; }
    setSaving(true); setError(null);
    try {
      if (editing) await api.put('/accounts.php', { id: editing.id, name: form.name, type: form.type, color: form.color });
      else await api.post('/accounts.php', form);
      setModalOpen(false); refreshAccounts();
    } catch (err) { setError(apiErrorMessage(err, 'Could not save account.')); } finally { setSaving(false); }
  };

  const archive = async (id: number) => {
    if (!confirm('Archive this account? It will be hidden from new transactions but past history is kept.')) return;
    await api.put('/accounts.php', { id, is_archived: 1 });
    refreshAccounts();
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Accounts</h1>
          <p className="text-sm text-muted">Total across all accounts: <span className="amount text-ink font-medium">{formatMoney(totalBalance)}</span></p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> New Account</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => {
          const Icon = TYPE_META[a.type].icon;
          return (
            <div key={a.id} className="card group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.color + '1A', color: a.color }}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.name}</p>
                  <p className="text-xs text-muted">{TYPE_META[a.type].label}</p>
                </div>
                <div className="hidden group-hover:flex gap-1">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-ink/5 text-muted"><Pencil size={15} /></button>
                  <button onClick={() => archive(a.id)} className="p-1.5 rounded-lg hover:bg-expense/10 text-muted hover:text-expense"><Archive size={15} /></button>
                </div>
              </div>
              <p className="amount text-2xl font-semibold">{formatMoney(a.current_balance)}</p>
            </div>
          );
        })}
        {accounts.length === 0 && <p className="text-sm text-muted col-span-full text-center py-10">No accounts yet — add cash, bank, or card accounts to get started.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Account' : 'New Account'}>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. HDFC Savings" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}>
              {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {!editing && (
            <div>
              <label className="label">Opening Balance</label>
              <input className="input amount" type="number" step="0.01" value={form.opening_balance}
                onChange={(e) => setForm((f) => ({ ...f, opening_balance: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full border-2"
                  style={{ background: c, borderColor: form.color === c ? '#12181B' : 'transparent' }} />
              ))}
            </div>
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

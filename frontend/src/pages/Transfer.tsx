import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { api, apiErrorMessage } from '@/lib/api';
import { todayInputValue, formatMoney, formatDateTime } from '@/lib/format';
import { ArrowLeftRight } from 'lucide-react';
import { Transaction } from '@/types';

const schema = z.object({
  amount: z.coerce.number().positive('Enter an amount greater than zero'),
  account_id: z.coerce.number().min(1, 'Select a source account'),
  to_account_id: z.coerce.number().min(1, 'Select a destination account'),
  txn_date: z.string().min(1),
  description: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => d.account_id !== d.to_account_id, {
  message: 'Source and destination accounts must be different.', path: ['to_account_id'],
});
type FormData = z.infer<typeof schema>;

export default function Transfer() {
  const { accounts, refreshAll } = useAppStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recent, setRecent] = useState<Transaction[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { txn_date: todayInputValue() },
  });

  useEffect(() => { refreshAll(); loadRecent(); }, [refreshAll]);

  const loadRecent = () => {
    api.get('/transactions.php', { params: { type: 'transfer', limit: 8 } }).then((r) => setRecent(r.data.transactions));
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null); setSuccess(false);
    try {
      await api.post('/transactions.php', { ...data, type: 'transfer' });
      setSuccess(true);
      reset({ txn_date: todayInputValue() });
      refreshAll(); loadRecent();
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Could not complete transfer.'));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-semibold">Transfer Money</h1>
        <p className="text-sm text-muted">Move funds between your own accounts — no impact on income or expense totals.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Amount</label>
            <input className="input amount" type="number" step="0.01" placeholder="0.00" {...register('amount')} />
            {errors.amount && <p className="text-xs text-expense mt-1">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="label">From</label>
              <select className="input" {...register('account_id')}>
                <option value="">Select…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} · {formatMoney(a.current_balance)}</option>)}
              </select>
            </div>
            <ArrowLeftRight className="mb-2 text-muted" size={18} />
            <div>
              <label className="label">To</label>
              <select className="input" {...register('to_account_id')}>
                <option value="">Select…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} · {formatMoney(a.current_balance)}</option>)}
              </select>
            </div>
          </div>
          {errors.to_account_id && <p className="text-xs text-expense -mt-2">{errors.to_account_id.message}</p>}

          <div>
            <label className="label">Date & Time</label>
            <input className="input" type="datetime-local" {...register('txn_date')} />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="e.g. Moving savings to checking" {...register('description')} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          {serverError && <p className="text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">{serverError}</p>}
          {success && <p className="text-sm text-income bg-income/10 rounded-lg px-3 py-2">Transfer completed.</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Transferring…' : 'Transfer'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-medium mb-3">Recent Transfers</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No transfers yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{t.account_name} → {t.to_account_name}</p>
                  <p className="text-xs text-muted">{formatDateTime(t.txn_date)}{t.description ? ` · ${t.description}` : ''}</p>
                </div>
                <span className="amount amount-transfer">{formatMoney(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

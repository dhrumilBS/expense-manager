import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '@/store/appStore';
import { api, apiErrorMessage } from '@/lib/api';
import { Transaction } from '@/types';
import { useState } from 'react';
import { todayInputValue } from '@/lib/format';
import AmountInput from '@/components/ui/AmountInput';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Enter an amount greater than zero'),
  account_id: z.coerce.number().min(1, 'Select an account'),
  category_id: z.coerce.number().min(1, 'Select a category'),
  expense_group_id: z.coerce.number().optional(),
  payment_method: z.string().optional(),
  txn_date: z.string().min(1, 'Pick a date'),
  description: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PAYMENT_METHODS = ['Cash', 'Debit Card', 'Credit Card', 'UPI', 'Net Banking', 'Cheque', 'Other'];

export default function TransactionForm({
  defaultType = 'expense', existing, onSaved, onCancel, initialCategoryId, initialDescription,
}: {
  defaultType?: 'income' | 'expense'; existing?: Transaction; onSaved: () => void; onCancel: () => void;
  initialCategoryId?: number; initialDescription?: string;
}) {
  const { accounts, categories, groups } = useAppStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existing ? {
      type: existing.type as 'income' | 'expense',
      amount: Number(existing.amount),
      account_id: existing.account_id ?? undefined,
      category_id: existing.category_id ?? undefined,
      expense_group_id: existing.expense_group_id ?? undefined,
      payment_method: existing.payment_method ?? '',
      txn_date: existing.txn_date.slice(0, 16),
      description: existing.description ?? '',
      notes: existing.notes ?? '',
      tags: existing.tags ?? '',
    } : {
      type: defaultType,
      txn_date: todayInputValue(),
      category_id: initialCategoryId,
      description: initialDescription ?? '',
    },
  });

  const type = watch('type');
  const filteredCategories = categories.filter((c) => c.type === type);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      let receipt_path: string | undefined;
      if (receiptFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('receipt', receiptFile);
        const up = await api.post('/upload.php', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        receipt_path = up.data.path;
        setUploading(false);
      }
      const payload = { ...data, receipt_path };
      if (existing) {
        await api.put('/transactions.php', { id: existing.id, ...payload });
      } else {
        await api.post('/transactions.php', payload);
      }
      onSaved();
    } catch (err) {
      setUploading(false);
      setServerError(apiErrorMessage(err, 'Could not save transaction.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t} type="button"
            onClick={() => setValue('type', t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize border transition-colors ${
              type === t
                ? t === 'income' ? 'bg-income/10 border-income text-income' : 'bg-expense/10 border-expense text-expense'
                : 'border-line text-muted hover:bg-ink/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className="label">Amount</label>
        <AmountInput
          value={watch('amount')}
          onChange={(n) => setValue('amount', n, { shouldValidate: true })}
          autoFocus
        />
        {errors.amount && <p className="text-xs text-expense mt-1">{errors.amount.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Account</label>
          <select className="input" {...register('account_id')}>
            <option value="">Select…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {errors.account_id && <p className="text-xs text-expense mt-1">{errors.account_id.message}</p>}
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" {...register('category_id')}>
            <option value="">Select…</option>
            {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category_id && <p className="text-xs text-expense mt-1">{errors.category_id.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Expense Group</label>
          <select className="input" {...register('expense_group_id')}>
            <option value="">None</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input" {...register('payment_method')}>
            <option value="">Select…</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Date & Time</label>
        <input className="input" type="datetime-local" {...register('txn_date')} />
        {errors.txn_date && <p className="text-xs text-expense mt-1">{errors.txn_date.message}</p>}
      </div>

      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="e.g. Dinner with friends" {...register('description')} />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} placeholder="Optional details" {...register('notes')} />
      </div>

      <div>
        <label className="label">Tags (comma-separated)</label>
        <input className="input" placeholder="e.g. weekend, family" {...register('tags')} />
      </div>

      <div>
        <label className="label">Receipt</label>
        <input
          className="input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand/10 file:text-brand file:text-sm"
          type="file" accept="image/*,application/pdf"
          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
        />
        {existing?.receipt_path && !receiptFile && <p className="text-xs text-muted mt-1">Existing receipt will be kept unless you upload a new one.</p>}
      </div>

      {serverError && <p className="text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">{serverError}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={isSubmitting || uploading} className="btn-primary flex-1">
          {uploading ? 'Uploading…' : isSubmitting ? 'Saving…' : existing ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}

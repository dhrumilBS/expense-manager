import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { api, API_URL } from '@/lib/api';
import { Transaction } from '@/types';
import { formatMoney, formatDate } from '@/lib/format';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EMPTY_FILTERS = {
  date_from: '', date_to: '', expense_group_id: '', category_id: '', account_id: '',
  payment_method: '', type: '', tag: '', amount_min: '', amount_max: '',
};

export default function Reports() {
  const { accounts, categories, groups, refreshAll } = useAppStore();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const activeParams = () => {
    const p: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  };

  const runReport = () => {
    setLoading(true);
    api.get('/transactions.php', { params: { ...activeParams(), limit: 500 } })
      .then((r) => setRows(r.data.transactions))
      .finally(() => setLoading(false));
  };

  useEffect(() => { runReport(); /* eslint-disable-next-line */ }, []);

  const token = sessionStorage.getItem('em_token');

  const downloadCsv = async (format: 'csv' | 'excel') => {
    const params = new URLSearchParams({ ...activeParams(), format });
    const res = await fetch(`${API_URL}/reports.php?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expense-report.${format === 'excel' ? 'csv' : 'csv'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Expense Report', 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Type', 'Amount', 'Category', 'Account', 'Description']],
      body: rows.map((r) => [
        formatDate(r.txn_date), r.type, formatMoney(r.amount),
        r.category_name || '-', r.account_name || '-', r.description || '-',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [11, 110, 79] },
    });
    doc.save('expense-report.pdf');
  };

  const total = rows.reduce((s, r) => s + (r.type === 'expense' ? -Number(r.amount) : r.type === 'income' ? Number(r.amount) : 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted">Filter your transactions and export for taxes, sharing, or record-keeping.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCsv('csv')} className="btn-secondary"><Download size={16} /> CSV</button>
          <button onClick={() => downloadCsv('excel')} className="btn-secondary"><FileSpreadsheet size={16} /> Excel</button>
          <button onClick={downloadPdf} className="btn-secondary"><FileText size={16} /> PDF</button>
        </div>
      </div>

      <div className="card grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="label">From</label><input className="input" type="date" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} /></div>
        <div><label className="label">To</label><input className="input" type="date" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} /></div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="">All</option><option value="income">Income</option><option value="expense">Expense</option><option value="transfer">Transfer</option>
          </select>
        </div>
        <div>
          <label className="label">Expense Group</label>
          <select className="input" value={filters.expense_group_id} onChange={(e) => setFilters((f) => ({ ...f, expense_group_id: e.target.value }))}>
            <option value="">All</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={filters.category_id} onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value }))}>
            <option value="">All</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Account</label>
          <select className="input" value={filters.account_id} onChange={(e) => setFilters((f) => ({ ...f, account_id: e.target.value }))}>
            <option value="">All</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div><label className="label">Min Amount</label><input className="input amount" type="number" value={filters.amount_min} onChange={(e) => setFilters((f) => ({ ...f, amount_min: e.target.value }))} /></div>
        <div><label className="label">Max Amount</label><input className="input amount" type="number" value={filters.amount_max} onChange={(e) => setFilters((f) => ({ ...f, amount_max: e.target.value }))} /></div>
        <div><label className="label">Tag</label><input className="input" value={filters.tag} onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))} placeholder="e.g. weekend" /></div>
        <div className="flex items-end gap-2">
          <button onClick={runReport} className="btn-primary w-full">Run Report</button>
          <button onClick={() => { setFilters(EMPTY_FILTERS); }} className="btn-ghost">Reset</button>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted border-b border-line">
            <tr>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Account</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted">No results for these filters.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-2.5">{formatDate(r.txn_date)}</td>
                <td className="px-5 py-2.5 capitalize">{r.type}</td>
                <td className="px-5 py-2.5">{r.category_name || '-'}</td>
                <td className="px-5 py-2.5">{r.account_name}{r.to_account_name ? ` → ${r.to_account_name}` : ''}</td>
                <td className="px-5 py-2.5 text-muted">{r.description || '-'}</td>
                <td className={`px-5 py-2.5 text-right amount ${r.type === 'income' ? 'amount-income' : r.type === 'expense' ? 'amount-expense' : 'amount-transfer'}`}>
                  {formatMoney(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-line font-medium">
                <td className="px-5 py-3" colSpan={5}>Net (income − expense)</td>
                <td className={`px-5 py-3 text-right amount ${total >= 0 ? 'amount-income' : 'amount-expense'}`}>{formatMoney(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

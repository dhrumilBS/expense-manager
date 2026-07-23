import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { api, apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2, Circle } from 'lucide-react';
import { Category } from '@/types';

const COLORS = ['#B33A3A', '#0B8457', '#3B5BA9', '#946200', '#7A3FB3', '#0E7C86', '#B3387A', '#6B7280'];

export default function Categories() {
  const { categories, refreshCategories } = useAppStore();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { refreshCategories(); }, [refreshCategories]);

  const list = categories.filter((c) => c.type === tab);

  const openAdd = () => { setEditing(undefined); setName(''); setColor(COLORS[0]); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setColor(c.color); setModalOpen(true); };

  const save = async () => {
    if (!name.trim()) { setError('Category name is required.'); return; }
    setSaving(true); setError(null);
    try {
      if (editing) await api.put('/categories.php', { id: editing.id, name, color });
      else await api.post('/categories.php', { name, color, type: tab });
      setModalOpen(false); refreshCategories();
    } catch (err) { setError(apiErrorMessage(err, 'Could not save category.')); } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await api.delete('/categories.php', { params: { id } });
    refreshCategories();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted">Keep income and expenses classified for cleaner reports.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> New Category</button>
      </div>

      <div className="inline-flex bg-ink/5 rounded-xl p-1">
        {(['expense', 'income'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-surface shadow-softer' : 'text-muted'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.color + '1A', color: c.color }}>
              <Circle size={16} fill={c.color} strokeWidth={0} />
            </div>
            <div className="flex-1 min-w-0"><p className="font-medium truncate">{c.name}</p></div>
            <div className="hidden group-hover:flex gap-1">
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-ink/5 text-muted"><Pencil size={15} /></button>
              <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-expense/10 text-muted hover:text-expense"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted col-span-full text-center py-10">No {tab} categories yet.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : `New ${tab} category`}>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Subscriptions" />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2"
                  style={{ background: c, borderColor: color === c ? '#12181B' : 'transparent' }} />
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

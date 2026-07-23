import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { api, apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2, Folder } from 'lucide-react';
import { ExpenseGroup } from '@/types';

const COLORS = ['#0B8457', '#3B5BA9', '#946200', '#0E7C86', '#B33A3A', '#7A3FB3', '#B3387A', '#6B7280'];

export default function Groups() {
  const { groups, refreshGroups } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseGroup | undefined>();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { refreshGroups(); }, [refreshGroups]);

  const openAdd = () => { setEditing(undefined); setName(''); setColor(COLORS[0]); setModalOpen(true); };
  const openEdit = (g: ExpenseGroup) => { setEditing(g); setName(g.name); setColor(g.color); setModalOpen(true); };

  const save = async () => {
    if (!name.trim()) { setError('Group name is required.'); return; }
    setSaving(true); setError(null);
    try {
      if (editing) await api.put('/groups.php', { id: editing.id, name, color });
      else await api.post('/groups.php', { name, color });
      setModalOpen(false); refreshGroups();
    } catch (err) { setError(apiErrorMessage(err, 'Could not save group.')); } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this group? Transactions using it will keep their other details.')) return;
    await api.delete('/groups.php', { params: { id } });
    refreshGroups();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Expense Groups</h1>
          <p className="text-sm text-muted">Organize spending by who or what it's for — Personal, Household, Trip, and more.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> New Group</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="card flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: g.color + '1A', color: g.color }}>
              <Folder size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{g.name}</p>
              {!!g.is_default && <p className="text-xs text-muted">Default</p>}
            </div>
            <div className="hidden group-hover:flex gap-1">
              <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-ink/5 text-muted"><Pencil size={15} /></button>
              <button onClick={() => remove(g.id)} className="p-1.5 rounded-lg hover:bg-expense/10 text-muted hover:text-expense"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="text-sm text-muted col-span-full text-center py-10">No expense groups yet — add your first one.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Group' : 'New Expense Group'}>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kids, Office, Friends" />
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

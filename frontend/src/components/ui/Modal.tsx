import { X } from 'lucide-react';
import { ReactNode } from 'react';

export default function Modal({
  open, onClose, title, children, width = 'max-w-lg',
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-surface rounded-t-2xl sm:rounded-2xl shadow-soft w-full ${width} max-h-[85vh] sm:max-h-[90vh] overflow-y-auto`}>
        <div className="mx-auto mt-2 mb-1 h-1.5 w-10 rounded-full bg-ink/10 sm:hidden" />
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-line sticky top-0 bg-surface">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-ink/5"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

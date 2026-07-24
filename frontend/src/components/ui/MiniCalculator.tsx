import { useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { evalExpr } from '@/lib/calc';

const KEYS = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', 'C', '+'];
const OPS = ['/', '*', '-', '+'];

interface MiniCalculatorProps {
  onClose: () => void;
}

/**
 * Standalone quick-calculator panel, separate from the amount field's inline
 * calculator — for arbitrary sums (e.g. splitting a bill) outside any form.
 */
export default function MiniCalculator({ onClose }: MiniCalculatorProps) {
  const [expr, setExpr] = useState('');
  const result = evalExpr(expr);

  const press = (key: string) => {
    if (key === 'C') { setExpr(''); return; }
    setExpr((e) => e + key);
  };

  const equals = () => {
    if (result !== null) setExpr(String(result));
  };

  return (
    <div className="absolute bottom-full left-3 right-3 mb-2 card shadow-soft p-3 space-y-2 z-40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">Quick Calculator</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-ink/5 text-muted" title="Close">
          <X size={14} />
        </button>
      </div>
      <div className="rounded-xl bg-ink/5 px-3 py-2 text-right overflow-hidden">
        <p className="text-xs text-muted truncate min-h-[1rem]">{expr || '0'}</p>
        <p className="font-display text-lg font-semibold truncate amount">{result ?? '—'}</p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className={clsx(
              'py-2 rounded-lg text-sm font-medium transition-colors',
              k === 'C' ? 'bg-expense/10 text-expense hover:bg-expense/20'
                : OPS.includes(k) ? 'bg-brand/10 text-brand hover:bg-brand/20'
                : 'bg-ink/5 hover:bg-ink/10'
            )}
          >
            {k}
          </button>
        ))}
        <button type="button" onClick={equals} className="col-span-4 py-2 rounded-lg text-sm font-semibold btn-primary">
          =
        </button>
      </div>
    </div>
  );
}

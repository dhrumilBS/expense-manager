import { useEffect, useState } from 'react';
import { evalExpr } from '@/lib/calc';

const STEPS = [-1000, -100, -10, 10, 100, 1000];

interface AmountInputProps {
  value: number | string | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Amount field with a built-in mini calculator: type an expression like
 * "120+50" and it evaluates live, plus quick +/-10/100/1000 stepper chips.
 */
export default function AmountInput({ value, onChange, placeholder = '0.00', autoFocus }: AmountInputProps) {
  const [text, setText] = useState(value === undefined || value === '' ? '' : String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(value === undefined || value === '' ? '' : String(value));
  }, [value, focused]);

  const result = evalExpr(text);
  const isExpr = /[+\-*/()]/.test(text.replace(/^-/, ''));

  const commit = (newText: string) => {
    setText(newText);
    const r = evalExpr(newText);
    if (r !== null && r >= 0) onChange(r);
  };

  const adjust = (delta: number) => {
    const current = evalExpr(text) ?? 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    commit(String(next));
  };

  return (
    <div>
      <input
        className="input amount text-lg"
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => {
          setFocused(false);
          if (result !== null) setText(String(result));
        }}
      />
      {isExpr && result !== null && (
        <p className="text-xs text-brand mt-1 amount">= {result.toFixed(2)}</p>
      )}
      <div className="grid grid-cols-6 gap-1.5 mt-2">
        {STEPS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => adjust(d)}
            className={`py-2 rounded-lg text-xs font-medium amount ${d > 0 ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}

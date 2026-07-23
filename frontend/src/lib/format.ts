export function formatMoney(value: number | string, currency = 'INR'): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[currency] ?? currency + ' ';
  const sign = n < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 16);
}

/**
 * Tiny recursive-descent arithmetic evaluator for the amount field's mini calculator.
 * Deliberately hand-rolled (no eval/Function) since the input is raw user text.
 * Supports +, -, *, /, parentheses, and decimals. Returns null on any invalid input.
 */
export function evalExpr(input: string): number | null {
  const src = input.replace(/\s+/g, '');
  if (!src) return null;
  if (!/^[0-9+\-*/.()]+$/.test(src)) return null;

  let i = 0;
  const peek = () => src[i];

  function parseNumber(): number {
    const start = i;
    while (i < src.length && /[0-9.]/.test(src[i])) i++;
    const numStr = src.slice(start, i);
    if (!numStr || numStr === '.') throw new Error('bad number');
    const n = Number(numStr);
    if (Number.isNaN(n)) throw new Error('bad number');
    return n;
  }

  function parseFactor(): number {
    if (peek() === '(') {
      i++;
      const v = parseExpr();
      if (peek() !== ')') throw new Error('missing )');
      i++;
      return v;
    }
    if (peek() === '-') { i++; return -parseFactor(); }
    if (peek() === '+') { i++; return parseFactor(); }
    return parseNumber();
  }

  function parseTerm(): number {
    let v = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = src[i]; i++;
      const rhs = parseFactor();
      v = op === '*' ? v * rhs : v / rhs;
    }
    return v;
  }

  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = src[i]; i++;
      const rhs = parseTerm();
      v = op === '+' ? v + rhs : v - rhs;
    }
    return v;
  }

  try {
    const result = parseExpr();
    if (i !== src.length) return null;
    if (!Number.isFinite(result)) return null;
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}

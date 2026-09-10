import { Token } from './tokenizer';
import { AlpelError } from './error';
import { callFn } from './builtins';
import { resolveId, compare, alpEquals, truthy, getProp } from './sandbox';
import type { AlpelValue, EvalContext } from './types';

// ── Parser (Pratt-ish, precedence: || < && < comparison < +/- < *// < unary ! < primary) ──

export function parseExpr(tokens: Token[]): (ctx: EvalContext) => AlpelValue {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseOr(): (c: EvalContext) => AlpelValue {
    let left = parseAnd();
    while (peek()?.t === 'op' && peek().v === '||') {
      next();
      const right = parseAnd();
      const l = left;
      left = (c) =>Boolean((l(c) || right(c)));
    }
    return left;
  }
  function parseAnd(): (c: EvalContext) => AlpelValue {
    let left = parseComparison();
    while (peek()?.t === 'op' && peek().v === '&&') {
      next();
      const right = parseComparison();
      const l = left;
      left = (c) => Boolean(l(c) && right(c));
    }
    return left;
  }
  function parseComparison(): (c: EvalContext) => AlpelValue {
    const left = parseAdd();
    const op = peek();
    if (op?.t === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(op.v)) {
      next();
      const right = parseAdd();
      const l = left;
      return (c) => compare(l(c), op.v as string, right(c));
    }
    if (op?.t === 'op' && op.v === 'in') {
      next();
      const right = parseAdd();
      const l = left;
      return (c) => {
        const a = l(c), b = right(c);
        if (Array.isArray(b)) return b.some((x) => alpEquals(x, a));
        if (typeof b === 'string' && typeof a === 'string') return b.includes(a);
        return false;
      };
    }
    return left;
  }
  function parseAdd(): (c: EvalContext) => AlpelValue {
    let left = parseMul();
    while (peek()?.t === 'op' && (peek().v === '+' || peek().v === '-')) {
      const v = (next() as any).v;
      const right = parseMul();
      const l = left;
      left = (c) => {
        const a = l(c), b = right(c);
        if (typeof a === 'number' && typeof b === 'number') return v === '+' ? a + b : a - b;
        if (typeof a === 'string') return a + String(b); // string concat
        throw new AlpelError('ALPEL: + / - require numbers or a string');
      };
    }
    return left;
  }
  function parseMul(): (c: EvalContext) => AlpelValue {
    let left = parseUnary();
    while (peek()?.t === 'op' && (peek().v === '*' || peek().v === '/')) {
      const v = (next() as any).v;
      const right = parseUnary();
      const l = left;
      left = (c) => {
        const a = l(c), b = right(c);
        if (typeof a === 'number' && typeof b === 'number') return v === '*' ? a * b : a / b;
        throw new AlpelError('ALPEL: * / require numbers');
      };
    }
    return left;
  }
  function parseUnary(): (c: EvalContext) => AlpelValue {
    if (peek()?.t === 'op' && peek().v === '!') {
      next();
      const inner = parseUnary();
      return (c) => !truthy(inner(c));
    }
    if (peek()?.t === 'op' && peek().v === '-') {
      next();
      const inner = parseUnary();
      return (c) => {
        const v = inner(c);
        if (typeof v === 'number') return -v;
        throw new AlpelError('ALPEL: unary - requires a number');
      };
    }
    if (peek()?.t === 'op' && peek().v === '+') {
      next();
      return parseUnary();
    }
    return parsePostfix();
  }
  function parsePostfix(): (c: EvalContext) => AlpelValue {
    let node = parsePrimary();
    let isName = (node as any).__id != null;
    while (true) {
      if (peek()?.t === 'dot') {
        next();
        const id = next();
        if (id?.t !== 'id') throw new AlpelError('ALPEL: expected property after .');
        const base = node;
        const name = (id as any).v;
        node = (c) => getProp(base(c), name);
        (node as any).__id = name;
        (node as any).__base = base;
        isName = true;
      } else if (peek()?.t === 'lb') {
        // bracket access obj['k'] / arr[0] — always (never a call; calls use `(`).
        next();
        const keyTok = peek();
        let key: AlpelValue;
        if (keyTok?.t === 'str' || keyTok?.t === 'id' || keyTok?.t === 'num') {
          key = (next() as any).v;
        } else {
          key = (parseOr() as any) as AlpelValue;
        }
        if (peek()?.t !== 'rb') throw new AlpelError("ALPEL: expected ]");
        next();
        const base = node;
        node = (c) => getProp(base(c), key as any);
        isName = false;
      } else if (peek()?.t === 'lp') {
        if (!isName) {
          next();
          const e = parseOr();
          if (peek()?.t !== 'rp') throw new AlpelError('ALPEL: expected )');
          next();
          node = e;
        } else {
          next();
          const fnName = (node as any).__id;
          const base = (node as any).__base;
          const args: ((c: EvalContext) => AlpelValue)[] = [];
          if (peek()?.t !== 'rp') {
            args.push(parseOr());
            while (peek()?.t === 'comma') { next(); args.push(parseOr()); }
          }
          if (peek()?.t !== 'rp') throw new AlpelError('ALPEL: expected )');
          next();
          if (base) {
            node = (c) => callFn(fnName, [base(c), ...args.map((a) => a(c))]);
          } else {
            node = (c) => callFn(fnName, args.map((a) => a(c)));
          }
        }
        isName = false;
      } else {
        break;
      }
    }
    return node;
  }
  function parsePrimary(): (c: EvalContext) => AlpelValue {
    const tok = peek();
    if (!tok) throw new AlpelError('ALPEL: unexpected end of expression');
    if (tok.t === 'lp') {
      next();
      const e = parseOr();
      if (peek()?.t !== 'rp') throw new AlpelError('ALPEL: expected )');
      next();
      return e;
    }
    if (tok.t === 'lb') {
      next();
      const items: ((c: EvalContext) => AlpelValue)[] = [];
      if (peek()?.t !== 'rb') {
        items.push(parseOr());
        while (peek()?.t === 'comma') { next(); items.push(parseOr()); }
      }
      if (peek()?.t !== 'rb') throw new AlpelError("ALPEL: expected ]");
      next();
      return (c) => items.map((a) => a(c));
    }
    if (tok.t === 'lbrace') {
      next();
      const obj: Record<string, AlpelValue> = {};
      if (peek()?.t !== 'rbrace') {
        while (true) {
          const keyTok = next();
          const key = keyTok?.t === 'str' ? String(keyTok.v)
            : keyTok?.t === 'id' ? String(keyTok.v) : null;
          if (key == null) throw new AlpelError("ALPEL: expected object key");
          if (peek()?.t !== 'colon') throw new AlpelError("ALPEL: expected :");
          next();
          const val = parseOr();
          (obj as any)[key] = val;
          if (peek()?.t === 'comma') { next(); continue; }
          break;
        }
      }
      if (peek()?.t !== 'rbrace') throw new AlpelError("ALPEL: expected }");
      next();
      return (c) => {
        const result: Record<string, AlpelValue> = {};
        for (const k of Object.keys(obj)) {
          result[k] = (obj as any)[k](c);
        }
        return result;
      };
    }
    if (tok.t === 'num') { next(); return () => tok.v; }
    if (tok.t === 'str') { next(); return () => tok.v; }
    if (tok.t === 'bool') { next(); return () => tok.v; }
    if (tok.t === 'null') { next(); return () => null; }
    if (tok.t === 'id') {
      next();
      const node = (c: EvalContext) => resolveId(c, tok.v as string);
      (node as any).__id = tok.v;
      return node;
    }
    throw new AlpelError(`ALPEL: unexpected token '${JSON.stringify(tok)}'`);
  }

  return parseOr();
}

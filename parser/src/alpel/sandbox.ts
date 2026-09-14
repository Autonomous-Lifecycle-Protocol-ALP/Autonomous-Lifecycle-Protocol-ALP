import type { AlpelValue, EvalContext } from './types';
import { AlpelError } from './error';
import { NS_PREFIX, NAMESPACE_NAMES, CONTEXT_KEYS } from './constants';

export function truthy(v: AlpelValue): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return v != null;
}

export function compare(a: AlpelValue, op: string, b: AlpelValue): boolean {
  if (op === '==') return alpEquals(a, b);
  if (op === '!=') return !alpEquals(a, b);
  if (op === '<' || op === '>' || op === '<=' || op === '>=') {
    const av = typeof a === 'number' || typeof a === 'string' ? a : null;
    const bv = typeof b === 'number' || typeof b === 'string' ? b : null;
    if (av == null || bv == null) throw new AlpelError('ALPEL: < > <= >= need comparable values');
    if (av < bv) return op === '<' || op === '<=';
    if (av > bv) return op === '>' || op === '>=';
    return op === '<=' || op === '>=';
  }
  throw new AlpelError(`ALPEL: unknown comparison '${op}'`);
}

export function alpEquals(a: AlpelValue, b: AlpelValue): boolean {
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b;
  if (a == null && b == null) return true;
  return false;
}

export function getProp(base: AlpelValue, key: string | number): AlpelValue {
  if (base == null) return null;
  if (Array.isArray(base)) {
    if (key === 'size') return base.length;
    if (key === 'isEmpty') return base.length === 0;
    return (base as AlpelValue[])[key as number] ?? null;
  }
  if (typeof base === 'object') {
    const o = base as { [k: string]: AlpelValue };
    if (key === 'size') return Object.keys(o).length;
    if (key === 'isEmpty') return Object.keys(o).length === 0;
    return o[key as string] ?? null;
  }
  return null;
}

export function resolveId(ctx: EvalContext, name: string): AlpelValue {
  if (name in ctx) return ctx[name];
  if (NAMESPACE_NAMES.includes(name as any)) return NS_PREFIX + name;
  for (const k of CONTEXT_KEYS) {
    const c = ctx[k];
    if (c && typeof c === 'object' && !Array.isArray(c) && name in (c as object)) {
      return (c as any)[name];
    }
  }
  throw new AlpelError(`ALPEL: unknown identifier '${name}'`);
}

import { AlpObject } from '../reader';
import { tokenize } from './tokenizer';
import { parseExpr } from './parser';
import { truthy } from './sandbox';
import type { AlpelValue, EvalContext } from './types';
import { CONTEXT_KEYS } from './constants';

/** Build an evaluation context from the surrounding ALP objects. */
export function buildContext(obj: AlpObject | null, extra: EvalContext = {}): EvalContext {
  const ctx: EvalContext = {};
  if (obj) ctx[obj._type] = obj as unknown as AlpelValue;
  for (const k of CONTEXT_KEYS) {
    const v = (obj as any)?.[k];
    if (v != null) ctx[k] = v;
  }
  return { ...ctx, ...extra };
}

/** Evaluate an ALPEL boolean/value expression against a context. */
export function evaluate(expr: string, ctx: EvalContext): AlpelValue {
  const tokens = tokenize(expr);
  const fn = parseExpr(tokens);
  return fn(ctx);
}

/** Evaluate as a boolean (for `!if` / `!assert`). */
export function evaluateBool(expr: string, ctx: EvalContext): boolean {
  return truthy(evaluate(expr, ctx));
}

const INTERP_RE = /\$\{\s*([^}]+?)\s*\}/g;

/**
 * Expand `${ expr }` interpolations in a string value using an ALPEL context.
 * Unknown identifiers are left as empty strings (deterministic, no throw).
 */
export function interpolate(value: string, ctx: EvalContext): string {
  return value.replace(INTERP_RE, (_m, expr) => {
    try {
      const v = evaluate(String(expr).trim(), ctx);
      if (v == null) return '';
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
      return JSON.stringify(v);
    } catch {
      return '';
    }
  });
}

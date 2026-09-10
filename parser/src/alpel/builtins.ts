import { createHash } from 'crypto';
import type { AlpelValue } from './types';
import { AlpelError } from './error';
import { NS_PREFIX } from './constants';
import { alpEquals } from './sandbox';

function utcIso(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
    + `T${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}+00:00`;
}

function callDateFn(name: string, args: AlpelValue[]): AlpelValue {
  switch (name) {
    case 'now': return new Date().toISOString();
    case 'formatDate': {
      const d = args[0];
      const fmt = args[1];
      if (typeof d !== 'string' || typeof fmt !== 'string') return '';
      if (fmt === 'iso') return d;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      const pad = (n: number) => String(n).padStart(2, '0');
      if (fmt === 'date') return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
      if (fmt === 'time') return `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`;
      return d;
    }
    case 'parseDate': {
      const s = args[0];
      if (typeof s !== 'string') return '';
      const dt = new Date(s);
      return isNaN(dt.getTime()) ? s : utcIso(dt);
    }
    case 'addDays': {
      const d = args[0];
      const n = args[1];
      if (typeof d !== 'string' || typeof n !== 'number') return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      dt.setUTCDate(dt.getUTCDate() + n);
      return utcIso(dt);
    }
    default: throw new AlpelError(`ALPEL: date.${name} is undefined`);
  }
}

function callMathFn(name: string, args: AlpelValue[]): AlpelValue {
  const a = args[0];
  switch (name) {
    case 'round': return Math.round(a as number);
    case 'floor': return Math.floor(a as number);
    case 'ceil': return Math.ceil(a as number);
    case 'min': return Math.min(a as number, (args[1] as number) ?? 0);
    case 'max': return Math.max(a as number, (args[1] as number) ?? 0);
    case 'abs': return Math.abs(a as number);
    default: throw new AlpelError(`ALPEL: math.${name} is undefined`);
  }
}

function callCryptoFn(name: string, args: AlpelValue[]): AlpelValue {
  const s = String(args[0] ?? '');
  switch (name) {
    case 'sha256': return createHash('sha256').update(s, 'utf8').digest('hex');
    case 'base64': return Buffer.from(s, 'utf8').toString('base64');
    case 'base64Decode': return Buffer.from(s, 'base64').toString('utf8');
    default: throw new AlpelError(`ALPEL: crypto.${name} is undefined`);
  }
}

function callStringFn(name: string, args: AlpelValue[]): AlpelValue {
  const a = args[0];
  switch (name) {
    case 'trim': return typeof a === 'string' ? a.trim() : String(a);
    case 'replace': {
      const str = typeof a === 'string' ? a : String(a);
      const old = typeof args[1] === 'string' ? args[1] : String(args[1]);
      const rep = typeof args[2] === 'string' ? args[2] : String(args[2]);
      return str.split(old).join(rep);
    }
    case 'split': {
      const str = typeof a === 'string' ? a : String(a);
      const delim = typeof args[1] === 'string' ? args[1] : String(args[1]);
      return str.split(delim);
    }
    case 'join': {
      const arr = Array.isArray(a) ? a : [];
      const delim = typeof args[1] === 'string' ? args[1] : String(args[1]);
      return arr.map((x) => String(x)).join(delim);
    }
    case 'endsWith': {
      const str = typeof a === 'string' ? a : String(a);
      const suf = typeof args[1] === 'string' ? args[1] : String(args[1]);
      return str.endsWith(suf);
    }
    default: throw new AlpelError(`ALPEL: string.${name} is undefined`);
  }
}

function callNsFn(ns: string, name: string, args: AlpelValue[]): AlpelValue {
  switch (ns) {
    case 'date': return callDateFn(name, args);
    case 'math': return callMathFn(name, args);
    case 'crypto': return callCryptoFn(name, args);
    case 'string': return callStringFn(name, args);
    default: throw new AlpelError(`ALPEL: unknown namespace '${ns}'`);
  }
}

// ── Module imports (v10.3.0): shared ALPEL snippets ──

const MODULES: Record<string, Record<string, AlpelValue>> = {};

/** Register a named module of reusable constants/snippets for ALPEL `import()`. */
export function registerModule(name: string, defs: Record<string, AlpelValue>): void {
  MODULES[name] = defs;
}

/** Retrieve a registered module object (property-accessible in ALPEL). */
export function importModule(name: string): Record<string, AlpelValue> {
  const m = MODULES[name];
  if (!m) throw new AlpelError(`ALPEL: module '${name}' is not registered`);
  return m;
}

export function callFn(name: string, args: AlpelValue[]): AlpelValue {
  const a = args[0];
  if (name === 'import') {
    const modName = typeof a === 'string' ? a : '';
    return importModule(modName);
  }
  if (typeof a === 'string' && a.startsWith(NS_PREFIX)) {
    const ns = a.slice(NS_PREFIX.length);
    return callNsFn(ns, name, args.slice(1));
  }
  switch (name) {
    case 'length':
      return typeof a === 'string' ? a.length : Array.isArray(a) ? a.length : 0;
    case 'toUpper':
      return typeof a === 'string' ? a.toUpperCase() : String(a);
    case 'toLower':
      return typeof a === 'string' ? a.toLowerCase() : String(a);
    case 'startsWith':
      return typeof a === 'string' && typeof args[1] === 'string'
        ? a.startsWith(args[1] as string)
        : false;
    case 'size':
      return Array.isArray(a) ? a.length : typeof a === 'object' && a ? Object.keys(a).length : 0;
    case 'isEmpty':
      return Array.isArray(a) ? a.length === 0 : !(a && Object.keys(a as any).length);
    case 'contains':
      if (Array.isArray(a)) return a.some((x) => alpEquals(x, args[1]));
      if (typeof a === 'string' && typeof args[1] === 'string') return a.includes(args[1] as string);
      return false;
    case 'hasStatus':
      if (Array.isArray(a)) return (a as any[]).some((t: any) => t && t.status === args[1]);
      return false;
    default:
      throw new AlpelError(`ALPEL: unknown function '${name}'`);
  }
}

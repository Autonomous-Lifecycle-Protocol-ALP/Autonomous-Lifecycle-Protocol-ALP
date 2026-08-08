const path = {};

path.sep = '/';
path.delimiter = ':';

function normalizePath(p: string): string {
  const parts = p.split('/');
  const result: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (result.length > 0 && result[result.length - 1] !== '..') {
        result.pop();
      }
    } else {
      result.push(part);
    }
  }
  return result.join('/');
}

path.join = (...segments: string[]): string => {
  return normalizePath(segments.filter(Boolean).join('/'));
};

path.resolve = (...segments: string[]): string => {
  const joined = segments.filter(Boolean).join('/');
  if (joined.startsWith('/')) return normalizePath(joined);
  return normalizePath(process.cwd() + '/' + joined);
};

path.dirname = (p: string): string => {
  const parts = p.split('/');
  parts.pop();
  return parts.join('/') || '.';
};

path.basename = (p: string, ext?: string): string => {
  const parts = p.split('/');
  let base = parts.pop() || '';
  if (ext && base.endsWith(ext)) base = base.slice(0, -ext.length);
  return base;
};

path.extname = (p: string): string => {
  const base = p.split('/').pop() || '';
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot) : '';
};

path.isAbsolute = (p: string): boolean => p.startsWith('/');

path.normalize = normalizePath;

path.parse = (p: string) => {
  const base = path.basename(p);
  const ext = path.extname(p);
  return {
    root: '',
    dir: path.dirname(p),
    base: base,
    ext: ext,
    name: ext ? base.slice(0, -ext.length) : base,
  };
};

path.format = (_parsed: any) => _parsed.base || '';

path.relative = (from: string, to: string): string => {
  const f = from.split('/').filter(Boolean);
  const t = to.split('/').filter(Boolean);
  let i = 0;
  while (i < f.length && i < t.length && f[i] === t[i]) i++;
  const up = f.length - i;
  const down = t.slice(i);
  return [...Array(up).fill('..'), ...down].join('/') || '.';
};

path.sep = '/';
path.delimiter = ':';

export const sep = path.sep;
export const delimiter = path.delimiter;
export const join = path.join;
export const resolve = path.resolve;
export const dirname = path.dirname;
export const basename = path.basename;
export const extname = path.extname;
export const isAbsolute = path.isAbsolute;
export const normalize = path.normalize;
export const parse = path.parse;
export const format = path.format;
export const relative = path.relative;

export default path;

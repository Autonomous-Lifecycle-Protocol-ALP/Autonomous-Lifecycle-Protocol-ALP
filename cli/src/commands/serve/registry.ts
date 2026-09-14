import * as http from 'http';
import { RegistryStore } from '../../registry-store';
import { sendJson, readBody } from './handlers';

export function parseRegistryTokens(tokenArg: string, globalEnv: string): Record<string, string> {
  const out: Record<string, string> = {};

  // globalEnv is only used as a plain wildcard token (no ns=token parsing).
  if (globalEnv && !globalEnv.includes('=')) {
    out['*'] = globalEnv;
  }

  // tokenArg drives the main parsing.
  if (!tokenArg) return out;

  // If tokenArg has no '=' at all, treat the whole thing as a wildcard.
  if (!tokenArg.includes('=')) {
    out['*'] = tokenArg.trim();
    return out;
  }

  // Parse comma-separated namespace=token pairs from tokenArg.
  // Remove the globalEnv wildcard if we have explicit pairs.
  delete out['*'];
  for (const part of tokenArg.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue; // skip entries with no key (empty namespace or missing '=')
    const ns = trimmed.slice(0, idx).trim();
    const tok = trimmed.slice(idx + 1).trim();
    if (ns) out[ns] = tok;
  }

  return out;
}

export function tokenForNamespace(tokens: Record<string, string>, ns: string): string {
  return tokens['@' + ns] || tokens[ns] || tokens['*'] || '';
}

export function authorize(req: http.IncomingMessage, tokens: Record<string, string>, ns: string): boolean {
  if (Object.keys(tokens).length === 0) return true;

  if (ns === '*') {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return false;
    return token === tokens['*'] || Object.values(tokens).includes(token);
  }

  const required = tokenForNamespace(tokens, ns);
  if (!required) return true;

  const auth = req.headers['authorization'] || '';
  return auth === `Bearer ${required}`;
}

export function handleRegistry(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: string,
  store: RegistryStore | null,
  tokens: Record<string, string>,
  method: string,
  signer?: string,
) {
  if (!store) { sendJson(res, { error: 'registry not enabled; start `alp serve --registry`' }, 404); return; }
  const u = new URL('http://x' + url);

  if (method === 'PUT' || method === 'POST') {
    const pub = /^\/api\/registry\/-\/([^/]+)\/([^/]+)$/.exec(url);
    if (pub) {
      const ns = decodeURIComponent(pub[1]);
      if (!authorize(req, tokens, ns)) { sendJson(res, { error: 'unauthorized' }, 401); return; }
      readBody(req).then((body) => {
        try {
          const meta = store.publishFromRequest(body, ns, signer);
          sendJson(res, meta, 201);
        } catch (e: any) {
          sendJson(res, { error: e.message }, 400);
        }
      }).catch(() => sendJson(res, { error: 'bad request body' }, 400));
      return;
    }
  }
  const pathname = u.pathname;

  if (pathname === '/api/registry' || pathname === '/api/registry/') {
    if (!authorize(req, tokens, '*')) { sendJson(res, { error: 'unauthorized' }, 401); return; }
    const q = u.searchParams.get('q');
    sendJson(res, q ? store.search(q) : store.list());
    return;
  }

  const meta = /^\/api\/registry\/-\/([^/]+)\/([^/]+)\/meta\.json$/.exec(url);
  if (meta) {
    const ns = decodeURIComponent(meta[1]);
    if (!authorize(req, tokens, ns)) { sendJson(res, { error: 'unauthorized' }, 401); return; }
    const full = `@${ns}/${decodeURIComponent(meta[2])}`;
    const m = store.getMeta(full);
    if (!m) return sendJson(res, { error: 'not found' }, 404);
    return sendJson(res, m);
  }

  const dl = /^\/api\/registry\/-\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/.exec(url);
  if (dl) {
    const ns = decodeURIComponent(dl[1]);
    if (!authorize(req, tokens, ns)) { sendJson(res, { error: 'unauthorized' }, 401); return; }
    const full = `@${ns}/${decodeURIComponent(dl[2])}`;
    const buf = store.readFile(full, decodeURIComponent(dl[3]), decodeURIComponent(dl[4]));
    if (!buf) return sendJson(res, { error: 'not found' }, 404);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(buf);
    return;
  }

  sendJson(res, { error: 'unknown registry endpoint' }, 404);
}

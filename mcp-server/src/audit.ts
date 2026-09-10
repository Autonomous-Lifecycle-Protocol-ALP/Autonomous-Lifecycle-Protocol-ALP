import * as fs from 'fs';
import * as path from 'path';

/**
 * Append an audit event to `.alp/.runtime/log.jsonl` (v4 Pillar 4 — Audit
 * Trail). Mirrors the CLI runtime event format so `alp serve` shows MCP
 * mutations alongside swarm activity. Best-effort; never throws.
 */
export function audit(
  rootDir: string,
  type: string,
  fields: Record<string, unknown> = {},
): void {
  try {
    const runtimeDir = path.join(rootDir, '.alp', '.runtime');
    if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      source: 'mcp-server',
      pid: process.pid,
      ...fields,
    };
    fs.appendFileSync(
      path.join(runtimeDir, 'log.jsonl'),
      JSON.stringify(entry) + '\n',
      'utf-8',
    );
  } catch {
    /* audit is best-effort */
  }
}

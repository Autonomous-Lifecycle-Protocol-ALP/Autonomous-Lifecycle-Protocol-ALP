import { PolicyEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import * as path from 'path';
import { loadWorkspace } from './workspace';

/**
 * Policy gate for MCP mutation tools (v4 Pillar 4 — Capability Scoping).
 *
 * Evaluates a proposed workspace file write against any @policy objects.
 * Returns an MCP error result when a strict policy blocks it, or null when
 * the action is permitted. The path is made workspace-relative (POSIX) so it
 * matches policy globs like "src/**" or ".alp/**".
 */
export function enforcePolicy(
  rootDir: string,
  targetFile: string,
  agent?: string,
): { content: { type: 'text'; text: string }[]; isError: true } | null {
  const objects = loadWorkspace(rootDir);
  const engine = new PolicyEngine(objects);
  if (engine.count === 0) return null;

  const relative = path
    .relative(rootDir, targetFile)
    .replace(/\\/g, '/');

  // ALP protocol-coordination files under `.alp/` (task creation via
  // delegate/decompose, status updates) are governed by explicit deny rules
  // only — they are not "source code" subject to the allow-list. This lets a
  // policy like allow_paths: [src/**] coexist with normal swarm coordination
  // while still honoring deny_paths (e.g. ".alp/.runtime/**").
  const isProtocolFile = relative === '.alp' || relative.startsWith('.alp/');
  if (isProtocolFile) {
    const denyOnly = engine.evaluateDenyOnly({ kind: 'path', value: relative, agent });
    if (denyOnly.blocked) {
      return {
        content: [
          {
            type: 'text',
            text:
              `⛔ Policy denied: cannot modify '${relative}'.\n` +
              denyOnly.reasons.join('\n'),
          },
        ],
        isError: true,
      };
    }
    return null;
  }

  const decision = engine.evaluate({ kind: 'path', value: relative, agent });

  if (decision.blocked) {
    return {
      content: [
        {
          type: 'text',
          text:
            `⛔ Policy denied: cannot modify '${relative}'.\n` +
            decision.reasons.join('\n'),
        },
      ],
      isError: true,
    };
  }
  return null;
}

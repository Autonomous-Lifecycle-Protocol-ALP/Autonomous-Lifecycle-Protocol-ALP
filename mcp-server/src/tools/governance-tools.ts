import { PolicyEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import { PolicyEnforcer } from '@autonomous-lifecycle-protocol-alp/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';

export const toolDefinitions = [
  {
    name: 'alp_check_policy',
    description: 'Check whether a file path or shell command is permitted under workspace @policy guardrails.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path to check' },
        command: { type: 'string', description: 'Shell command to check' },
        agent: { type: 'string', description: 'Agent ID to scope policy check' },
        cwd: { type: 'string' }
      }
    }
  },
  {
    name: 'alp_visualize',
    description: 'Render @workflow objects as Mermaid or JSON diagrams.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Optional workflow ID' },
        format: { type: 'string', description: 'Format: mermaid, json (default mermaid)' },
        cwd: { type: 'string' }
      }
    }
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_check_policy': {
      const targetPath = args?.path as string | undefined;
      const targetCommand = args?.command as string | undefined;
      const targetAgent = args?.agent as string | undefined;
      const govern = Boolean(args?.govern);
      const objects = loadWorkspace(cwd);
      const engine = new PolicyEngine(objects);
      let decision: any = { allowed: true, blocked: false, reasons: ['No policy rules matched'], policies: [] as string[] };

      if (targetPath) {
        decision = engine.evaluate({ kind: 'path', value: targetPath, agent: targetAgent });
      } else if (targetCommand) {
        decision = engine.evaluate({ kind: 'command', value: targetCommand, agent: targetAgent });
      } else if (govern || (!targetPath && !targetCommand)) {
        const enforcer = new PolicyEnforcer({ requiredFields: ['id', '_type'] });
        const workspaceWrapper = { objects } as any;
        const result = enforcer.govern(workspaceWrapper);
        decision = {
          governance: result,
          allowed: result.compliant,
          blocked: !result.compliant,
          reasons: result.compliant ? ['Workspace is fully policy compliant'] : [`${result.violations.length} policy violations found`],
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(decision, null, 2) }],
        isError: Boolean(decision.blocked),
      };
    }

    case 'alp_visualize': {
      const objects = loadWorkspace(cwd);
      const targetId = args?.id as string | undefined;
      const format = (args?.format as string) || 'mermaid';
      const workflows = objects.filter((o) => o._type === 'workflow');
      const filtered = targetId ? workflows.filter((w) => w.id === targetId) : workflows;

      if (filtered.length === 0) {
        return {
          content: [{ type: 'text', text: 'No matching @workflow objects found.' }],
        };
      }

      if (format === 'json') {
        return {
          content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
        };
      }

      const mermaidLines = ['graph TD'];
      for (const wf of filtered) {
        const steps = (wf as any).steps || [];
        for (const s of steps) {
          mermaidLines.push(`  ${s.id || s}["${s.name || s.id || s}"]`);
          if (s.next) {
            const nexts = Array.isArray(s.next) ? s.next : [s.next];
            for (const n of nexts) mermaidLines.push(`  ${s.id} --> ${n}`);
          }
        }
      }

      return {
        content: [{ type: 'text', text: mermaidLines.join('\n') }],
      };
    }

    default:
      return null;
  }
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AlpObject, AlpGraph } from '@autonomous-lifecycle-protocol-alp/parser';
import { PolicyEnforcer } from '@autonomous-lifecycle-protocol-alp/sdk';
import { loadWorkspace } from './workspace';
import * as fs from 'fs';
import * as path from 'path';

export function listPromptsHandler(server: Server) {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'triage',
        description: 'Analyze the current project state and suggest a triage plan for blocked and high-priority tasks.',
        arguments: [
          { name: 'focus', description: 'Optional focus area (e.g. "blocked", "critical")', required: false },
        ],
      },
      {
        name: 'standup',
        description: 'Generate a daily standup summary from recent task activity and status changes.',
        arguments: [
          { name: 'since', description: 'ISO timestamp to filter events from (e.g. "2026-07-20T00:00:00Z")', required: false },
        ],
      },
      {
        name: 'retrospective',
        description: 'Generate a sprint retrospective summary from completed tasks, failures, and handoffs.',
        arguments: [
          { name: 'sprint', description: 'Sprint identifier or date range', required: false },
        ],
      },
      {
        name: 'alp_delegate_task',
        description: 'Standardized prompt for delegating a task to a specialized sub-agent with context.',
        arguments: [
          { name: 'title', description: 'Task title', required: true },
          { name: 'agent', description: 'Target sub-agent identifier', required: false },
          { name: 'context', description: 'Execution context', required: false },
        ],
      },
      {
        name: 'alp_review_workspace',
        description: 'Standardized prompt for running autonomous audit and code review over workspace objects.',
        arguments: [
          { name: 'cwd', description: 'Working directory', required: false },
        ],
      },
      {
        name: 'alp_diagnose_failure',
        description: 'Standardized prompt for analyzing failed tasks and recommending self-healing actions.',
        arguments: [
          { name: 'taskId', description: 'Failed task ID', required: false },
        ],
      },
    ],
  }));
}

export function getPromptHandler(server: Server) {
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const promptName = request.params.name;
    const args = request.params.arguments || {};
    const objects = loadWorkspace(args.cwd as string || process.cwd());

    switch (promptName) {
      case 'triage': {
        const focus = (args.focus as string) || '';
        const blocked = objects.filter((o) => o.status === '[!]');
        const critical = objects.filter((o) => (o as any).priority === 'critical');
        const todo = objects.filter((o) => o.status === '[ ]');
        let lines = [
          '# Triage Report',
          '',
          `Total objects: ${objects.length}`,
          `Blocked: ${blocked.length}`,
          `Todo: ${todo.length}`,
          `Critical priority: ${critical.length}`,
          '',
        ];
        if (focus) {
          lines.push(`## Focus: ${focus}`);
          if (focus === 'blocked') {
            for (const b of blocked.slice(0, 10)) {
              lines.push(`- **${b.id}**: ${b.description || '(no description)'}`);
            }
          } else if (focus === 'critical') {
            for (const c of critical.slice(0, 10)) {
              lines.push(`- **${c.id}**: ${c.description || '(no description)'}`);
            }
          }
        } else {
          lines.push('## Blocked Tasks');
          if (blocked.length === 0) lines.push('No blocked tasks.');
          else for (const b of blocked.slice(0, 10)) lines.push(`- **${b.id}**: ${b.description || '(no description)'}`);
          lines.push('');
          lines.push('## Next Available');
          for (const t of todo.slice(0, 5)) lines.push(`- **${t.id}**: ${t.description || '(no description)'}`);
        }
        return {
          messages: [
            { role: 'user', content: { type: 'text', text: lines.join('\n') } },
          ],
        };
      }

      case 'standup': {
        const since = (args.since as string) || new Date(Date.now() - 86400000).toISOString();
        const eventsPath = path.join(args.cwd as string || process.cwd(), '.alp', '.runtime', 'log.jsonl');
        let recent: any[] = [];
        if (fs.existsSync(eventsPath)) {
          const raw = fs.readFileSync(eventsPath, 'utf-8');
          for (const line of raw.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const evt = JSON.parse(trimmed);
              if (evt.timestamp >= since) recent.push(evt);
            } catch { /* skip */ }
          }
        }
        const taskStatusChanges = recent.filter((e) => e.type === 'task_status');
        const claims = recent.filter((e) => e.type === 'task_claim');
        const completions = recent.filter((e) => e.type === 'task_status' && e.status === '[x]');
        const lines = [
          '# Daily Standup',
          '',
          `Period: ${since} to now`,
          '',
          `## Activity`,
          `- Events: ${recent.length}`,
          `- Claims: ${claims.length}`,
          `- Status changes: ${taskStatusChanges.length}`,
          `- Completions: ${completions.length}`,
          '',
          '## Recent Status Changes',
          ...taskStatusChanges.slice(-10).map((e) => `- **${e.task_id || 'unknown'}**: ${e.status || ''} (${e.agent || 'unknown agent'})`),
          '',
          '## Completed Tasks',
          ...completions.slice(-10).map((e) => `- **${e.task_id}**`),
        ];
        return {
          messages: [
            { role: 'user', content: { type: 'text', text: lines.join('\n') } },
          ],
        };
      }

      case 'retrospective': {
        const eventsPath2 = path.join(args.cwd as string || process.cwd(), '.alp', '.runtime', 'log.jsonl');
        let allEvents: any[] = [];
        if (fs.existsSync(eventsPath2)) {
          const raw = fs.readFileSync(eventsPath2, 'utf-8');
          for (const line of raw.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try { allEvents.push(JSON.parse(trimmed)); } catch { /* skip */ }
          }
        }
        const completed = allEvents.filter((e) => e.type === 'task_status' && e.status === '[x]');
        const failed = allEvents.filter((e) => e.type === 'task_status' && e.status === '[!]');
        const handoffs = allEvents.filter((e) => e.type === 'human_handoff' || (e.type === 'task_status' && e.status === '[?]'));
        const failedTasks = [...new Set(failed.map((e) => e.task_id).filter(Boolean))];
        const handoffTasks = [...new Set(handoffs.map((e) => e.task_id).filter(Boolean))];
        const lines2 = [
          '# Sprint Retrospective',
          '',
          `Total events analyzed: ${allEvents.length}`,
          '',
          '## Summary',
          `- Completed: ${completed.length}`,
          `- Failed: ${failed.length}`,
          `- Human handoffs: ${handoffs.length}`,
          '',
          '## Failure Hotspots',
          ...failedTasks.map((tid) => `- **${tid}**`),
          '',
          '## Handoff Points',
          ...handoffTasks.map((tid) => `- **${tid}**`),
          '',
          '## Recommendations',
          ...failedTasks.length
            ? ['- Review failed tasks for common blockers.', '- Consider breaking down large tasks.']
            : ['- No failures detected. Good momentum!'],
          ...handoffs.length
            ? ['- Reduce human handoffs by clarifying task acceptance criteria.']
            : [],
        ];
        return {
          messages: [
            { role: 'user', content: { type: 'text', text: lines2.join('\n') } },
          ],
        };
      }

      case 'alp_delegate_task': {
        const title = (args.title as string) || 'Untitled Task';
        const agent = (args.agent as string) || 'agent-developer';
        const context = (args.context as string) || 'No additional context provided.';
        const promptText =
          `# Delegate Task Prompt\n\n` +
          `**Task Title:** ${title}\n` +
          `**Assigned Agent:** ${agent}\n` +
          `**Context:** ${context}\n\n` +
          `Please create a corresponding @task ALP object, check policies, and execute sub-agent assignment.`;
        return {
          messages: [{ role: 'user', content: { type: 'text', text: promptText } }],
        };
      }

      case 'alp_review_workspace': {
        const enforcer = new PolicyEnforcer({ requiredFields: ['id', '_type'] });
        const result = enforcer.govern({ objects } as any);
        const promptText =
          `# Workspace Review Prompt\n\n` +
          `**Objects Scanned:** ${result.objectsScanned}\n` +
          `**Compliant:** ${result.compliant}\n` +
          `**Violations:** ${result.violations.join(', ') || 'None'}\n\n` +
          `Review workspace architecture, topology, and policy compliance.`;
        return {
          messages: [{ role: 'user', content: { type: 'text', text: promptText } }],
        };
      }

      case 'alp_diagnose_failure': {
        const taskId = args.taskId as string | undefined;
        const failed = objects.filter(o => o.status === '[!]');
        const target = taskId ? objects.find(o => o.id === taskId) : failed[0];
        const promptText =
          `# Task Failure Diagnosis Prompt\n\n` +
          `**Target Task:** ${target?.id || taskId || 'None specified'}\n` +
          `**Status:** ${target?.status || 'Unknown'}\n` +
          `**Description:** ${target?.description || 'N/A'}\n\n` +
          `Diagnose root cause and recommend automated self-healing repair steps.`;
        return {
          messages: [{ role: 'user', content: { type: 'text', text: promptText } }],
        };
      }

      default:
        return {
          messages: [{ role: 'user', content: { type: 'text', text: `Prompt "${promptName}" not found.` } }],
          isError: true,
        };
    }
  });
}

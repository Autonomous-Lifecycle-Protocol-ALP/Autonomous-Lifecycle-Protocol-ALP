import { AutonomyController, SelfHealingEngine, IntelligenceEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';

export const toolDefinitions = [
  {
    name: 'alp_autonomy_run',
    description: 'Start an autonomous swarm run for a workflow (v45.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        workflow: { type: 'string', description: 'Workflow ID to run' },
      },
      required: ['workflow'],
    },
  },
  {
    name: 'alp_autonomy_heal',
    description: 'Run self-healing diagnostics and auto-patch ALP workspace (v45.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
      },
    },
  },
  {
    name: 'alp_autonomy_predict',
    description: 'Predict outcome of a workflow based on current state (v45.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        workflow: { type: 'string', description: 'Workflow ID to predict' },
      },
      required: ['workflow'],
    },
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_autonomy_run': {
      const { AutonomyController } = require('@autonomous-lifecycle-protocol-alp/parser');
      const controller = new AutonomyController();
      const workflowId = args?.workflow as string;
      const objects = loadWorkspace(cwd);
      const workflow = objects.find((o) => o._type === 'workflow' && o.id === workflowId);
      if (!workflow) {
        return {
          content: [{ type: 'text', text: `Error: Workflow "${workflowId}" not found.` }],
          isError: true,
        };
      }
      const run = controller.startSwarm(workflowId, workflow);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            swarm_id: run.swarm_id,
            status: run.status,
            started_at: run.started_at,
            workflow_id: workflowId,
          }, null, 2),
        }],
      };
    }

    case 'alp_autonomy_heal': {
      const { SelfHealingEngine } = require('@autonomous-lifecycle-protocol-alp/parser');
      const engine = new SelfHealingEngine();
      const alpDir = path.join(cwd, '.alp');
      let totalPatches = 0;
      let appliedPatches = 0;
      const results: any[] = [];
      if (fs.existsSync(alpDir)) {
        fs.readdirSync(alpDir).forEach((file) => {
          if (file.endsWith('.alp')) {
            const fullPath = path.join(alpDir, file);
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              const patches = engine.generatePatches(content, file);
              totalPatches += patches.length;
              for (const p of patches) {
                if (p.applied) appliedPatches++;
              }
              results.push({ file, patches: patches.length, applied: patches.filter((pp: any) => pp.applied).length });
            } catch {
              // skip
            }
          }
        });
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total_patches: totalPatches,
            applied_patches: appliedPatches,
            skipped_patches: totalPatches - appliedPatches,
            files: results,
          }, null, 2),
        }],
      };
    }

    case 'alp_autonomy_predict': {
      const { IntelligenceEngine } = require('@autonomous-lifecycle-protocol-alp/parser');
      const engine = new IntelligenceEngine();
      const workflowId = args?.workflow as string;
      const objects = loadWorkspace(cwd);
      const result = engine.predictOutcome(workflowId, objects);
      if (!result) {
        return {
          content: [{ type: 'text', text: `Error: Workflow "${workflowId}" not found.` }],
          isError: true,
        };
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            target: result.object_id,
            predicted_status: result.predicted_status,
            confidence: result.confidence,
            risk_factors: result.risk_factors,
            estimated_completion_ms: result.estimated_completion_ms,
          }, null, 2),
        }],
      };
    }

    default:
      return null;
  }
}

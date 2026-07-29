import * as fs from 'fs';
import * as path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';
import { AutonomyController, WorkflowMutator, AdaptiveEngine } from '@autonomous-lifecycle-protocol-alp/parser';

interface AutonomyOptions {
  cwd?: string;
  workflow?: string;
  swarm?: string;
  signal?: string;
}

function loadObjects(cwd: string) {
  const alpDir = path.resolve(cwd, '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }
  const parser = new AlpParser();
  const objects: any[] = [];
  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (fullPath.endsWith('.alp')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          objects.push(...parser.parse(content));
        } catch {
          // skip unparseable files
        }
      }
    }
  };
  walk(alpDir);
  return objects;
}

export function autonomyCommand(subcommand: string, options: AutonomyOptions = {}) {
  const cwd = options.cwd || process.cwd();
  const objects = loadObjects(cwd);
  const { AutonomyController, WorkflowMutator, AdaptiveEngine } = require('@autonomous-lifecycle-protocol-alp/parser');
  const controller = new AutonomyController();

  switch (subcommand) {
    case 'run': {
      const workflowId = options.workflow || 'default';
      const workflow = objects.find((o) => o._type === 'workflow' && o.id === workflowId);
      if (!workflow) {
        console.error(`Error: Workflow "${workflowId}" not found.`);
        process.exit(1);
      }
      const run = controller.startSwarm(workflowId, workflow);
      console.log('\n Autonomy Run Started\n');
      console.log(`  Swarm ID:  ${run.swarm_id}`);
      console.log(`  Status:    ${run.status}`);
      console.log(`  Started:   ${run.started_at}`);
      console.log(`  Workflow:  ${workflowId}`);
      console.log('');
      break;
    }

    case 'heal': {
      const { SelfHealingEngine } = require('@autonomous-lifecycle-protocol-alp/parser');
      const engine = new SelfHealingEngine();
      const alpDir = path.resolve(cwd, '.alp');
      let totalPatches = 0;
      let appliedPatches = 0;
      fs.readdirSync(alpDir, { withFileTypes: true }).forEach((entry) => {
        if (entry.name.endsWith('.alp')) {
          const fullPath = path.join(alpDir, entry.name);
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const patches = engine.generatePatches(content, entry.name);
            totalPatches += patches.length;
            for (const p of patches) {
              if (p.applied) appliedPatches++;
            }
          } catch {
            // skip
          }
        }
      });
      console.log('\n Self-Healing Report\n');
      console.log(`  Total patches:    ${totalPatches}`);
      console.log(`  Applied patches:  ${appliedPatches}`);
      console.log(`  Skipped patches:  ${totalPatches - appliedPatches}`);
      console.log('');
      break;
    }

    case 'predict': {
      const taskId = options.workflow;
      if (!taskId) {
        console.error('Error: --workflow <id> is required for predict.');
        process.exit(1);
      }
      const { IntelligenceEngine } = require('@autonomous-lifecycle-protocol-alp/parser');
      const engine = new IntelligenceEngine();
      const result = engine.predictOutcome(taskId, objects);
      if (!result) {
        console.error(`Error: Task/workflow "${taskId}" not found.`);
        process.exit(1);
      }
      console.log('\n Autonomy Prediction\n');
      console.log(`  Target:       ${result.object_id}`);
      console.log(`  Predicted:    ${result.predicted_status}`);
      console.log(`  Confidence:   ${(result.confidence * 100).toFixed(0)}%`);
      if (result.risk_factors.length > 0) {
        console.log('\n  Risk Factors:');
        for (const rf of result.risk_factors) {
          console.log(`    - ${rf}`);
        }
      }
      if (result.estimated_completion_ms) {
        const days = Math.ceil(result.estimated_completion_ms / 86400000);
        console.log(`\n  Est. completion: ~${days} day(s) from now.`);
      }
      console.log('');
      break;
    }

    case 'observe': {
      const signalType = options.signal || 'latency';
      const signals = {
        latency: { kind: 'latency', p99: 450, rps: 120 },
        error_rate: { kind: 'error_rate', rate: 0.05 },
        throughput: { kind: 'throughput', rps: 85 },
      };
      const signal = signals[signalType as keyof typeof signals] || signals.latency;
      controller.observeSignal('default', signal);
      const tuning = controller.adaptive.getTuning('retry.max_attempts');
      console.log('\n Adaptive Signal Observed\n');
      console.log(`  Signal type:  ${signal.kind}`);
      console.log(`  Tuning key:   retry.max_attempts`);
      console.log(`  Tuned value:  ${tuning}`);
      console.log('');
      break;
    }

    case 'mutate': {
      const workflowId = options.workflow || 'default';
      const edits = [{ op: 'update', target: 'status', value: '[x]' }];
      const proposal = controller.proposeMutation(workflowId, edits, 'Auto-heal: mark workflow complete');
      if (!proposal) {
        console.error(`Error: Swarm "${workflowId}" not found.`);
        process.exit(1);
      }
      console.log('\n Mutation Proposed\n');
      console.log(`  Proposal ID:  ${proposal.proposal_id}`);
      console.log(`  Status:       ${proposal.status}`);
      console.log(`  Rationale:    ${proposal.rationale}`);
      console.log('');
      break;
    }

    case 'decisions': {
      const swarmId = options.swarm;
      const decisions = controller.getDecisions(swarmId);
      if (decisions.length === 0) {
        console.log('\n No decisions recorded.\n');
        break;
      }
      console.log('\n Autonomy Decisions\n');
      for (const d of decisions) {
        console.log(`  [${d.kind}] ${d.swarm_id} — ${d.timestamp}`);
        if (d.rationale) console.log(`    Rationale: ${d.rationale}`);
        if (d.reason) console.log(`    Reason: ${d.reason}`);
        console.log('');
      }
      break;
    }

    default:
      console.error(`Unknown autonomy subcommand: ${subcommand}`);
      console.error('Available: run, heal, predict, observe, mutate, decisions');
      process.exit(1);
  }
}
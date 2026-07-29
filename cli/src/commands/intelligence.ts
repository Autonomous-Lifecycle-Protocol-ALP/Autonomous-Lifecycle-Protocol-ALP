import * as fs from 'fs';
import * as path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

interface IntelligenceOptions {
  cwd?: string;
  error?: string;
  taskId?: string;
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

export function intelligenceCommand(subcommand: string, options: IntelligenceOptions = {}) {
  const cwd = options.cwd || process.cwd();
  const objects = loadObjects(cwd);
  const { IntelligenceEngine } = require('@autonomous-lifecycle-protocol-alp/parser');
  const engine = new IntelligenceEngine();

  switch (subcommand) {
    case 'suggest': {
      const suggestions = engine.suggestNext(objects);
      if (suggestions.length === 0) {
        console.log('No suggestions — workspace looks complete.');
        return;
      }
      console.log('\n Intelligence Suggestions\n');
      for (const s of suggestions) {
        console.log(`  [${(s.confidence * 100).toFixed(0)}%] ${s.label}`);
        console.log(`    ${s.description}`);
        console.log('');
      }
      break;
    }

    case 'diagnose': {
      const error = options.error || 'Unknown error';
      const result = engine.diagnose(error);
      console.log('\n Diagnosis Result\n');
      console.log(`  Error:    ${result.error}`);
      console.log(`  Cause:    ${result.likely_cause}`);
      console.log(`  Severity: ${result.severity}`);
      console.log('\n  Suggestions:');
      for (const s of result.suggestions) {
        console.log(`    - ${s}`);
      }
      console.log('');
      break;
    }

    case 'predict': {
      const taskId = options.taskId;
      if (!taskId) {
        console.error('Error: --task-id is required for predict.');
        process.exit(1);
      }
      const result = engine.predictOutcome(taskId, objects);
      if (!result) {
        console.error(`Error: Task "${taskId}" not found.`);
        process.exit(1);
      }
      console.log('\n Prediction Result\n');
      console.log(`  Task:       ${result.object_id}`);
      console.log(`  Predicted:  ${result.predicted_status}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      if (result.risk_factors.length > 0) {
        console.log('\n  Risk Factors:');
        for (const rf of result.risk_factors) {
          console.log(`    - ${rf}`);
        }
      }
      if (result.estimated_completion_ms) {
        const days = Math.ceil(result.estimated_completion_ms / 86400000);
        console.log(`\n  Est. completion: ~${days} day(s) from now (if unblocked).`);
      }
      console.log('');
      break;
    }

    case 'review': {
      const findings = engine.review(objects);
      if (findings.length === 0) {
        console.log('Review clean — no issues found.');
        return;
      }
      console.log('\n Code Review Findings\n');
      for (const f of findings) {
        const icon = f.severity === 'error' ? '❌' : f.severity === 'warn' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} [${f.kind}] ${f.object_id}: ${f.message}`);
        if (f.suggestion) {
          console.log(`      Suggestion: ${f.suggestion}`);
        }
      }
      console.log(`\nTotal findings: ${findings.length}`);
      break;
    }

    default:
      console.error(`Unknown intelligence subcommand: ${subcommand}`);
      console.error('Available: suggest, diagnose, predict, review');
      process.exit(1);
  }
}

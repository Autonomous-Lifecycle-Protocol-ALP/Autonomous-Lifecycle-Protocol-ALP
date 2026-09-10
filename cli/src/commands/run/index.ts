import * as fs from 'fs';
import * as path from 'path';
import {
  AlpParser,
  AlpObject,
  LockManager,
  LoopEngine,
  LoopStage,
} from '@autonomous-lifecycle-protocol-alp/parser';
import { createProvider } from '../../llm-provider';
import { buildContextBundle } from './context-builder';
import { loadAlpDirectory, extractDependencies, releaseOnExit } from './workspace-loader';
import { runSwarmMode, runNetworkedSwarm } from './swarm-runner';
import type { RunOptions } from './run-command';

export interface RunCommandOptions extends RunOptions {}

export function runCommand(taskId?: string, options?: RunOptions) {
  const alpDir = path.resolve(process.cwd(), '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  if (options?.swarm) {
    runNetworkedSwarm(options, alpDir).catch(err => {
       console.error("Networked Swarm Error:", err);
       process.exit(1);
    });
    return;
  }

  if (options?.concurrent && options.concurrent > 1) {
    runSwarmMode(options, alpDir).catch(err => {
       console.error("Swarm Mode Error:", err);
       process.exit(1);
    });
    return;
  }

  const parser = new AlpParser();
  const allObjects: AlpObject[] = [];
  loadAlpDirectory(alpDir, parser, allObjects);

  if (allObjects.length === 0) {
    console.error('Error: No ALP objects found in .alp directory.');
    process.exit(1);
  }

  let targetTask: AlpObject | null = null;

  if (taskId) {
    targetTask = allObjects.find(
      (obj) => obj._type === 'task' && obj.id === taskId
    ) || null;
    if (!targetTask) {
      targetTask = allObjects.find(
        (obj) => obj.id && obj.id.includes(taskId)
      ) || null;
    }
    if (!targetTask) {
      console.error(`Error: Task "${taskId}" not found in workspace.`);
      process.exit(1);
    }
  } else {
    const tasks = allObjects.filter((obj) => obj._type === 'task');
    const doneIds = new Set(
      allObjects
        .filter((obj) => obj.status === '[x]' || obj.status === 'done')
        .map((obj) => obj.id)
    );

    const lockManager = new LockManager(process.cwd());
    lockManager.cleanup();
    const lockedIds = lockManager.getLockedTaskIds();

    for (const task of tasks) {
      if (task.status === '[ ]' || task.status === 'todo') {
        if (lockedIds.has(task.id as string)) continue;
        const deps = extractDependencies(task);
        const allDepsMet = deps.every((d) => doneIds.has(d));
        if (allDepsMet) {
          targetTask = task;
          const agentId = options?.agent || 'default-agent';
          const claimed = lockManager.claim(task.id as string, agentId);
          if (!claimed) continue;
          releaseOnExit(lockManager, task.id as string);
          break;
        }
      }
    }

    if (!targetTask) {
      console.log('[OK] No actionable tasks found. All tasks are either done or blocked.');
      return;
    }
  }

  const project = allObjects.find((obj) => obj._type === 'project');
  const agent = options?.agent
    ? allObjects.find((obj) => obj._type === 'agent' && obj.id === options.agent)
    : allObjects.find(
        (obj) => obj._type === 'agent' && obj.id === (targetTask as any).owner?.replace('-> ', '')
      ) || allObjects.find((obj) => obj._type === 'agent');

  const memories = allObjects.filter((obj) => obj._type === 'memory');
  const rules = allObjects.filter((obj) => obj._type === 'rule');
  const decisions = allObjects.filter(
    (obj) => obj._type === 'decision' && obj.status === '[x]'
  );

  const contextBundle = buildContextBundle(
    targetTask,
    project || null,
    agent || null,
    memories,
    rules,
    decisions,
    allObjects
  );

  if (options?.dryRun) {
    console.log('\n[SCAN] DRY RUN — Context Bundle for Task Execution\n');
    console.log('═'.repeat(60));
    console.log(contextBundle);
    console.log('═'.repeat(60));
    console.log('\nTo execute this task, remove the --dry-run flag.');
  } else if (options?.provider) {
    console.log(`\n[START] ALP Execution Engine — Powered by ${options.provider.toUpperCase()}\n`);
    const llm = createProvider(options.provider, options.model);

    const loop = new LoopEngine({
      maxIterations: 3,
      completionConditions: ['Task verified successfully'],
    });

    loop.on((event) => {
      if (event.type === 'stage_enter') {
        console.log(`[Loop] Iteration ${event.iteration} — Entering stage: ${event.stage}`);
      } else if (event.type === 'completed') {
        console.log(`[OK] Task ${(targetTask as any).id} completed successfully in ${event.iteration} iterations!`);
      } else if (event.type === 'failed') {
        console.error(`[FAIL] Task execution failed:`, event.data);
      }
    });

    loop.run(async (stage: LoopStage, iteration: number) => {
      const messages = [
        { role: 'system' as const, content: 'You are an autonomous AI agent following the ALP protocol. Execute the given stage.' },
        { role: 'user' as const, content: `Context:\n${contextBundle}\n\nCurrent Stage: ${stage}\nIteration: ${iteration}\nPlease execute this stage.` }
      ];

      console.log(`[LLM] Requesting completion for stage ${stage}...`);
      const response = await llm.chat(messages);
      console.log(`[LLM] Response received (${response.length} chars).`);

      if (stage === 'test') {
         return true;
      }
      return false;
    }).catch(err => {
      console.error('Execution error:', err);
    });

  } else {
    console.log('\n[START] ALP Execution Engine\n');
    console.log(`  Task:    ${(targetTask as any).id}`);
    console.log(`  Type:    @${(targetTask as any)._type}`);
    console.log(`  Agent:   ${agent ? (agent as any).id : 'default'}`);
    console.log(`  Status:  ${(targetTask as any).status || '[ ]'}`);
    console.log('');
    console.log('═'.repeat(60));
    console.log('[LIST] CONTEXT BUNDLE (pass to your LLM agent)');
    console.log('═'.repeat(60));
    console.log(contextBundle);
    console.log('═'.repeat(60));
    console.log('');
    console.log('[TIP] Integration: Pipe this output to your agent:');
    console.log('   alp run --task "' + (targetTask as any).id + '" | claude-code');
    console.log('   alp run --task "' + (targetTask as any).id + '" | cursor-agent');
    console.log('\n[TIP] Native Execution: Run with --provider to execute natively:');
    console.log('   alp run --provider openai --model gpt-4o');
  }
}

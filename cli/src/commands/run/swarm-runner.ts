import * as fs from 'fs';
import * as path from 'path';
import { AlpParser, AlpObject, LockManager, LoopEngine, LoopStage, SwarmClient } from '@autonomous-lifecycle-protocol-alp/parser';
import { createProvider } from '../../llm-provider';
import { logEvent } from '../../runtime';
import { buildContextBundle } from './context-builder';
import { loadAlpDirectory, extractDependencies, updateTaskStatusOnFile } from './workspace-loader';
import { RunOptions } from './run-command';

export async function runSwarmMode(options: RunOptions, alpDir: string) {
  const numWorkers = options.concurrent || 1;
  console.log(`\n🐝 Starting ALP Swarm Orchestrator with ${numWorkers} concurrent workers...\n`);

  logEvent(alpDir, 'run_start', { message: `Swarm started with ${numWorkers} workers` });

  const lockManager = new LockManager(process.cwd());
  const purged = lockManager.cleanup();
  if (purged > 0) {
    console.log(`[CLEAN] Cleared ${purged} stale lock(s) from previous runs.`);
  }
  const parser = new AlpParser();

  const workers = Array.from({ length: numWorkers }).map(async (_, workerId) => {
    const id = workerId + 1;
    let idleCount = 0;

    while (true) {
      const allObjects: AlpObject[] = [];
      loadAlpDirectory(alpDir, parser, allObjects);

      const tasks = allObjects.filter((obj) => obj._type === 'task');
      const doneIds = new Set(
        allObjects
          .filter((obj) => obj.status === '[x]' || obj.status === 'done')
          .map((obj) => obj.id)
      );

      const allTasksDone = tasks.every(t => doneIds.has(t.id));
      if (allTasksDone) {
        console.log(`[Worker ${id}] [FINISH] All tasks completed! Shutting down.`);
        break;
      }

      const lockedIds = lockManager.getLockedTaskIds();

      let targetTask: AlpObject | null = null;
      for (const task of tasks) {
        if (task.status === '[ ]' || task.status === 'todo') {
          if (lockedIds.has(task.id as string)) continue;

          const deps = extractDependencies(task);
          const allDepsMet = deps.every((d) => doneIds.has(d));

          if (allDepsMet) {
            targetTask = task;
            const agentId = options.agent || `worker-${id}`;
            const claimed = lockManager.claim(task.id as string, agentId);
            if (claimed) {
              break;
            } else {
              targetTask = null;
            }
          }
        }
      }

      if (!targetTask) {
        const pendingTasks = tasks.some(t => t.status === '[ ]' || t.status === 'todo');
        if (pendingTasks) {
          idleCount++;
          if (idleCount % 10 === 0) {
            console.log(`[Worker ${id}] ⏳ Waiting for dependencies to unblock...`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          console.log(`[Worker ${id}] [STOP] No actionable tasks found and none pending. Exiting.`);
          break;
        }
      }

      idleCount = 0;
      console.log(`\n[Worker ${id}] [START] Claimed task: ${targetTask.id}`);
      logEvent(alpDir, 'task_claim', {
        task_id: targetTask.id as string,
        worker: id,
        agent: options.agent || `worker-${id}`,
      });

      const project = allObjects.find((obj) => obj._type === 'project');
      const agent = allObjects.find((obj) => obj._type === 'agent' && obj.id === (targetTask as any).owner?.replace('-> ', ''))
        || allObjects.find((obj) => obj._type === 'agent');
      const memories = allObjects.filter((obj) => obj._type === 'memory');
      const rules = allObjects.filter((obj) => obj._type === 'rule');
      const decisions = allObjects.filter((obj) => obj._type === 'decision' && obj.status === '[x]');

      const contextBundle = buildContextBundle(targetTask, project || null, agent || null, memories, rules, decisions, allObjects);

      if (options.dryRun) {
        console.log(`[Worker ${id}] [SCAN] DRY RUN: Simulating execution of ${targetTask.id}...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`[Worker ${id}] [OK] Simulated completion of ${targetTask.id}.`);
        updateTaskStatusOnFile(targetTask.id as string, '[x]', alpDir);
        logEvent(alpDir, 'task_status', { task_id: targetTask.id as string, status: '[x]', worker: id, message: 'dry-run complete' });
        lockManager.release(targetTask.id as string);
        logEvent(alpDir, 'task_release', { task_id: targetTask.id as string, worker: id });
        continue;
      }

      if (options.provider) {
        const llm = createProvider(options.provider, options.model);
        const loop = new LoopEngine({
          maxIterations: 3,
          completionConditions: ['Task verified successfully'],
        });

        loop.on((event) => {
          if (event.type === 'stage_enter') {
            console.log(`[Worker ${id} | ${targetTask!.id}] Iteration ${event.iteration} — ${event.stage}`);
          }
        });

        let success = false;
        try {
          const result = await loop.run(async (stage: LoopStage, iteration: number) => {
            const messages = [
              { role: 'system' as const, content: 'You are an autonomous AI agent following the ALP protocol.' },
              { role: 'user' as const, content: `Context:\n${contextBundle}\n\nCurrent Stage: ${stage}\nExecute this stage.` }
            ];
            await llm.chat(messages);
            return stage === 'test';
          });
          success = result.status === 'completed';
        } catch (e) {
          console.error(`[Worker ${id} | ${targetTask!.id}] Execution error:`, e);
        }

        if (success) {
          console.log(`[Worker ${id}] [OK] Task ${targetTask.id} completed successfully.`);
          updateTaskStatusOnFile(targetTask.id as string, '[x]', alpDir);
          logEvent(alpDir, 'task_status', { task_id: targetTask.id as string, status: '[x]', worker: id });
        } else {
          console.log(`[Worker ${id}] [FAIL] Task ${targetTask.id} failed verification.`);
          updateTaskStatusOnFile(targetTask.id as string, '[!]', alpDir);
          logEvent(alpDir, 'task_status', { task_id: targetTask.id as string, status: '[!]', worker: id, message: 'failed verification' });
        }
        lockManager.release(targetTask.id as string);
        logEvent(alpDir, 'task_release', { task_id: targetTask.id as string, worker: id });
      } else {
        console.log(`[Worker ${id}] No provider specified. Outputting context and exiting worker.`);
        console.log(contextBundle);
        lockManager.release(targetTask.id as string);
        break;
      }
    }
  });

  await Promise.all(workers);
  logEvent(alpDir, 'run_end', { message: 'Swarm execution complete' });
  console.log(`\n[DONE] Swarm Execution Complete!`);
}

export async function runNetworkedSwarm(options: RunOptions, alpDir: string) {
  const swarmId = options.swarm as string;
  const cfg = resolveSwarmConfig(alpDir, swarmId, process.env.ALP_SWARM_COORDINATOR, process.env.ALP_SWARM_TOKEN);
  const client = new SwarmClient(cfg);
  const node = await client.join();
  console.log(`\n[NET] Joined networked swarm "${swarmId}" as node "${node.node_id}".`);

  let currentClaim: string | null = null;
  const stop = client.startHeartbeat(() => currentClaim);
  const cleanup = () => { stop(); client.leave().catch(() => {}); };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  const parser = new AlpParser();
  const lockManager = new LockManager(process.cwd());
  lockManager.cleanup();

  while (true) {
    const allObjects: AlpObject[] = [];
    loadAlpDirectory(alpDir, parser, allObjects);
    const tasks = allObjects.filter((obj) => obj._type === 'task');
    const doneIds = new Set(
      allObjects.filter((obj) => obj.status === '[x]' || obj.status === 'done').map((obj) => obj.id)
    );
    if (tasks.every((t) => doneIds.has(t.id))) {
      console.log(`[${node.node_id}] [FINISH] All tasks completed. Leaving swarm.`);
      break;
    }
    let target: AlpObject | null = null;
    for (const task of tasks) {
      if (task.status === '[ ]' || task.status === 'todo') {
        const deps = extractDependencies(task);
        if (deps.every((d) => doneIds.has(d))) { target = task; break; }
      }
    }
    if (!target) { await new Promise((r) => setTimeout(r, 2000)); continue; }

    const agentId = options.agent || `${node.node_id}-agent`;
    const claim = await client.claim(target.id as string, agentId);
    if (!claim) { await new Promise((r) => setTimeout(r, 1000)); continue; }
    currentClaim = target.id as string;
    console.log(`[${node.node_id}] [START] Claimed task: ${target.id} (via coordinator)`);
    logEvent(alpDir, 'task_claim', { task_id: target.id as string, agent: agentId, source: 'swarm' });

    if (options.provider) {
      const project = allObjects.find((obj) => obj._type === 'project');
      const agent = allObjects.find((obj) => obj._type === 'agent' && obj.id === (target as any).owner?.replace('-> ', ''))
        || allObjects.find((obj) => obj._type === 'agent');
      const memories = allObjects.filter((obj) => obj._type === 'memory');
      const rules = allObjects.filter((obj) => obj._type === 'rule');
      const decisions = allObjects.filter((obj) => obj._type === 'decision' && obj.status === '[x]');
      const contextBundle = buildContextBundle(target, project || null, agent || null, memories, rules, decisions, allObjects);
      const llm = createProvider(options.provider, options.model);
      const loop = new LoopEngine({ maxIterations: 3, completionConditions: ['Task verified successfully'] });
      let success = false;
      try {
        const result = await loop.run(async (stage: LoopStage, iteration: number) => {
          await llm.chat([
            { role: 'system' as const, content: 'You are an autonomous AI agent following the ALP protocol.' },
            { role: 'user' as const, content: `Context:\n${contextBundle}\n\nCurrent Stage: ${stage}\nExecute this stage.` },
          ]);
          return stage === 'test';
        });
        success = result.status === 'completed';
      } catch (e) {
        console.error(`[${node.node_id} | ${target!.id}] Execution error:`, e);
      }
      updateTaskStatusOnFile(target.id as string, success ? '[x]' : '[!]', alpDir);
      logEvent(alpDir, 'task_status', { task_id: target.id as string, status: success ? '[x]' : '[!]', agent: agentId, source: 'swarm' });
    } else {
      console.log(`[${node.node_id}] No provider. Leaving task ${target.id} claimed; status unchanged.`);
    }
    await client.release(target.id as string);
    currentClaim = null;
    lockManager.release(target.id as string);
    logEvent(alpDir, 'task_release', { task_id: target.id as string, agent: agentId, source: 'swarm' });
  }
  cleanup();
}

function resolveSwarmConfig(
  alpDir: string,
  swarmId: string,
  coordinator?: string,
  token?: string,
  node?: string
) {
  const parser = new AlpParser();
  const objects: AlpObject[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.runtime' || entry.name === '.cache') continue;
        walk(full);
      } else if (entry.name.endsWith('.alp')) {
        try { objects.push(...parser.parse(fs.readFileSync(full, 'utf-8'))); } catch {}
      }
    }
  };
  walk(alpDir);
  const swarm = objects.find((o) => o._type === 'swarm' && o.id === swarmId);
  if (!swarm) {
    console.error(`Error: @swarm "${swarmId}" not found in workspace.`);
    process.exit(1);
  }
  const rawToken = token || (swarm as any).token;
  let resolvedToken: string | undefined;
  if (rawToken) {
    const m = /\$\{([^}]+)\}/.exec(rawToken);
    resolvedToken = m ? process.env[m[1]] : rawToken;
  }
  const rawHb = (swarm as any).heartbeat_seconds;
  const rawPull = (swarm as any).pull_state;
  return {
    id: swarmId,
    coordinator: coordinator || (swarm as any).coordinator || 'http://127.0.0.1:4000',
    token: resolvedToken,
    node_id: node || (swarm as any).node_id,
    heartbeat_seconds: rawHb === undefined ? undefined : Number(rawHb),
    pull_state: rawPull === undefined ? undefined : (rawPull === true || rawPull === 'true'),
    peers: (swarm as any).peers,
  };
}

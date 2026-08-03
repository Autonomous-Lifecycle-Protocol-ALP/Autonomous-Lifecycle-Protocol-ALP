import { describe, it, expect } from 'vitest';
import { LoopEngine, LOOP_STAGES, LoopStage, LoopStatus } from '../src/loop';

describe('LoopEngine', () => {
  it('completes when executeStage returns true immediately', async () => {
    const engine = new LoopEngine({ maxIterations: 5, completionConditions: [] });
    const result = await engine.run(async () => true);
    expect(result.status).toBe('completed');
    expect(result.iterations).toBe(1);
  });

  it('runs through all stages until completion', async () => {
    const stages: LoopStage[] = [];
    const engine = new LoopEngine({ maxIterations: 3, completionConditions: [] });
    engine.on((e) => {
      if (e.type === 'stage_enter' && e.stage) stages.push(e.stage);
    });

    let count = 0;
    await engine.run(async (stage) => {
      expect(LOOP_STAGES).toContain(stage);
      count++;
      return stage === 'improve';
    });

    expect(count).toBe(LOOP_STAGES.length);
  });

  it('emits iteration_start and iteration_end events', async () => {
    const events: string[] = [];
    const engine = new LoopEngine({ maxIterations: 2, completionConditions: [] });
    engine.on((e) => events.push(e.type));

    await engine.run(async () => true);
    expect(events).toContain('iteration_start');
    expect(events).toContain('iteration_end');
    expect(events).toContain('completed');
  });

  it('fails after max iterations', async () => {
    const engine = new LoopEngine({ maxIterations: 2, completionConditions: [] });
    const result = await engine.run(async () => false);
    expect(result.status).toBe('failed');
    expect(result.iterations).toBe(2);
  });

  it('records checkpoints when checkpointPerIteration is true', async () => {
    const engine = new LoopEngine({ maxIterations: 2, completionConditions: [], checkpointPerIteration: true });
    await engine.run(async () => true);
    const state = engine.getState();
    expect(state.checkpoints).toBe(1);
  });

  it('returns current state', async () => {
    const engine = new LoopEngine({ maxIterations: 1, completionConditions: [] });
    await engine.run(async () => true);
    const state = engine.getState();
    expect(state.status).toBe('completed');
    expect(state.iteration).toBe(1);
  });
});

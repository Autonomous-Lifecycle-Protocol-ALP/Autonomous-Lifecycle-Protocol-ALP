import { describe, it, expect } from 'vitest';
import { WorkflowReplayEngine } from '../src/workflow-replay';

describe('v58.0.0 WorkflowReplayEngine — Temporal Workflow Replay & Time-Travel Debugging', () => {
  it('captures an execution trace step-by-step', () => {
    const engine = new WorkflowReplayEngine();
    const trace = engine.startTrace('workflow-build-1');

    const step1 = engine.captureStep(trace.traceId, 'compile', 'agent-compiler', { file: 'index.ts' }, 'Success');
    const step2 = engine.captureStep(trace.traceId, 'test', 'agent-tester', { suite: 'unit' }, 'Passed 10 tests');
    engine.completeTrace(trace.traceId);

    expect(step1?.stepIndex).toBe(0);
    expect(step2?.stepIndex).toBe(1);

    const fetched = engine.getTrace(trace.traceId);
    expect(fetched?.steps.length).toBe(2);
    expect(fetched?.status).toBe('COMPLETED');
  });

  it('supports time-travel seek and step navigation', () => {
    const engine = new WorkflowReplayEngine();
    const trace = engine.startTrace('workflow-seek');

    engine.captureStep(trace.traceId, 'step-0', 'agent-1');
    engine.captureStep(trace.traceId, 'step-1', 'agent-1');
    engine.captureStep(trace.traceId, 'step-2', 'agent-1');
    engine.completeTrace(trace.traceId);

    const sought = engine.seekToStep(trace.traceId, 1);
    expect(sought?.action).toBe('step-1');

    const forward = engine.stepForward(trace.traceId);
    expect(forward?.action).toBe('step-2');

    const backward = engine.stepBackward(trace.traceId);
    expect(backward?.action).toBe('step-1');
  });

  it('compares two execution traces for state divergence', () => {
    const engine = new WorkflowReplayEngine();

    const traceA = engine.startTrace('run-a');
    engine.captureStep(traceA.traceId, 'build', 'agent-1');
    engine.captureStep(traceA.traceId, 'test', 'agent-2');
    engine.completeTrace(traceA.traceId);

    const traceB = engine.startTrace('run-b');
    engine.captureStep(traceB.traceId, 'build', 'agent-1');
    engine.captureStep(traceB.traceId, 'deploy', 'agent-2'); // Divergent action
    engine.completeTrace(traceB.traceId);

    const diffs = engine.compareTraces(traceA.traceId, traceB.traceId);
    expect(diffs.length).toBe(2);
    expect(diffs[0].hasStateDivergence).toBe(false);
    expect(diffs[1].hasStateDivergence).toBe(true);
    expect(diffs[1].baseAction).toBe('test');
    expect(diffs[1].compareAction).toBe('deploy');
  });
});

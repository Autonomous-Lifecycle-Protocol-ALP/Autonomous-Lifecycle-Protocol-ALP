/**
 * WorkflowReplayEngine — v58.0.0 Temporal Workflow Replay Engine
 *
 * Provides deterministic capture, time-travel debugging, step-back/step-forward
 * replay, and diff comparison for autonomous agent execution traces.
 */

export interface ReplayStep {
  stepIndex: number;
  action: string;
  agentId: string;
  stateSnapshot: Record<string, unknown>;
  output: string;
  timestamp: string;
}

export interface ReplayTrace {
  traceId: string;
  workflowId: string;
  steps: ReplayStep[];
  status: 'CAPTURING' | 'COMPLETED' | 'REPLAYING';
  capturedAt: string;
}

export interface ReplayDiff {
  stepIndex: number;
  baseAction: string;
  compareAction: string;
  hasStateDivergence: boolean;
}

export class WorkflowReplayEngine {
  private traces: Map<string, ReplayTrace> = new Map();
  private activeStepPointer: Map<string, number> = new Map();

  /**
   * Start capturing a new execution trace for a workflow.
   */
  public startTrace(workflowId: string): ReplayTrace {
    const traceId = `trace-${workflowId}-${Date.now()}`;
    const trace: ReplayTrace = {
      traceId,
      workflowId,
      steps: [],
      status: 'CAPTURING',
      capturedAt: new Date().toISOString(),
    };
    this.traces.set(traceId, trace);
    this.activeStepPointer.set(traceId, 0);
    return trace;
  }

  /**
   * Record a single step snapshot into the active trace.
   */
  public captureStep(
    traceId: string,
    action: string,
    agentId: string,
    stateSnapshot: Record<string, unknown> = {},
    output: string = ''
  ): ReplayStep | undefined {
    const trace = this.traces.get(traceId);
    if (!trace || trace.status === 'COMPLETED') return undefined;

    const stepIndex = trace.steps.length;
    const step: ReplayStep = {
      stepIndex,
      action,
      agentId,
      stateSnapshot,
      output,
      timestamp: new Date().toISOString(),
    };

    trace.steps.push(step);
    return step;
  }

  /**
   * Finish capturing and seal the trace for replay.
   */
  public completeTrace(traceId: string): boolean {
    const trace = this.traces.get(traceId);
    if (!trace) return false;
    trace.status = 'COMPLETED';
    return true;
  }

  /**
   * Move replay pointer to a specific step index.
   */
  public seekToStep(traceId: string, stepIndex: number): ReplayStep | undefined {
    const trace = this.traces.get(traceId);
    if (!trace || stepIndex < 0 || stepIndex >= trace.steps.length) return undefined;

    this.activeStepPointer.set(traceId, stepIndex);
    return trace.steps[stepIndex];
  }

  /**
   * Step forward in the replay trajectory.
   */
  public stepForward(traceId: string): ReplayStep | undefined {
    const current = this.activeStepPointer.get(traceId) ?? 0;
    return this.seekToStep(traceId, current + 1);
  }

  /**
   * Step backward in the replay trajectory.
   */
  public stepBackward(traceId: string): ReplayStep | undefined {
    const current = this.activeStepPointer.get(traceId) ?? 0;
    return this.seekToStep(traceId, current - 1);
  }

  /**
   * Compare two replay traces to detect execution state divergence.
   */
  public compareTraces(baseTraceId: string, compareTraceId: string): ReplayDiff[] {
    const baseTrace = this.traces.get(baseTraceId);
    const compareTrace = this.traces.get(compareTraceId);

    if (!baseTrace || !compareTrace) return [];

    const diffs: ReplayDiff[] = [];
    const maxSteps = Math.max(baseTrace.steps.length, compareTrace.steps.length);

    for (let i = 0; i < maxSteps; i++) {
      const baseStep = baseTrace.steps[i];
      const compareStep = compareTrace.steps[i];

      const baseAction = baseStep ? baseStep.action : '<NONE>';
      const compareAction = compareStep ? compareStep.action : '<NONE>';
      const hasDivergence = baseAction !== compareAction;

      diffs.push({
        stepIndex: i,
        baseAction,
        compareAction,
        hasStateDivergence: hasDivergence,
      });
    }

    return diffs;
  }

  public getTrace(traceId: string): ReplayTrace | undefined {
    return this.traces.get(traceId);
  }
}

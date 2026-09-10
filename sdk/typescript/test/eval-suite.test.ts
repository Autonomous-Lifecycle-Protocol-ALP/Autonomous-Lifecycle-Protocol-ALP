import { describe, it, expect } from 'vitest';
import { EvalSuiteRunner, EvalCase, EvalStep, ActualTrace } from '../src/eval-suite';

function makeCase(overrides: Partial<EvalCase> = {}): EvalCase {
  return {
    id: 'case-1',
    name: 'Test Case',
    goldenTrace: [
      { stepIndex: 0, expectedAction: 'start', expectedAgentId: 'agent-a', expectedOutput: 'ok' },
      { stepIndex: 1, expectedAction: 'complete' },
    ],
    ...overrides,
  };
}

function makeTrace(steps: ActualTrace['steps']): ActualTrace {
  return { traceId: 'trace-1', workflowId: 'wf-1', steps };
}

describe('EvalSuiteRunner', () => {
  it('addCase and addCases register cases', () => {
    const runner = new EvalSuiteRunner();
    runner.addCase(makeCase({ id: 'c1', name: 'One' }));
    runner.addCases([makeCase({ id: 'c2', name: 'Two' }), makeCase({ id: 'c3', name: 'Three' })]);
    const report = runner.runSuite(new Map());
    expect(report.totalCases).toBe(3);
  });

  it('evaluateCase exact match returns 100% accuracy', () => {
    const runner = new EvalSuiteRunner();
    const c = makeCase();
    const trace = makeTrace([
      { stepIndex: 0, action: 'start', agentId: 'agent-a', output: 'ok', timestamp: new Date().toISOString(), tokensUsed: 10 },
      { stepIndex: 1, action: 'complete', agentId: 'agent-b', output: 'done', timestamp: new Date().toISOString(), tokensUsed: 5 },
    ]);
    const result = runner.evaluateCase(c, trace);
    expect(result.passed).toBe(true);
    expect(result.accuracy).toBe(1);
    expect(result.matchedSteps).toBe(2);
    expect(result.divergences).toHaveLength(0);
    expect(result.tokenUsage).toBe(15);
  });

  it('evaluateCase missing steps at end', () => {
    const runner = new EvalSuiteRunner();
    const c = makeCase();
    const trace = makeTrace([
      { stepIndex: 0, action: 'start', agentId: 'agent-a', output: 'ok', timestamp: new Date().toISOString() },
    ]);
    const result = runner.evaluateCase(c, trace);
    expect(result.passed).toBe(false);
    expect(result.matchedSteps).toBe(1);
    expect(result.totalSteps).toBe(2);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].type).toBe('missing_step');
  });

  it('evaluateCase extra steps', () => {
    const runner = new EvalSuiteRunner();
    const c = makeCase({
      goldenTrace: [
        { stepIndex: 0, expectedAction: 'start' },
      ],
    });
    const trace = makeTrace([
      { stepIndex: 0, action: 'start', agentId: 'x', output: '', timestamp: new Date().toISOString() },
      { stepIndex: 1, action: 'extra', agentId: 'x', output: '', timestamp: new Date().toISOString() },
    ]);
    const result = runner.evaluateCase(c, trace);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].type).toBe('extra_step');
  });

  it('evaluateCase action mismatch', () => {
    const runner = new EvalSuiteRunner();
    const c = makeCase();
    const trace = makeTrace([
      { stepIndex: 0, action: 'wrong', agentId: 'agent-a', output: 'ok', timestamp: new Date().toISOString() },
      { stepIndex: 1, action: 'complete', agentId: 'agent-b', output: 'done', timestamp: new Date().toISOString() },
    ]);
    const result = runner.evaluateCase(c, trace);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].type).toBe('action_mismatch');
  });

  it('evaluateCase agent mismatch', () => {
    const runner = new EvalSuiteRunner();
    const c = makeCase();
    const trace = makeTrace([
      { stepIndex: 0, action: 'start', agentId: 'wrong-agent', output: 'ok', timestamp: new Date().toISOString() },
      { stepIndex: 1, action: 'complete', agentId: 'agent-b', output: 'done', timestamp: new Date().toISOString() },
    ]);
    const result = runner.evaluateCase(c, trace);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].type).toBe('agent_mismatch');
  });

  it('evaluateCase output mismatch', () => {
    const runner = new EvalSuiteRunner();
    const c = makeCase();
    const trace = makeTrace([
      { stepIndex: 0, action: 'start', agentId: 'agent-a', output: 'wrong', timestamp: new Date().toISOString() },
      { stepIndex: 1, action: 'complete', agentId: 'agent-b', output: 'done', timestamp: new Date().toISOString() },
    ]);
    const result = runner.evaluateCase(c, trace);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].type).toBe('output_mismatch');
  });

  it('evaluateCase empty golden trace has accuracy 1', () => {
    const runner = new EvalSuiteRunner();
    const c = makeCase({ goldenTrace: [] });
    const trace = makeTrace([]);
    const result = runner.evaluateCase(c, trace);
    expect(result.accuracy).toBe(1);
    expect(result.passed).toBe(true);
  });

  it('runSuite handles missing trace', () => {
    const runner = new EvalSuiteRunner();
    runner.addCase(makeCase({ id: 'missing' }));
    const report = runner.runSuite(new Map());
    expect(report.totalCases).toBe(1);
    expect(report.passedCases).toBe(0);
    expect(report.failedCases).toBe(1);
    expect(report.results[0].divergences[0].type).toBe('missing_step');
  });

  it('runSuite verdict is PASS when all match', () => {
    const runner = new EvalSuiteRunner();
    const trace = makeTrace([
      { stepIndex: 0, action: 'start', agentId: 'agent-a', output: 'ok', timestamp: new Date().toISOString() },
    ]);
    const report = runner.runSuite(new Map([['c1', trace]]));
    expect(report.verdict).toBe('PASS');
  });

  it('runSuite verdict is FAIL when case has mismatches', () => {
    const runner = new EvalSuiteRunner();
    runner.addCase(makeCase({ id: 'c1' }));
    const trace = makeTrace([
      { stepIndex: 0, action: 'wrong', agentId: 'agent-a', output: 'ok', timestamp: new Date().toISOString() },
    ]);
    const report = runner.runSuite(new Map([['c1', trace]]));
    expect(report.verdict).toBe('FAIL');
  });

  it('runSuite detects regressions when baseline exists and accuracy drops', () => {
    const runner = new EvalSuiteRunner();
    runner.configure({ regressionThreshold: 0.05, criticalThreshold: 0.15 });
    runner.addCase(makeCase({ id: 'c1' }));
    runner.setBaseline('c1', { caseId: 'c1', caseName: 'One', passed: true, totalSteps: 2, matchedSteps: 2, accuracy: 1, divergences: [], durationMs: 0, tokenUsage: 50 });
    // Mismatch on step 1 -> accuracy 0.5, change = 50%
    const trace = makeTrace([
      { stepIndex: 0, action: 'start', agentId: 'agent-a', output: 'ok', timestamp: new Date().toISOString() },
      { stepIndex: 1, action: 'wrong', agentId: 'agent-b', output: 'done', timestamp: new Date().toISOString() },
    ]);
    const report = runner.runSuite(new Map([['c1', trace]]));
    expect(report.regressions.length).toBeGreaterThanOrEqual(1);
    expect(report.regressions.some(r => r.metric === 'accuracy')).toBe(true);
  });

  it('runSuite detects token usage regression', () => {
    const runner = new EvalSuiteRunner();
    runner.configure({ regressionThreshold: 0.05, criticalThreshold: 0.15 });
    runner.addCase(makeCase({ id: 'c1', goldenTrace: [{ stepIndex: 0, expectedAction: 'start' }] }));
    runner.setBaseline('c1', { caseId: 'c1', caseName: 'One', passed: true, totalSteps: 1, matchedSteps: 1, accuracy: 1, divergences: [], durationMs: 0, tokenUsage: 50 });
    // Exact match but tokensUsed = 150 vs baseline 50 -> 200% increase
    const trace = makeTrace([
      { stepIndex: 0, action: 'start', agentId: 'agent-a', output: 'ok', timestamp: new Date().toISOString(), tokensUsed: 150 },
    ]);
    const report = runner.runSuite(new Map([['c1', trace]]));
    const tokenReg = report.regressions.find(r => r.metric === 'token_usage');
    expect(tokenReg).toBeDefined();
    expect(tokenReg!.changePercent).toBeCloseTo(200, 0);
  });

  it('formatReport produces readable output', () => {
    const runner = new EvalSuiteRunner();
    const report = runner.runSuite(new Map());
    const text = runner.formatReport(report);
    expect(text).toContain('ALP Agent Benchmark Report');
    expect(text).toContain('Verdict');
    expect(text).toContain('Cases:');
    expect(text).toContain('Accuracy:');
  });
});

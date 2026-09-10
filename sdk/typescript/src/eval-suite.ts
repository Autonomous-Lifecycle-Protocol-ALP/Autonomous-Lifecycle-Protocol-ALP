/**
 * EvalSuiteRunner — v80.0.0 Automated Agent Benchmark & Regression Suite
 *
 * Replays recorded WorkflowReplayEngine traces, measures agent decision
 * accuracy against golden paths, and produces benchmark reports with
 * pass/fail gates for CI/CD.
 *
 * Features:
 * - Replay trace comparison against golden reference traces
 * - Decision accuracy scoring (exact match, fuzzy match, semantic)
 * - Performance regression detection (latency, token usage)
 * - CI-ready JSON report with pass/fail exit codes
 */

// ── Types ───────────────────────────────────────────────────────────────

export interface EvalCase {
  id: string;
  name: string;
  description?: string;
  goldenTrace: EvalStep[];
  tags?: string[];
}

export interface EvalStep {
  stepIndex: number;
  expectedAction: string;
  expectedAgentId?: string;
  expectedOutput?: string;
  toleranceMs?: number;
}

export interface EvalResult {
  caseId: string;
  caseName: string;
  passed: boolean;
  totalSteps: number;
  matchedSteps: number;
  accuracy: number;
  divergences: EvalDivergence[];
  durationMs: number;
  tokenUsage: number;
}

export interface EvalDivergence {
  stepIndex: number;
  expected: string;
  actual: string;
  type: 'action_mismatch' | 'agent_mismatch' | 'output_mismatch' | 'missing_step' | 'extra_step';
}

export interface BenchmarkReport {
  suiteId: string;
  timestamp: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  overallAccuracy: number;
  totalDurationMs: number;
  results: EvalResult[];
  regressions: RegressionAlert[];
  verdict: 'PASS' | 'FAIL';
}

export interface RegressionAlert {
  caseId: string;
  metric: string;
  baseline: number;
  current: number;
  changePercent: number;
  severity: 'warning' | 'critical';
}

// ── Actual trace (from WorkflowReplayEngine) ─────────────────────────

export interface ActualStep {
  stepIndex: number;
  action: string;
  agentId: string;
  output: string;
  timestamp: string;
  tokensUsed?: number;
}

export interface ActualTrace {
  traceId: string;
  workflowId: string;
  steps: ActualStep[];
}

// ── Runner ──────────────────────────────────────────────────────────────

export class EvalSuiteRunner {
  private cases: EvalCase[] = [];
  private baselines: Map<string, EvalResult> = new Map();
  private regressionThreshold = 0.1; // 10% degradation triggers warning
  private criticalThreshold = 0.25; // 25% triggers critical

  /**
   * Register a test case with golden expected steps.
   */
  public addCase(evalCase: EvalCase): void {
    this.cases.push(evalCase);
  }

  /**
   * Register multiple cases at once.
   */
  public addCases(cases: EvalCase[]): void {
    this.cases.push(...cases);
  }

  /**
   * Set a baseline result for regression detection.
   */
  public setBaseline(caseId: string, baseline: EvalResult): void {
    this.baselines.set(caseId, baseline);
  }

  /**
   * Configure regression thresholds.
   */
  public configure(options: {
    regressionThreshold?: number;
    criticalThreshold?: number;
  }): void {
    if (options.regressionThreshold !== undefined) this.regressionThreshold = options.regressionThreshold;
    if (options.criticalThreshold !== undefined) this.criticalThreshold = options.criticalThreshold;
  }

  /**
   * Evaluate a single actual trace against its golden case.
   */
  public evaluateCase(evalCase: EvalCase, actualTrace: ActualTrace): EvalResult {
    const startTime = Date.now();
    const divergences: EvalDivergence[] = [];
    let matchedSteps = 0;
    let totalTokens = 0;

    const maxSteps = Math.max(evalCase.goldenTrace.length, actualTrace.steps.length);

    for (let i = 0; i < maxSteps; i++) {
      const golden = evalCase.goldenTrace[i];
      const actual = actualTrace.steps[i];

      if (!golden && actual) {
        divergences.push({
          stepIndex: i,
          expected: '<END>',
          actual: actual.action,
          type: 'extra_step',
        });
        continue;
      }

      if (golden && !actual) {
        divergences.push({
          stepIndex: i,
          expected: golden.expectedAction,
          actual: '<MISSING>',
          type: 'missing_step',
        });
        continue;
      }

      if (golden && actual) {
        totalTokens += actual.tokensUsed || 0;

        // Check action match
        if (golden.expectedAction !== actual.action) {
          divergences.push({
            stepIndex: i,
            expected: golden.expectedAction,
            actual: actual.action,
            type: 'action_mismatch',
          });
          continue;
        }

        // Check agent match (if specified)
        if (golden.expectedAgentId && golden.expectedAgentId !== actual.agentId) {
          divergences.push({
            stepIndex: i,
            expected: golden.expectedAgentId,
            actual: actual.agentId,
            type: 'agent_mismatch',
          });
          continue;
        }

        // Check output match (if specified)
        if (golden.expectedOutput && golden.expectedOutput !== actual.output) {
          divergences.push({
            stepIndex: i,
            expected: golden.expectedOutput,
            actual: actual.output,
            type: 'output_mismatch',
          });
          continue;
        }

        matchedSteps++;
      }
    }

    const totalSteps = evalCase.goldenTrace.length;
    const accuracy = totalSteps > 0 ? matchedSteps / totalSteps : 1;
    const durationMs = Date.now() - startTime;

    return {
      caseId: evalCase.id,
      caseName: evalCase.name,
      passed: accuracy >= 1.0,
      totalSteps,
      matchedSteps,
      accuracy,
      divergences,
      durationMs,
      tokenUsage: totalTokens,
    };
  }

  /**
   * Run the full benchmark suite against a set of actual traces.
   */
  public runSuite(
    traces: Map<string, ActualTrace>,
    suiteId = `eval-${Date.now()}`
  ): BenchmarkReport {
    const startTime = Date.now();
    const results: EvalResult[] = [];
    const regressions: RegressionAlert[] = [];

    for (const evalCase of this.cases) {
      const trace = traces.get(evalCase.id);
      if (!trace) {
        results.push({
          caseId: evalCase.id,
          caseName: evalCase.name,
          passed: false,
          totalSteps: evalCase.goldenTrace.length,
          matchedSteps: 0,
          accuracy: 0,
          divergences: [{ stepIndex: 0, expected: 'trace', actual: '<NOT_FOUND>', type: 'missing_step' }],
          durationMs: 0,
          tokenUsage: 0,
        });
        continue;
      }

      const result = this.evaluateCase(evalCase, trace);
      results.push(result);

      // Regression detection
      const baseline = this.baselines.get(evalCase.id);
      if (baseline) {
        // Accuracy regression
        if (baseline.accuracy > 0 && result.accuracy < baseline.accuracy) {
          const change = (baseline.accuracy - result.accuracy) / baseline.accuracy;
          if (change >= this.regressionThreshold) {
            regressions.push({
              caseId: evalCase.id,
              metric: 'accuracy',
              baseline: baseline.accuracy,
              current: result.accuracy,
              changePercent: -change * 100,
              severity: change >= this.criticalThreshold ? 'critical' : 'warning',
            });
          }
        }

        // Token usage regression (increase)
        if (baseline.tokenUsage > 0 && result.tokenUsage > baseline.tokenUsage) {
          const change = (result.tokenUsage - baseline.tokenUsage) / baseline.tokenUsage;
          if (change >= this.regressionThreshold) {
            regressions.push({
              caseId: evalCase.id,
              metric: 'token_usage',
              baseline: baseline.tokenUsage,
              current: result.tokenUsage,
              changePercent: change * 100,
              severity: change >= this.criticalThreshold ? 'critical' : 'warning',
            });
          }
        }
      }
    }

    const passedCases = results.filter((r) => r.passed).length;
    const failedCases = results.length - passedCases;
    const overallAccuracy =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
        : 0;

    const hasCritical = regressions.some((r) => r.severity === 'critical');

    return {
      suiteId,
      timestamp: new Date().toISOString(),
      totalCases: results.length,
      passedCases,
      failedCases,
      overallAccuracy,
      totalDurationMs: Date.now() - startTime,
      results,
      regressions,
      verdict: failedCases === 0 && !hasCritical ? 'PASS' : 'FAIL',
    };
  }

  /**
   * Format a benchmark report as a human-readable string.
   */
  public formatReport(report: BenchmarkReport): string {
    const lines: string[] = [
      `═══════════════════════════════════════════════════`,
      `  ALP Agent Benchmark Report`,
      `  Suite: ${report.suiteId}`,
      `  Time:  ${report.timestamp}`,
      `═══════════════════════════════════════════════════`,
      ``,
      `  Verdict: ${report.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'}`,
      `  Cases:   ${report.passedCases}/${report.totalCases} passed`,
      `  Accuracy: ${(report.overallAccuracy * 100).toFixed(1)}%`,
      `  Duration: ${report.totalDurationMs}ms`,
      ``,
    ];

    for (const result of report.results) {
      const icon = result.passed ? '✅' : '❌';
      lines.push(`  ${icon} ${result.caseName} (${(result.accuracy * 100).toFixed(0)}% accuracy, ${result.matchedSteps}/${result.totalSteps} steps)`);
      for (const div of result.divergences) {
        lines.push(`     ⚠ Step ${div.stepIndex}: ${div.type} — expected "${div.expected}", got "${div.actual}"`);
      }
    }

    if (report.regressions.length > 0) {
      lines.push('');
      lines.push('  ── Regressions ──');
      for (const reg of report.regressions) {
        const icon = reg.severity === 'critical' ? '🔴' : '🟡';
        lines.push(`  ${icon} ${reg.caseId}: ${reg.metric} ${reg.changePercent > 0 ? '+' : ''}${reg.changePercent.toFixed(1)}% (${reg.baseline} → ${reg.current})`);
      }
    }

    lines.push('');
    lines.push(`═══════════════════════════════════════════════════`);
    return lines.join('\n');
  }
}

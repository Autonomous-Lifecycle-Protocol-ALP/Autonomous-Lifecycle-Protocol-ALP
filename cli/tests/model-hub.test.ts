import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as path from 'path';
import { ModelHubEngine } from '@autonomous-lifecycle-protocol-alp/parser';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('ALP AI Model Hub', () => {
  describe('ModelHubEngine', () => {
    it('initializes with pre-seeded models across multiple providers', () => {
      const engine = new ModelHubEngine();
      const models = engine.searchModels();

      expect(models.length).toBeGreaterThanOrEqual(8);
      const providers = new Set(models.map(m => m.provider));
      expect(providers.has('alp-native')).toBe(true);
      expect(providers.has('openai')).toBe(true);
      expect(providers.has('anthropic')).toBe(true);
      expect(providers.has('google')).toBe(true);
    });

    it('filters models by task type, provider, or query string', () => {
      const engine = new ModelHubEngine();

      const codeReviewModels = engine.searchModels(undefined, 'CODE_REVIEW');
      expect(codeReviewModels.length).toBeGreaterThan(0);
      expect(codeReviewModels.every(m => m.task === 'code-review')).toBe(true);

      const anthropicModels = engine.searchModels(undefined, undefined, 'anthropic');
      expect(anthropicModels.length).toBeGreaterThan(0);
      expect(anthropicModels.every(m => m.provider === 'anthropic')).toBe(true);

      const sonnet = engine.searchModels('sonnet');
      expect(sonnet.length).toBeGreaterThan(0);
      expect(sonnet[0].name.toLowerCase()).toContain('sonnet');
    });

    it('retrieves specific model details by ID', () => {
      const engine = new ModelHubEngine();
      const model = engine.getModel('alp-coder-v3');

      expect(model).toBeDefined();
      expect(model?.name).toBe('ALP Coder v3');
      expect(model?.provider).toBe('alp-native');
      expect(model?.contextWindow).toBe(128000);
    });

    it('invokes a model and tracks latency, tokens, cost, and usage history', () => {
      const engine = new ModelHubEngine();
      const response = engine.invokeModel('alp-coder-v3', 'Refactor auth middleware to use JWT');

      expect(response.modelId).toBe('alp-coder-v3');
      expect(response.content.length).toBeGreaterThan(10);
      expect(response.tokensUsed.total).toBeGreaterThan(0);
      expect(response.latencyMs).toBeGreaterThan(0);
      expect(response.costUsd).toBeGreaterThanOrEqual(0);

      const report = engine.getUsageReport('alp-coder-v3');
      expect(report.invocations).toBe(1);
      expect(report.totalTokens).toBe(response.tokensUsed.total);
    });

    it('benchmarks a model across standardized metrics', () => {
      const engine = new ModelHubEngine();
      const benchmark = engine.benchmarkModel('claude-3-5-sonnet');

      expect(benchmark.modelId).toBe('claude-3-5-sonnet');
      expect(benchmark.score).toBeGreaterThan(50);
      expect(benchmark.accuracy).toBeGreaterThan(0.5);
      expect(benchmark.latencyP50Ms).toBeGreaterThan(0);
      expect(benchmark.testedAt).toBeDefined();
    });

    it('runs A/B testing between two models and picks a winner', () => {
      const engine = new ModelHubEngine();
      const result = engine.abTest('alp-coder-v3', 'gpt-4o', 'Implement binary search in TypeScript');

      expect(result.input).toBe('Implement binary search in TypeScript');
      expect(result.modelA.modelId).toBe('alp-coder-v3');
      expect(result.modelB.modelId).toContain('gpt-4o');
      expect(['alp-coder-v3', 'openai/gpt-4o', 'gpt-4o', 'TIE']).toContain(result.winner);
      expect(result.metricsComparison.latencyDiffMs).toBeDefined();
    });

    it('aggregates usage reports across all models or by individual model', () => {
      const engine = new ModelHubEngine();
      engine.invokeModel('alp-coder-v3', 'Task 1');
      engine.invokeModel('gpt-4o', 'Task 2');

      const overall = engine.getUsageReport();
      expect(overall.invocations).toBe(2);
      expect(overall.records.length).toBe(2);
      expect(overall.totalCostUsd).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CLI Commands', () => {
    it('alp hub search lists available models', () => {
      const output = execFileSync('node', [CLI, 'hub', 'search'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('ALP AI Model Hub — Search Results');
      expect(output).toContain('alp-coder-v3');
      expect(output).toContain('claude-3-5-sonnet');
      expect(output).toContain('gpt-4o');
    });

    it('alp hub search filters by task flag', () => {
      const output = execFileSync('node', [CLI, 'hub', 'search', '--task', 'TEST_GEN'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('ALP AI Model Hub — Search Results');
      expect(output.toLowerCase()).toContain('test-gen');
    });

    it('alp hub info displays comprehensive model telemetry and benchmark', () => {
      const output = execFileSync('node', [CLI, 'hub', 'info', 'alp-coder-v3'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('ALP AI Model Hub — Model Details');
      expect(output).toContain('ALP Coder v3');
      expect(output).toContain('Benchmark Score:');
      expect(output).toContain('Tokens / sec:');
    });

    it('alp hub invoke performs prompt execution with cost breakdown', () => {
      const output = execFileSync('node', [CLI, 'hub', 'invoke', 'gemini-1-5-pro', 'Summarize architecture'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('ALP AI Model Hub — Invocation Result');
      expect(output).toContain('gemini-1-5-pro');
      expect(output).toContain('Tokens:');
      expect(output).toContain('Latency:');
    });

    it('alp hub benchmark evaluates model performance', () => {
      const output = execFileSync('node', [CLI, 'hub', 'benchmark', 'gpt-4o'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('ALP AI Model Hub — Benchmark Report');
      expect(output).toContain('gpt-4o');
      expect(output).toContain('Overall Score:');
    });

    it('alp hub ab compares two models side-by-side', () => {
      const output = execFileSync('node', [
        CLI, 'hub', 'ab',
        '--model-a', 'alp-coder-v3',
        '--model-b', 'gpt-4o',
        '--input', 'Write a test suite'
      ], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('ALP AI Model Hub — A/B Test Results');
      expect(output).toContain('Winner:');
      expect(output).toContain('Latency Diff:');
    });

    it('alp hub usage shows usage analytics', () => {
      const output = execFileSync('node', [CLI, 'hub', 'usage'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('ALP AI Model Hub — Usage Report');
      expect(output).toContain('Total Invocations:');
      expect(output).toContain('Total Cost:');
    });
  });
});

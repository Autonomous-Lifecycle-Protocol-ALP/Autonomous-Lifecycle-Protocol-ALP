import { ModelHubEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import type { ModelTask, ModelProvider } from '@autonomous-lifecycle-protocol-alp/parser';

export interface ModelHubCommandOptions {
  task?: string;
  provider?: string;
  modelA?: string;
  modelB?: string;
  input?: string;
  model?: string;
}

export function modelHubCommand(sub: string, args: string[] = [], options: ModelHubCommandOptions = {}) {
  const engine = new ModelHubEngine();

  switch (sub) {
    case 'search': {
      const query = args[0];
      const task = options.task as ModelTask | undefined;
      const provider = options.provider as ModelProvider | undefined;
      const models = engine.searchModels(query, task, provider);

      console.log('\n🔍 ALP AI Model Hub — Search Results');
      console.log('═══════════════════════════════════════════════════════════════\n');

      if (models.length === 0) {
        console.log('  No models found matching your criteria.\n');
        return;
      }

      console.log(`  Found ${models.length} model(s):\n`);
      for (const m of models) {
        const stars = '★'.repeat(Math.round(m.rating)) + '☆'.repeat(5 - Math.round(m.rating));
        console.log(`  📦 ${m.name} (${m.modelId})`);
        console.log(`     Task: ${m.task} | Provider: ${m.provider} | v${m.version}`);
        console.log(`     Accuracy: ${(m.accuracy * 100).toFixed(1)}% | Latency: ${m.latencyP50Ms}ms p50`);
        console.log(`     Cost: $${m.costPer1kTokens}/1k tokens | Context: ${(m.contextWindow / 1000).toFixed(0)}k`);
        console.log(`     Rating: ${stars} (${m.rating.toFixed(1)}) | Invocations: ${m.totalInvocations.toLocaleString()}\n`);
      }
      break;
    }

    case 'info': {
      const modelId = args[0];
      if (!modelId) {
        console.error('Usage: alp hub info <modelId>');
        process.exit(1);
      }
      const model = engine.getModel(modelId);
      if (!model) {
        console.error(`Model '${modelId}' not found.`);
        process.exit(1);
      }

      const bench = engine.benchmarkModel(modelId);
      const stars = '★'.repeat(Math.round(model.rating)) + '☆'.repeat(5 - Math.round(model.rating));
      const scoreBar = '█'.repeat(Math.floor(bench.score / 5)) + '░'.repeat(20 - Math.floor(bench.score / 5));

      console.log('\n📊 ALP AI Model Hub — Model Details');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(`  Model:        ${model.name}`);
      console.log(`  ID:           ${model.modelId}`);
      console.log(`  Provider:     ${model.provider}`);
      console.log(`  Task:         ${model.task}`);
      console.log(`  Version:      ${model.version}`);
      console.log(`  Description:  ${model.description}`);
      console.log(`  Context:      ${(model.contextWindow / 1000).toFixed(0)}k tokens`);
      console.log(`  Cost:         $${model.costPer1kTokens}/1k tokens`);
      console.log(`  Accuracy:     ${(model.accuracy * 100).toFixed(1)}%`);
      console.log(`  Latency:      ${model.latencyP50Ms}ms p50 / ${model.latencyP99Ms}ms p99`);
      console.log(`  Throughput:   ${bench.throughputRps} req/s (Tokens / sec: ${(bench.throughputRps * 150).toFixed(0)})`);
      console.log(`  Rating:       ${stars} (${model.rating.toFixed(1)})`);
      console.log(`  Invocations:  ${model.totalInvocations.toLocaleString()}`);
      console.log(`  Tags:         ${model.tags.join(', ')}`);
      console.log(`\n  Benchmark Score: [${scoreBar}] ${bench.score}/100\n`);
      break;
    }

    case 'invoke': {
      const modelId = args[0];
      const input = args.slice(1).join(' ') || options.input || 'Hello, model!';
      if (!modelId) {
        console.error('Usage: alp hub invoke <modelId> <input>');
        process.exit(1);
      }

      const result = engine.invokeModel(modelId, input);

      console.log('\n⚡ ALP AI Model Hub — Invocation Result');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(`  Model:     ${result.modelId}`);
      console.log(`  Input:     ${result.input.substring(0, 80)}`);
      console.log(`  Output:    ${result.output}`);
      console.log(`  Tokens:    ${result.tokensUsed}`);
      console.log(`  Latency:   ${result.latencyMs}ms`);
      console.log(`  Cost:      $${result.cost}\n`);
      break;
    }

    case 'benchmark': {
      const modelId = args[0];
      if (!modelId) {
        console.error('Usage: alp hub benchmark <modelId>');
        process.exit(1);
      }

      const bench = engine.benchmarkModel(modelId);
      const scoreBar = '█'.repeat(Math.floor(bench.score / 5)) + '░'.repeat(20 - Math.floor(bench.score / 5));

      console.log('\n📈 ALP AI Model Hub — Benchmark Report');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(`  Model:        ${bench.modelId}`);
      console.log(`  Task:         ${bench.task}`);
      console.log(`  Accuracy:     ${(bench.accuracy * 100).toFixed(1)}%`);
      console.log(`  Latency p50:  ${bench.latencyP50Ms}ms`);
      console.log(`  Latency p99:  ${bench.latencyP99Ms}ms`);
      console.log(`  Throughput:   ${bench.throughputRps} req/s`);
      console.log(`  Cost:         $${bench.costPer1kTokens}/1k tokens`);
      console.log(`\n  Overall Score: [${scoreBar}] ${bench.score}/100\n`);
      break;
    }

    case 'ab': {
      const modelA = options.modelA || args[0];
      const modelB = options.modelB || args[1];
      const input = options.input || args.slice(2).join(' ') || 'Review this function for bugs';

      if (!modelA || !modelB) {
        console.error('Usage: alp hub ab --model-a <id> --model-b <id> --input <text>');
        process.exit(1);
      }

      const result = engine.abTest(modelA, modelB, input);
      const benchA = engine.benchmarkModel(modelA);
      const benchB = engine.benchmarkModel(modelB);

      console.log('\n🏆 ALP AI Model Hub — A/B Test Results');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(`  Input:    "${input}"\n`);

      console.log(`  Model A:  ${result.modelA.modelId}`);
      console.log(`    Score:    ${benchA.score}/100`);
      console.log(`    Latency:  ${result.resultA.latencyMs}ms`);
      console.log(`    Cost:     $${result.resultA.cost}`);
      console.log(`    Tokens:   ${result.resultA.tokensUsed}\n`);

      console.log(`  Model B:  ${result.modelB.modelId}`);
      console.log(`    Score:    ${benchB.score}/100`);
      console.log(`    Latency:  ${result.resultB.latencyMs}ms`);
      console.log(`    Cost:     $${result.resultB.cost}`);
      console.log(`    Tokens:   ${result.resultB.tokensUsed}\n`);

      console.log(`  Latency Diff: ${result.metricsComparison.latencyDiffMs}ms`);
      console.log(`  🏅 Winner: ${result.winner} (+${result.marginPercent}% margin)\n`);
      break;
    }

    case 'usage': {
      const modelId = options.model || args[0];

      // Simulate some invocations for usage data
      engine.invokeModel('alp/code-review-v2', 'review this code');
      engine.invokeModel('alp/code-review-v2', 'check for bugs');
      engine.invokeModel('alp/test-gen-v1', 'generate tests');
      engine.invokeModel('openai/gpt-4o', 'general query');

      const records = engine.getUsageReport(modelId);

      console.log('\n📊 ALP AI Model Hub — Usage Report');
      console.log('═══════════════════════════════════════════════════════════════\n');

      if (records.length === 0) {
        console.log('  No usage data available.\n');
        return;
      }

      console.log(`  Total Invocations: ${records.invocations ?? records.reduce((s, r) => s + r.totalInvocations, 0)}`);
      console.log(`  Total Cost:        $${records.totalCostUsd ?? records.reduce((s, r) => s + r.totalCost, 0).toFixed(4)}\n`);

      for (const r of records) {
        console.log(`  📦 ${r.modelId}`);
        console.log(`     Invocations:  ${r.totalInvocations}`);
        console.log(`     Tokens:       ${r.totalTokens.toLocaleString()}`);
        console.log(`     Total Cost:   $${r.totalCost}`);
        console.log(`     Avg Latency:  ${r.avgLatencyMs}ms`);
        console.log(`     Period:       ${r.period}\n`);
      }
      break;
    }

    default:
      console.error(`Unknown hub subcommand: ${sub}`);
      console.error('Available: search, info, invoke, benchmark, ab, usage');
      process.exit(1);
  }
}

import { Command } from 'commander';
import { ChaosEngine } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerChaosCommand(program: Command) {
  program
    .command('chaos')
    .description('Run chaos engineering experiments to test agent workflow resilience (v72.0.0)')
    .option('--type <type>', 'Experiment type: LATENCY, ERROR, RESOURCE_EXHAUSTION, PARTITION, KILL_AGENT', 'LATENCY')
    .option('--agent <id>', 'Target agent ID', 'agent-executor-1')
    .option('--intensity <n>', 'Fault intensity 0.0–1.0', parseFloat)
    .option('--duration <ms>', 'Experiment duration in ms', parseInt)
    .option('--blast-radius <scope>', 'Blast radius: SINGLE, WORKFLOW, SWARM', 'SINGLE')
    .action((options) => {
      const engine = new ChaosEngine();

      const exp = engine.createExperiment(
        `${options.type} Chaos Test`,
        options.type,
        options.agent,
        {
          durationMs: options.duration || 5000,
          intensity: options.intensity || 0.5,
          blastRadius: options.blastRadius || 'SINGLE',
          rollbackOnFailure: true,
          latencyMs: options.type === 'LATENCY' ? 500 : undefined,
          errorCode: options.type === 'ERROR' ? 503 : undefined,
        }
      );

      // Define steady-state hypotheses
      engine.defineSteadyState(exp.experimentId, [
        { metric: 'error_rate', operator: 'LT', threshold: 5.0 },
        { metric: 'latency_p99_ms', operator: 'LTE', threshold: 200 },
        { metric: 'throughput_rps', operator: 'GTE', threshold: 100 },
      ]);

      console.log('\n💥 Chaos Engineering Engine (v72.0.0)');
      console.log('=======================================\n');
      console.log(`  Experiment:     ${exp.name}`);
      console.log(`  ID:             ${exp.experimentId}`);
      console.log(`  Type:           ${exp.type}`);
      console.log(`  Target Agent:   ${exp.targetAgent}`);
      console.log(`  Blast Radius:   ${exp.config.blastRadius}`);
      console.log(`  Intensity:      ${(exp.config.intensity * 100).toFixed(0)}%`);
      console.log(`  Duration:       ${exp.config.durationMs}ms`);
      console.log(`  Rollback:       ${exp.config.rollbackOnFailure ? 'ON' : 'OFF'}`);
      console.log();

      // Run the experiment
      const result = engine.runExperiment(exp.experimentId);

      console.log('📊 Experiment Results:');
      console.log('─────────────────────────────────────────');
      console.log(`  Injected Faults:       ${result.result!.injectedFaults}`);
      console.log(`  Recovered Faults:      ${result.result!.recoveredFaults}`);
      console.log(`  Unrecovered Faults:    ${result.result!.unrecoveredFaults}`);
      console.log(`  Mean Recovery Time:    ${result.result!.meanRecoveryTimeMs}ms`);

      const score = result.result!.resilienceScore;
      const scoreBar = '█'.repeat(Math.floor(score / 5)) + '░'.repeat(20 - Math.floor(score / 5));
      console.log(`  Resilience Score:      [${scoreBar}] ${score}%`);
      console.log();

      console.log('🔍 Observations:');
      for (const obs of result.result!.observations) {
        console.log(`  • ${obs}`);
      }
      console.log();

      // Validate steady-state
      const hypotheses = engine.validateSteadyState(exp.experimentId);
      console.log('📐 Steady-State Hypothesis Validation:');
      console.log('─────────────────────────────────────────');
      for (const h of hypotheses) {
        const icon = h.passed ? '✅' : '❌';
        console.log(`  ${icon} ${h.metric} ${h.operator} ${h.threshold} → actual: ${h.actual} [${h.passed ? 'PASS' : 'FAIL'}]`);
      }
      console.log();
      console.log('✅ Chaos experiment complete.\n');
    });
}

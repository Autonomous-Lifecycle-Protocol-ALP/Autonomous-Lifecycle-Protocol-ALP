import { Command } from 'commander';
import { FeatureFlagEngine } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerFeatureFlagCommand(program: Command) {
  program
    .command('feature-flag')
    .description('Manage feature flags for agent workflows: create, evaluate, toggle, kill (v74.0.0)')
    .option('--create <name>', 'Create a new feature flag')
    .option('--status <status>', 'Flag status: ENABLED, DISABLED, ROLLOUT, EXPERIMENT', 'DISABLED')
    .option('--rollout <n>', 'Rollout percentage (0-100)', parseInt)
    .option('--evaluate <flagId>', 'Evaluate a flag for a given agent')
    .option('--agent <id>', 'Agent ID for evaluation', 'agent-executor-1')
    .option('--env <env>', 'Target environment', 'production')
    .option('--kill <flagId>', 'Activate kill switch for a flag')
    .option('--list', 'List all feature flags')
    .action((options) => {
      const engine = new FeatureFlagEngine();

      // Seed demo flags
      const f1 = engine.createFlag('New Consensus Algorithm', 'Upgraded BFT consensus v3', {
        status: 'ROLLOUT',
        rolloutPercentage: 30,
        targetEnvironments: ['staging', 'production'],
        variants: [
          { variantId: 'control', name: 'BFT v2', weight: 50, payload: { algorithm: 'bft-v2' } },
          { variantId: 'treatment', name: 'BFT v3', weight: 50, payload: { algorithm: 'bft-v3' } },
        ],
      });

      const f2 = engine.createFlag('Enhanced Telemetry', 'Extended pub/sub metrics collection', {
        status: 'ENABLED',
        targetEnvironments: ['production'],
      });

      const f3 = engine.createFlag('Experimental Scheduler', 'ML-based task scheduler', {
        status: 'EXPERIMENT',
        rolloutPercentage: 50,
        variants: [
          { variantId: 'fifo', name: 'FIFO Scheduler', weight: 33, payload: { scheduler: 'fifo' } },
          { variantId: 'priority', name: 'Priority Queue', weight: 34, payload: { scheduler: 'priority' } },
          { variantId: 'ml', name: 'ML Predictor', weight: 33, payload: { scheduler: 'ml-v1' } },
        ],
      });

      console.log('\n🚩 Feature Flag Engine (v74.0.0)');
      console.log('==================================\n');

      if (options.create) {
        const flag = engine.createFlag(options.create, 'User-created flag', {
          status: options.status,
          rolloutPercentage: options.rollout || 0,
        });
        console.log(`  ✅ Created flag: ${flag.flagId}`);
        console.log(`     Name:     ${flag.name}`);
        console.log(`     Status:   ${flag.status}`);
        console.log(`     Rollout:  ${flag.rolloutPercentage}%`);
        console.log();
        return;
      }

      // List flags
      const flags = engine.getFlags();
      console.log('📋 Feature Flags:');
      console.log('─────────────────────────────────────────────────────────────────');
      console.log('  Name                          Status       Rollout  Variants  Kill');
      console.log('─────────────────────────────────────────────────────────────────');
      for (const f of flags) {
        const statusIcon = f.status === 'ENABLED' ? '🟢' : f.status === 'ROLLOUT' ? '🟡' : f.status === 'EXPERIMENT' ? '🔬' : '⚫';
        console.log(`  ${statusIcon} ${f.name.padEnd(28)} ${f.status.padEnd(13)}${String(f.rolloutPercentage + '%').padEnd(9)}${String(f.variants.length).padEnd(10)}${f.killSwitch ? '🔴' : '⚪'}`);
      }
      console.log();

      // Evaluate each flag for the target agent
      console.log('🎯 Flag Evaluations:');
      console.log('─────────────────────────────────────────────────────────────────');
      for (const f of flags) {
        const ev = engine.evaluate(f.flagId, options.agent, options.env);
        const icon = ev.enabled ? '✅' : '❌';
        const variantInfo = ev.variant ? ` → variant: ${ev.variant.name}` : '';
        console.log(`  ${icon} ${f.name.padEnd(28)} ${ev.reason.padEnd(22)}${variantInfo}`);
      }
      console.log();

      // Audit log
      const audit = engine.getAuditLog();
      console.log(`📜 Audit Log (${audit.length} entries):`);
      console.log('─────────────────────────────────────────────────────────────────');
      for (const entry of audit.slice(-5)) {
        console.log(`  [${entry.action.padEnd(10)}] ${entry.details}`);
      }
      console.log();
      console.log('✅ Feature flag inspection complete.\n');
    });
}

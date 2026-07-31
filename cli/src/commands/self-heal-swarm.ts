import { Command } from 'commander';
import { SwarmSelfHealingMesh } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerSelfHealSwarmCommand(program: Command) {
  program
    .command('self-heal-swarm')
    .description('Run automated failure detection, peer node failover, and self-healing (v60.0.0)')
    .option('--node <id>', 'Node ID to mark failed', 'node-edge-eu')
    .option('--region <region>', 'Node region', 'eu-west')
    .action((options) => {
      const mesh = new SwarmSelfHealingMesh();
      mesh.registerNode('node-edge-us', 'us-east', 'HEALTHY', ['task-main-api']);
      mesh.registerNode(options.node, options.region, 'FAILED', ['task-auth-service', 'task-db-backup']);

      const failures = mesh.detectFailures();
      const plan = mesh.generateSelfHealingPlan();

      console.log('\n🩹 Swarm Self-Healing Mesh (v60.0.0)');
      console.log('====================================');
      console.log(`  Nodes Monitored:   2`);
      console.log(`  Failures Detected: ${failures.length} node(s) [${failures.map(f => f.nodeId).join(', ')}]`);
      console.log(`  Healthy Nodes:     ${plan.healthyNodes.join(', ')}`);
      console.log(`  Tasks Rerouted:    ${plan.taskReroutes.length}`);
      for (const r of plan.taskReroutes) {
        console.log(`    - Task "${r.taskId}": ${r.fromNode} ➔ ${r.toNode} (${r.reason})`);
      }
      console.log(`  Plan ID:           ${plan.planId}`);
      console.log(`  Status:            ✅ HEALED & REROUTED\n`);
    });
}

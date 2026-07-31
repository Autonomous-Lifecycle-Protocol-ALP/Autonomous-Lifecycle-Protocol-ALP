import { Command } from 'commander';
import { SwarmSelfHealingMesh } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerSelfHealSwarmCommand(program: Command) {
  program
    .command('self-heal-swarm')
    .description('Autonomous Swarm Self-Healing Mesh & Failure Recovery (v80.0.0)')
    .option('--simulate-failure <nodeId>', 'Simulate node failure')
    .action((options) => {
      const mesh = new SwarmSelfHealingMesh();
      mesh.registerNode('node-us-east-1', 'us-east-1', 'HEALTHY', ['task-auth-service', 'task-db-migrations']);
      mesh.registerNode('node-eu-central-1', 'eu-central-1', 'HEALTHY', ['task-analytics']);
      mesh.registerNode('node-ap-south-1', 'ap-south-1', 'FAILED', ['task-payment-gateway']);

      if (options.simulateFailure) {
        mesh.registerNode(options.simulateFailure, 'custom-region', 'FAILED', ['task-failover-test']);
      }

      const failures = mesh.detectFailures();
      const plan = mesh.generateSelfHealingPlan();

      console.log('\n🛡️ Autonomous Swarm Self-Healing Mesh (v80.0.0)');
      console.log('==============================================');
      console.log(`  Failed Nodes:   ${plan.failedNodes.length} (${plan.failedNodes.join(', ')})`);
      console.log(`  Healthy Nodes:  ${plan.healthyNodes.length} (${plan.healthyNodes.join(', ')})`);
      console.log(`  Task Reroutes:  ${plan.taskReroutes.length}`);
      plan.taskReroutes.forEach((r) => {
        console.log(`    - ${r.taskId}: ${r.fromNode} ➔ ${r.toNode} (${r.reason})`);
      });
      console.log();
    });
}

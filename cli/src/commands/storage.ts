import { Command } from 'commander';
import { LocalStorageContainer } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerStorageCommand(program: Command) {
  program
    .command('storage')
    .description('Manage isolated local storage container & namespace metrics (v78.0.0)')
    .option('--namespace <name>', 'Namespace to target', 'default')
    .option('--set <key=value>', 'Set key=value pair in namespace')
    .option('--get <key>', 'Get value for key')
    .option('--list', 'List items in namespace')
    .option('--metrics', 'Show container storage health & byte quotas')
    .action((options) => {
      const container = new LocalStorageContainer();

      // Seed default values for demonstration
      container.set('default', 'session_id', 'sess-094182');
      container.set('default', 'agent_role', 'autonomous-architect');
      container.set('agent-cache', 'ast_version', '78.0.0');

      console.log('\n📦 Local Storage Container & Namespace Manager (v78.0.0)');
      console.log('========================================================');

      if (options.set) {
        const [k, v] = options.set.split('=');
        const item = container.set(options.namespace, k, v);
        console.log(`  [SET] Key "${k}" saved to namespace "${options.namespace}" (${item.sizeBytes} bytes, checksum: ${item.checksum})`);
      } else if (options.get) {
        const val = container.get(options.namespace, options.get);
        console.log(`  [GET] Namespace: "${options.namespace}" | Key: "${options.get}"`);
        console.log(`  Value: ${JSON.stringify(val ?? '<NOT_FOUND>')}`);
      } else if (options.list) {
        const items = container.listNamespace(options.namespace);
        console.log(`  Namespace: "${options.namespace}" (${items.length} items):`);
        items.forEach((it) => {
          console.log(`    - ${it.key}: ${JSON.stringify(it.value)} (${it.sizeBytes}B)`);
        });
      } else {
        const metrics = container.getMetrics();
        console.log(`  Total Items:      ${metrics.totalItems}`);
        console.log(`  Total Bytes Used: ${metrics.totalBytesUsed} / ${metrics.quotaBytes} bytes`);
        console.log(`  Active Namespaces: ${metrics.namespaces.join(', ')}`);
        console.log(`  Active / Expired:  ${metrics.activeItems} active | ${metrics.expiredItems} expired`);
      }
      console.log();
    });
}

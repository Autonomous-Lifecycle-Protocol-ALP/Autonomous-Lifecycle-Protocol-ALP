import { Command } from 'commander';
import { TelemetryInspector } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerTelemetryInspectCommand(program: Command) {
  program
    .command('telemetry-inspect')
    .description('Inspect pub/sub telemetry: topic metrics, subscription health, and DLQ alerts (v70.0.0)')
    .option('--topic <name>', 'Inspect a specific topic')
    .option('--subscriptions', 'Show subscription health summary')
    .option('--dlq', 'Show dead-letter queue alerts')
    .action((options) => {
      const inspector = new TelemetryInspector();

      // Seed demo data
      inspector.recordMessage('orders.created', 'PUBLISHED');
      inspector.recordMessage('orders.created', 'PUBLISHED');
      inspector.recordMessage('orders.created', 'DELIVERED');
      inspector.recordMessage('payments.processed', 'PUBLISHED');
      inspector.recordMessage('payments.processed', 'DELIVERED');
      inspector.recordMessage('payments.processed', 'FAILED');
      inspector.recordMessage('notifications.email', 'PUBLISHED');
      inspector.recordMessage('notifications.email', 'PUBLISHED');
      inspector.recordMessage('notifications.email', 'DELIVERED');
      inspector.recordMessage('notifications.email', 'DELIVERED');

      inspector.updateSubscriptionHealth('sub-orders-1', 'orders.created', 'order-service', 'HEALTHY', 0);
      inspector.updateSubscriptionHealth('sub-payments-1', 'payments.processed', 'payment-gateway', 'DEGRADED', 12);
      inspector.updateSubscriptionHealth('sub-email-1', 'notifications.email', 'email-worker', 'HEALTHY', 2);

      console.log('\n📡 Pub/Sub Telemetry Inspector (v70.0.0)');
      console.log('=========================================\n');

      // Topic Metrics
      const metrics = inspector.getTopicMetrics();
      const filtered = options.topic
        ? metrics.filter(m => m.topic === options.topic)
        : metrics;

      console.log('📊 Topic Metrics:');
      console.log('─────────────────────────────────────────────────────────────────');
      console.log('  Topic                     Published  Delivered  Failed  Throughput');
      console.log('─────────────────────────────────────────────────────────────────');
      for (const m of filtered) {
        const t = m.topic.padEnd(26);
        const pub = String(m.messagesPublished).padEnd(11);
        const del = String(m.messagesDelivered).padEnd(11);
        const fail = String(m.messagesFailed).padEnd(8);
        console.log(`  ${t}${pub}${del}${fail}${m.throughputMsgPerSec} msg/s`);
      }
      console.log();

      // Subscription Health
      if (options.subscriptions !== false) {
        const subs = inspector.getSubscriptionHealth();
        console.log('🔗 Subscription Health:');
        console.log('─────────────────────────────────────────────────────────────────');
        for (const s of subs) {
          const statusIcon = s.status === 'HEALTHY' ? '🟢' : s.status === 'DEGRADED' ? '🟡' : '🔴';
          console.log(`  ${statusIcon} ${s.subscriptionId.padEnd(22)} ${s.topic.padEnd(26)} ${s.status.padEnd(10)} unacked: ${s.unackedCount}`);
        }
        console.log();
      }

      // DLQ Alerts
      const dlqAlerts = inspector.getDLQAlerts();
      if (dlqAlerts.length > 0 || options.dlq) {
        console.log('🚨 Dead-Letter Queue Alerts:');
        console.log('─────────────────────────────────────────────────────────────────');
        if (dlqAlerts.length === 0) {
          console.log('  No DLQ alerts. All messages delivered successfully.');
        } else {
          for (const a of dlqAlerts) {
            console.log(`  ⚠️  [${a.alertId}] topic=${a.topic} reason="${a.reason}"`);
          }
        }
        console.log();
      }

      console.log('✅ Telemetry inspection complete.\n');
    });
}

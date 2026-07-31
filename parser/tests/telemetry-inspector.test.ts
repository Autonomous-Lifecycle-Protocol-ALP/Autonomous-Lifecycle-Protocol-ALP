import { describe, it, expect } from 'vitest';
import { TelemetryInspector } from '../src/telemetry-inspector';

describe('v70.0.0 TelemetryInspector — Pub/Sub Telemetry Inspector & Real-Time Flow Visualizer', () => {
  it('records message publishing and calculates topic metrics', () => {
    const inspector = new TelemetryInspector();
    inspector.recordMessage('agent.events', 'PUBLISHED');
    inspector.recordMessage('agent.events', 'DELIVERED');

    const metrics = inspector.getTopicMetrics();
    expect(metrics.length).toBe(1);
    expect(metrics[0].topic).toBe('agent.events');
    expect(metrics[0].messagesPublished).toBe(1);
    expect(metrics[0].messagesDelivered).toBe(1);
  });

  it('triggers dead-letter queue (DLQ) alert on failed messages', () => {
    const inspector = new TelemetryInspector();
    inspector.recordMessage('workflow.tasks', 'FAILED');

    const alerts = inspector.getDLQAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].topic).toBe('workflow.tasks');
    expect(alerts[0].reason).toContain('failed');
  });

  it('tracks subscription health status', () => {
    const inspector = new TelemetryInspector();
    inspector.updateSubscriptionHealth('sub-1', 'agent.events', 'consumer-alpha', 'HEALTHY', 0);
    inspector.updateSubscriptionHealth('sub-2', 'agent.events', 'consumer-beta', 'DEGRADED', 14);

    const health = inspector.getSubscriptionHealth();
    expect(health.length).toBe(2);
    expect(health[0].status).toBe('HEALTHY');
    expect(health[1].status).toBe('DEGRADED');
    expect(health[1].unackedCount).toBe(14);
  });
});

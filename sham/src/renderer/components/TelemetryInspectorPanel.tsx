import React, { useState } from 'react';

interface TopicMetric {
  topic: string;
  published: number;
  delivered: number;
  failed: number;
  throughput: number;
}

interface SubHealth {
  id: string;
  topic: string;
  consumer: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DEAD';
  unacked: number;
}

interface DLQAlert {
  id: string;
  topic: string;
  reason: string;
  time: string;
}

const INITIAL_TOPICS: TopicMetric[] = [
  { topic: 'orders.created', published: 1284, delivered: 1271, failed: 13, throughput: 42.8 },
  { topic: 'payments.processed', published: 892, delivered: 876, failed: 16, throughput: 29.7 },
  { topic: 'notifications.email', published: 3410, delivered: 3408, failed: 2, throughput: 113.7 },
  { topic: 'inventory.updated', published: 567, delivered: 567, failed: 0, throughput: 18.9 },
  { topic: 'analytics.events', published: 12450, delivered: 12301, failed: 149, throughput: 415.0 },
];

const INITIAL_SUBS: SubHealth[] = [
  { id: 'sub-orders-1', topic: 'orders.created', consumer: 'order-service', status: 'HEALTHY', unacked: 0 },
  { id: 'sub-payments-1', topic: 'payments.processed', consumer: 'payment-gateway', status: 'DEGRADED', unacked: 12 },
  { id: 'sub-email-1', topic: 'notifications.email', consumer: 'email-worker', status: 'HEALTHY', unacked: 2 },
  { id: 'sub-inventory-1', topic: 'inventory.updated', consumer: 'warehouse-sync', status: 'HEALTHY', unacked: 0 },
  { id: 'sub-analytics-1', topic: 'analytics.events', consumer: 'analytics-ingester', status: 'DEAD', unacked: 149 },
];

const INITIAL_DLQ: DLQAlert[] = [
  { id: 'dlq-001', topic: 'payments.processed', reason: 'Max retries exceeded (gateway timeout)', time: '2 min ago' },
  { id: 'dlq-002', topic: 'analytics.events', reason: 'Consumer disconnected', time: '5 min ago' },
  { id: 'dlq-003', topic: 'orders.created', reason: 'Schema validation failed', time: '12 min ago' },
];

type TabId = 'topics' | 'subscriptions' | 'dlq';

export function TelemetryInspectorPanel(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('topics');
  const [topics] = useState<TopicMetric[]>(INITIAL_TOPICS);
  const [subs] = useState<SubHealth[]>(INITIAL_SUBS);
  const [dlqAlerts] = useState<DLQAlert[]>(INITIAL_DLQ);

  const totalPublished = topics.reduce((s, t) => s + t.published, 0);
  const totalDelivered = topics.reduce((s, t) => s + t.delivered, 0);
  const totalFailed = topics.reduce((s, t) => s + t.failed, 0);
  const deliveryRate = totalPublished > 0 ? ((totalDelivered / totalPublished) * 100).toFixed(1) : '0';

  const statusColor = (s: string) => s === 'HEALTHY' ? 'var(--accent-green)' : s === 'DEGRADED' ? 'var(--accent-yellow)' : 'var(--accent-red)';
  const statusDot = (s: string) => s === 'HEALTHY' ? '●' : s === 'DEGRADED' ? '▲' : '✖';

  const s = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const },
    header: { padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' as const },
    kpiRow: { display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-xs) var(--spacing-md)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
    kpi: (accent: string) => ({
      flex: 1, minWidth: '120px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'var(--spacing-sm)',
      border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 4,
    }),
    kpiLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    kpiValue: (accent: string) => ({ fontSize: 'clamp(1rem, 3vw, 1.3rem)', fontWeight: 700, color: accent }),
    tabs: { display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
    tab: (active: boolean) => ({
      padding: '8px 20px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600,
      color: active ? 'var(--accent)' : 'var(--text-muted)', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
      background: 'transparent', border: 'none',
    }),
    body: { flex: 1, overflow: 'auto', padding: 'var(--spacing-sm)' },
  };

  return (
    <div style={s.container}>
      <div className="panel-header" style={s.header}>
        <div className="flex-wrap-gap">
          <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}>📡</span>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--accent)' }}>Pub/Sub Telemetry Inspector</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent)22', color: 'var(--accent)', border: '1px solid var(--accent)44' }}>v70.0.0</span>
        </div>
        <div className="flex-wrap-gap">
          <span className="badge badge-responsive" style={{ background: 'var(--accent-green)22', color: 'var(--accent-green)', border: '1px solid var(--accent-green)33' }}>Live</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent-blue)22', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)33' }}>{topics.length} Topics</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={s.kpiRow}>
        <div style={s.kpi('var(--accent-blue)')}>
          <div style={s.kpiLabel}>Total Published</div>
          <div style={s.kpiValue('var(--accent-blue)')}>{totalPublished.toLocaleString()}</div>
        </div>
        <div style={s.kpi('var(--accent-green)')}>
          <div style={s.kpiLabel}>Total Delivered</div>
          <div style={s.kpiValue('var(--accent-green)')}>{totalDelivered.toLocaleString()}</div>
        </div>
        <div style={s.kpi('var(--accent-red)')}>
          <div style={s.kpiLabel}>Total Failed</div>
          <div style={s.kpiValue('var(--accent-red)')}>{totalFailed.toLocaleString()}</div>
        </div>
        <div style={s.kpi('var(--accent)')}>
          <div style={s.kpiLabel}>Delivery Rate</div>
          <div style={s.kpiValue('var(--accent)')}>{deliveryRate}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(activeTab === 'topics')} onClick={() => setActiveTab('topics')}>📊 Topic Metrics</button>
        <button style={s.tab(activeTab === 'subscriptions')} onClick={() => setActiveTab('subscriptions')}>🔗 Subscriptions</button>
        <button style={s.tab(activeTab === 'dlq')} onClick={() => setActiveTab('dlq')}>
          🚨 DLQ Alerts {dlqAlerts.length > 0 && <span className="badge badge-responsive" style={{ marginLeft: 6, background: 'var(--accent-red)22', color: 'var(--accent-red)', border: '1px solid var(--accent-red)33' }}>{dlqAlerts.length}</span>}
        </button>
      </div>

      {/* Body */}
      <div style={s.body}>
        {activeTab === 'topics' && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Published</th>
                  <th>Delivered</th>
                  <th>Failed</th>
                  <th>Throughput</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {topics.map(t => {
                  const rate = t.published > 0 ? (t.delivered / t.published) * 100 : 100;
                  const health = rate >= 99 ? 'HEALTHY' : rate >= 95 ? 'DEGRADED' : 'DEAD';
                  return (
                    <tr key={t.topic}>
                      <td style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontWeight: 600 }}>{t.topic}</td>
                      <td>{t.published.toLocaleString()}</td>
                      <td style={{ color: 'var(--accent-green)' }}>{t.delivered.toLocaleString()}</td>
                      <td style={{ color: t.failed > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{t.failed}</td>
                      <td style={{ color: 'var(--accent)' }}>{t.throughput} msg/s</td>
                      <td><span className="badge badge-responsive" style={{ background: statusColor(health) + '18', color: statusColor(health), border: '1px solid ' + statusColor(health) + '33' }}>{statusDot(health)} {health}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Subscription</th>
                  <th>Topic</th>
                  <th>Consumer</th>
                  <th>Status</th>
                  <th>Unacked</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(sub => (
                  <tr key={sub.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{sub.id}</td>
                    <td style={{ color: 'var(--accent-blue)' }}>{sub.topic}</td>
                    <td>{sub.consumer}</td>
                    <td><span className="badge badge-responsive" style={{ background: statusColor(sub.status) + '18', color: statusColor(sub.status), border: '1px solid ' + statusColor(sub.status) + '33' }}>{statusDot(sub.status)} {sub.status}</span></td>
                    <td style={{ color: sub.unacked > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>{sub.unacked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'dlq' && (
          <div>
            {dlqAlerts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">No dead-letter queue alerts</div>
                <div className="empty-state-desc">All messages are being delivered successfully.</div>
              </div>
            ) : (
              dlqAlerts.map(a => (
                <div key={a.id} className="alert-card card">
                  <span style={{ fontSize: 'var(--font-size-md)', marginTop: 2 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--accent-red)' }}>{a.id}</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{a.time}</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', marginTop: 4 }}>{a.reason}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-blue)', marginTop: 4, fontFamily: 'monospace' }}>topic: {a.topic}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

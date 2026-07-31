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

  const statusColor = (s: string) => s === 'HEALTHY' ? '#4ade80' : s === 'DEGRADED' ? '#fbbf24' : '#f87171';
  const statusDot = (s: string) => s === 'HEALTHY' ? '●' : s === 'DEGRADED' ? '▲' : '✖';

  const s = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: '#0a0a14', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
    header: { padding: '14px 20px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    kpiRow: { display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid #1e2035', background: '#0e1020' },
    kpi: (accent: string) => ({
      flex: 1, background: '#16182a', borderRadius: 10, padding: '14px 16px',
      border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 4,
    }),
    kpiLabel: { fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1 },
    kpiValue: (accent: string) => ({ fontSize: 22, fontWeight: 700, color: accent }),
    tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #1e2035' },
    tab: (active: boolean) => ({
      padding: '10px 20px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
      color: active ? '#a78bfa' : '#6b7280', borderBottom: active ? '2px solid #a78bfa' : '2px solid transparent',
      background: 'transparent', border: 'none',
    }),
    body: { flex: 1, overflow: 'auto', padding: 20 },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 },
    th: { textAlign: 'left' as const, padding: '8px 12px', borderBottom: '1px solid #1e2035', color: '#6b7280', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    td: { padding: '10px 12px', borderBottom: '1px solid #1e203522' },
    badge: (color: string) => ({
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 12, background: color + '18', color,
      fontSize: 11, fontWeight: 600, border: `1px solid ${color}33`,
    }),
    alertCard: { background: '#16182a', borderRadius: 8, padding: '12px 16px', border: '1px solid #f8717133', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#a78bfa' }}>Pub/Sub Telemetry Inspector</span>
          <span style={{ fontSize: 10, background: '#a78bfa22', color: '#a78bfa', padding: '2px 8px', borderRadius: 10 }}>v70.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={s.badge('#4ade80')}>Live</span>
          <span style={s.badge('#4fc3f7')}>{topics.length} Topics</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={s.kpiRow}>
        <div style={s.kpi('#4fc3f7')}>
          <div style={s.kpiLabel}>Total Published</div>
          <div style={s.kpiValue('#4fc3f7')}>{totalPublished.toLocaleString()}</div>
        </div>
        <div style={s.kpi('#4ade80')}>
          <div style={s.kpiLabel}>Total Delivered</div>
          <div style={s.kpiValue('#4ade80')}>{totalDelivered.toLocaleString()}</div>
        </div>
        <div style={s.kpi('#f87171')}>
          <div style={s.kpiLabel}>Total Failed</div>
          <div style={s.kpiValue('#f87171')}>{totalFailed.toLocaleString()}</div>
        </div>
        <div style={s.kpi('#a78bfa')}>
          <div style={s.kpiLabel}>Delivery Rate</div>
          <div style={s.kpiValue('#a78bfa')}>{deliveryRate}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(activeTab === 'topics')} onClick={() => setActiveTab('topics')}>📊 Topic Metrics</button>
        <button style={s.tab(activeTab === 'subscriptions')} onClick={() => setActiveTab('subscriptions')}>🔗 Subscriptions</button>
        <button style={s.tab(activeTab === 'dlq')} onClick={() => setActiveTab('dlq')}>
          🚨 DLQ Alerts {dlqAlerts.length > 0 && <span style={{ marginLeft: 6, background: '#f8717133', color: '#f87171', borderRadius: 8, padding: '1px 6px', fontSize: 10 }}>{dlqAlerts.length}</span>}
        </button>
      </div>

      {/* Body */}
      <div style={s.body}>
        {activeTab === 'topics' && (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Topic</th>
                <th style={s.th}>Published</th>
                <th style={s.th}>Delivered</th>
                <th style={s.th}>Failed</th>
                <th style={s.th}>Throughput</th>
                <th style={s.th}>Health</th>
              </tr>
            </thead>
            <tbody>
              {topics.map(t => {
                const rate = t.published > 0 ? (t.delivered / t.published) * 100 : 100;
                const health = rate >= 99 ? 'HEALTHY' : rate >= 95 ? 'DEGRADED' : 'DEAD';
                return (
                  <tr key={t.topic}>
                    <td style={{ ...s.td, color: '#4fc3f7', fontFamily: 'monospace', fontWeight: 600 }}>{t.topic}</td>
                    <td style={s.td}>{t.published.toLocaleString()}</td>
                    <td style={{ ...s.td, color: '#4ade80' }}>{t.delivered.toLocaleString()}</td>
                    <td style={{ ...s.td, color: t.failed > 0 ? '#f87171' : '#4ade80' }}>{t.failed}</td>
                    <td style={{ ...s.td, color: '#a78bfa' }}>{t.throughput} msg/s</td>
                    <td style={s.td}><span style={s.badge(statusColor(health))}>{statusDot(health)} {health}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'subscriptions' && (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Subscription</th>
                <th style={s.th}>Topic</th>
                <th style={s.th}>Consumer</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Unacked</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(sub => (
                <tr key={sub.id}>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 600 }}>{sub.id}</td>
                  <td style={{ ...s.td, color: '#4fc3f7' }}>{sub.topic}</td>
                  <td style={s.td}>{sub.consumer}</td>
                  <td style={s.td}><span style={s.badge(statusColor(sub.status))}>{statusDot(sub.status)} {sub.status}</span></td>
                  <td style={{ ...s.td, color: sub.unacked > 0 ? '#fbbf24' : '#4ade80' }}>{sub.unacked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'dlq' && (
          <div>
            {dlqAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No dead-letter queue alerts</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>All messages are being delivered successfully.</div>
              </div>
            ) : (
              dlqAlerts.map(a => (
                <div key={a.id} style={s.alertCard}>
                  <span style={{ fontSize: 18, marginTop: 2 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 12, color: '#f87171' }}>{a.id}</span>
                      <span style={{ fontSize: 10, color: '#6b7280' }}>{a.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#e0e0e0', marginTop: 4 }}>{a.reason}</div>
                    <div style={{ fontSize: 11, color: '#4fc3f7', marginTop: 4, fontFamily: 'monospace' }}>topic: {a.topic}</div>
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

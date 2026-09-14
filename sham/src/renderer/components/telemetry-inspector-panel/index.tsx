import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { INITIAL_TOPICS, INITIAL_SUBS, INITIAL_DLQ, s } from './shared.js';
import { EventList } from './EventList.js';
import { EventDetail } from './EventDetail.js';

export function TelemetryInspectorPanel(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('topics');
  const [topicsState] = useState(INITIAL_TOPICS);
  const [subsState] = useState(INITIAL_SUBS);
  const [dlqState] = useState(INITIAL_DLQ);

  const totalPublished = topicsState.reduce((s, t) => s + t.published, 0);
  const totalDelivered = topicsState.reduce((s, t) => s + t.delivered, 0);
  const totalFailed = topicsState.reduce((s, t) => s + t.failed, 0);
  const deliveryRate = totalPublished > 0 ? ((totalDelivered / totalPublished) * 100).toFixed(1) : '0';

  return (
    <div style={s.container}>
      <div className="panel-header" style={s.header}>
        <div className="flex-wrap-gap">
          <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}><Icon name="wifi" size={18} /></span>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--accent)' }}>Pub/Sub Telemetry Inspector</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent)22', color: 'var(--accent)', border: '1px solid var(--accent)44' }}>v70.0.0</span>
        </div>
        <div className="flex-wrap-gap">
          <span className="badge badge-responsive" style={{ background: 'var(--accent-green)22', color: 'var(--accent-green)', border: '1px solid var(--accent-green)33' }}>Live</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent-blue)22', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)33' }}>{topicsState.length} Topics</span>
        </div>
      </div>

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

      <div style={s.tabs}>
        <button style={s.tab(activeTab === 'topics')} onClick={() => setActiveTab('topics')}><Icon name="barChart2" size={14} /> Topic Metrics</button>
        <button style={s.tab(activeTab === 'subscriptions')} onClick={() => setActiveTab('subscriptions')}><Icon name="link" size={14} /> Subscriptions</button>
        <button style={s.tab(activeTab === 'dlq')} onClick={() => setActiveTab('dlq')}>
          <Icon name="alertTriangle" size={14} /> DLQ Alerts {dlqState.length > 0 && <span className="badge badge-responsive" style={{ marginLeft: 6, background: 'var(--accent-red)22', color: 'var(--accent-red)', border: '1px solid var(--accent-red)33' }}>{dlqState.length}</span>}
        </button>
      </div>

      <EventList topics={topicsState} subs={subsState} activeTab={activeTab} onTabChange={setActiveTab} />
      <EventDetail dlqAlerts={dlqState} activeTab={activeTab} />
    </div>
  );
}

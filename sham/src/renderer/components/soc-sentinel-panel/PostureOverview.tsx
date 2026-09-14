import React from 'react';
import { SentinelDashboard } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface PostureOverviewProps {
  dashboard: SentinelDashboard;
  onSimulateThreat: () => void;
  onNavigateTab: (tab: 'alerts' | 'incidents' | 'rules' | 'surface') => void;
}

export function PostureOverview({
  dashboard,
  onSimulateThreat,
  onNavigateTab,
}: PostureOverviewProps): React.JSX.Element {
  const scoreColor = dashboard.postureScore >= 80 ? 'var(--accent-green)' : dashboard.postureScore >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '4px' }}>
      {/* Top Banner with Posture Score */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              border: `4px solid ${scoreColor}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
            }}
          >
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor }}>{dashboard.postureScore}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>POSTURE</span>
          </div>

          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Swarm Security Operations Status
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Real-time threat monitoring and auto-remediation active for all connected agents.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.8rem' }}>
              <span>MTTD: <strong>{dashboard.meanTimeToDetectMs}ms</strong></span>
              <span>·</span>
              <span>MTTR: <strong>{dashboard.meanTimeToRespondMs}ms</strong></span>
              <span>·</span>
              <span>Overall Risk: <strong style={{ color: dashboard.overallRiskScore > 50 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{dashboard.overallRiskScore}/100</strong></span>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={onSimulateThreat}
          data-testid="simulate-threat-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--accent-red)' }}
        >
          <Icon name="alertTriangle" size={16} /> Simulate Threat Ingestion
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        <div
          onClick={() => onNavigateTab('rules')}
          style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE RULES</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '4px' }}>
            {dashboard.activeRulesCount}/{dashboard.totalRules}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('alerts')}
          style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>OPEN ALERTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-yellow)', marginTop: '4px' }}>
            {dashboard.openAlerts}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('alerts')}
          style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CRITICAL THREATS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-red)', marginTop: '4px' }}>
            {dashboard.criticalAlerts}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('incidents')}
          style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE INCIDENTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>
            {dashboard.openIncidents}/{dashboard.totalIncidents}
          </div>
        </div>
      </div>

      {/* Top Threats List */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', padding: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700 }}>
          Top Detected Threat Signatures
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dashboard.topThreats.map((t, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent-red)' }}><Icon name="shield" size={14} /></span>
                <span style={{ fontWeight: 600 }}>{t.rule}</span>
              </div>
              <span className="badge" style={{ background: 'var(--accent-red)22', color: 'var(--accent-red)' }}>
                {t.count} match(es)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

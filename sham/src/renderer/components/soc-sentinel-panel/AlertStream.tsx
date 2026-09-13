import React, { useState } from 'react';
import { ThreatAlert, ThreatSeverity } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface AlertStreamProps {
  alerts: ThreatAlert[];
  onEscalateToIncident: (alertId: string) => void;
}

export function AlertStream({ alerts, onEscalateToIncident }: AlertStreamProps): React.JSX.Element {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filtered = alerts.filter(a => {
    return filterSeverity === 'all' || a.severity === filterSeverity;
  });

  const severityColor = (sev: ThreatSeverity) => {
    switch (sev) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Threat Alerts Stream
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Live security anomalies and pattern matches triggered across the agent mesh.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              style={{
                background: filterSeverity === s ? 'var(--accent)' : 'var(--bg-secondary)',
                color: filterSeverity === s ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${filterSeverity === s ? 'var(--accent)' : 'var(--border)'}`,
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <Icon name="checkCircle" size={32} />
            <div style={{ marginTop: '8px' }}>No alerts matching the selected filter. Clean posture!</div>
          </div>
        ) : (
          filtered.map(alert => {
            const sColor = severityColor(alert.severity);

            return (
              <div
                key={alert.alertId}
                style={{
                  background: 'var(--bg-secondary)',
                  borderLeft: `4px solid ${sColor}`,
                  borderTop: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
                data-testid={`alert-item-${alert.alertId}`}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: `${sColor}22`,
                        color: sColor,
                        border: `1px solid ${sColor}44`,
                      }}
                    >
                      {alert.severity}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{alert.ruleName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>from <strong>{alert.source}</strong></span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {alert.description}
                  </p>

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                    <span>Pattern: <code>{alert.matchedPattern}</code></span>
                    <span>Action: <strong style={{ color: 'var(--accent-blue)' }}>{alert.suggestedAction}</strong></span>
                    <span>Status: <strong style={{ color: alert.status === 'OPEN' ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>{alert.status}</strong></span>
                  </div>
                </div>

                {alert.status === 'OPEN' && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onEscalateToIncident(alert.alertId)}
                    data-testid={`escalate-btn-${alert.alertId}`}
                    style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Escalate to Incident
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

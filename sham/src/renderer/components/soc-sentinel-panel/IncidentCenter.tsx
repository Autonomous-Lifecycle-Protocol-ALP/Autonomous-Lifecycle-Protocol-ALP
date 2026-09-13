import React from 'react';
import { IncidentReport } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface IncidentCenterProps {
  incidents: IncidentReport[];
  onAutoRemediate: (incidentId: string) => void;
}

export function IncidentCenter({ incidents, onAutoRemediate }: IncidentCenterProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px', overflowY: 'auto' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Security Incident & Remediation Center
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Escalated incident reports with automated containment countermeasures.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {incidents.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <Icon name="shield" size={32} />
            <div style={{ marginTop: '8px' }}>No active incidents. Escalate an alert to create an incident.</div>
          </div>
        ) : (
          incidents.map(inc => {
            const isResolved = inc.status === 'RESOLVED' || inc.status === 'REMEDIATED';

            return (
              <div
                key={inc.incidentId}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: `1px solid ${isResolved ? 'var(--accent-green)44' : 'var(--accent-red)44'}`,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
                data-testid={`incident-card-${inc.incidentId}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="badge"
                      style={{
                        background: isResolved ? 'var(--accent-green)22' : 'var(--accent-red)22',
                        color: isResolved ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}
                    >
                      {inc.status}
                    </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{inc.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      ({inc.incidentId})
                    </span>
                  </div>

                  {!isResolved && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onAutoRemediate(inc.incidentId)}
                      data-testid={`remediate-btn-${inc.incidentId}`}
                      style={{ background: 'var(--accent-green)', color: '#fff', padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      Execute Auto-Remediation
                    </button>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {inc.description}
                </p>

                {/* Remediation Steps */}
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '10px 14px', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    COUNTERMEASURE ACTIONS:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {inc.remediationSteps.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: step.status === 'COMPLETED' ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
                          <Icon name={step.status === 'COMPLETED' ? 'checkCircle' : 'activity'} size={14} />
                        </span>
                        <span style={{ fontWeight: 600 }}>{step.action}</span>
                        <span style={{ color: 'var(--text-muted)' }}>→ {step.target}</span>
                        {step.result && <span style={{ color: 'var(--accent-green)', marginLeft: 'auto' }}>{step.result}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Created: {new Date(inc.createdAt).toLocaleTimeString()}</span>
                  <span>MTTD: {inc.timeToDetectMs}ms</span>
                  {inc.timeToRespondMs && <span>MTTR: {inc.timeToRespondMs}ms</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

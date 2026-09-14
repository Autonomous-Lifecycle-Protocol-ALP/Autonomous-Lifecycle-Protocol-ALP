import React from 'react';
import { AttackSurfaceReport } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface SurfaceScannerProps {
  report: AttackSurfaceReport | null;
  onRunScan: () => void;
  loading: boolean;
}

export function SurfaceScanner({ report, onRunScan, loading }: SurfaceScannerProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Swarm Attack Surface Scanner
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Discovers open ports, exposed RPC endpoints, over-privileged agents, and credential risks.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={onRunScan}
          disabled={loading}
          data-testid="run-surface-scan-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px' }}
        >
          <Icon name={loading ? 'activity' : 'search'} size={14} />
          {loading ? 'Scanning...' : 'Scan Attack Surface'}
        </button>
      </div>

      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Risk KPI */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '140px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SCANNED AGENTS</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{report.totalAgents}</div>
            </div>
            <div style={{ flex: 1, minWidth: '140px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>COMPOSITE RISK</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: report.riskScore > 50 ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
                {report.riskScore}/100
              </div>
            </div>
          </div>

          {/* Agent Surface Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
            {report.map(entry => (
              <div
                key={entry.agentId}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{entry.agentId}</strong>
                  <span
                    className="badge"
                    style={{
                      background: entry.riskScore >= 50 ? 'var(--accent-red)22' : 'var(--accent-green)22',
                      color: entry.riskScore >= 50 ? 'var(--accent-red)' : 'var(--accent-green)',
                    }}
                  >
                    Risk {entry.riskScore}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Endpoints: {entry.exposedEndpoints} · Ports: {entry.openPorts} · Vulns: {entry.vulnerabilities}
                </div>
              </div>
            ))}
          </div>

          {/* Vulnerabilities & Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--accent-red)' }}>Identified Vulnerabilities</h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {report.vulnerabilities.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--accent-green)' }}>Hardening Recommendations</h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {report.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

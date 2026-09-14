import React from 'react';
import { ModelUsageRecord, ModelUsageReport } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface UsageTabProps {
  report: ModelUsageReport;
}

export function UsageTab({ report }: UsageTabProps): React.JSX.Element {
  const records = report.records || report;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', overflowY: 'auto' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Model Inference Telemetry & Cost Analytics
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Detailed breakdown of token consumption, response latency, and compute expenditures across session runs.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL INVOCATIONS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '4px' }}>
            {report.invocations || records.reduce((s, r) => s + r.totalInvocations, 0)}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '150px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOKENS CONSUMED</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: '4px' }}>
            {(report.totalTokens || records.reduce((s, r) => s + r.totalTokens, 0)).toLocaleString()}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '150px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ESTIMATED COST (USD)</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>
            ${(report.totalCostUsd || report.totalCost || records.reduce((s, r) => s + r.totalCost, 0)).toFixed(4)}
          </div>
        </div>
      </div>

      {/* Usage Table */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.85rem' }}>
          Model Consumption Details
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 16px' }}>Model ID</th>
              <th style={{ padding: '10px 16px' }}>Invocations</th>
              <th style={{ padding: '10px 16px' }}>Tokens</th>
              <th style={{ padding: '10px 16px' }}>Avg Latency</th>
              <th style={{ padding: '10px 16px' }}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No usage data yet. Run prompt tests in the Playground to generate telemetry.
                </td>
              </tr>
            ) : (
              records.map(rec => (
                <tr key={rec.modelId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{rec.modelId}</td>
                  <td style={{ padding: '10px 16px' }}>{rec.totalInvocations}</td>
                  <td style={{ padding: '10px 16px' }}>{rec.totalTokens.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px' }}>{rec.avgLatencyMs}ms</td>
                  <td style={{ padding: '10px 16px', color: 'var(--accent)' }}>${rec.totalCost}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

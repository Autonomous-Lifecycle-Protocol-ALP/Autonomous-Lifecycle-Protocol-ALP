import React from 'react';
import { Experiment, scoreColor } from './shared.js';

interface ResultsViewProps {
  experiment: Experiment;
}

export function ResultsView({ experiment }: ResultsViewProps) {
  if (experiment.status !== 'COMPLETED' || experiment.injected === undefined) {
    return null;
  }

  return (
    <>
      <div className="card" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 16px)', border: '1px solid var(--border)', marginBottom: 12, boxSizing: 'border-box' as const }}>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>FAULT INJECTION RESULTS</div>
        <div className="table-responsive">
          <table className="table">
            <tbody>
              <tr>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: 'var(--accent-blue)' }}>{experiment.injected}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Injected</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: 'var(--accent-green)' }}>{experiment.recovered}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Recovered</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: 'var(--accent-red)' }}>{(experiment.injected || 0) - (experiment.recovered || 0)}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Unrecovered</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: 'var(--accent-yellow)' }}>{experiment.meanRecoveryMs}ms</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Mean Recovery</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {experiment.observations && experiment.observations.length > 0 && (
        <div className="card" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 16px)', border: '1px solid var(--border)', marginBottom: 12, boxSizing: 'border-box' as const }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>OBSERVATIONS</div>
          {experiment.observations.map((obs, i) => (
            <div key={i} className="info-row">• {obs}</div>
          ))}
        </div>
      )}
    </>
  );
}

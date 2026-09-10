import React, { useCallback } from 'react';
import { autonomyDecisions } from '../../shared/alp-client.js';
import type { AutonomyDecision } from '../shared/types.js';

interface ResultsViewProps {
  decisions: AutonomyDecision[];
  output: string[];
  onUpdateState: (state: { decisions: AutonomyDecision[]; output: string[] }) => void;
  onAppendOutput: (lines: string[]) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ decisions, output, onUpdateState, onAppendOutput }) => {
  const handleDecisions = useCallback(async () => {
    onAppendOutput(['[Autonomy] Fetching decisions...']);
    const result = await autonomyDecisions();
    if (result.success) {
      onUpdateState({ decisions: result.decisions, output: [...output, `[Autonomy] ${result.decisions.length} decision(s) found`] });
    } else {
      onAppendOutput([`[Autonomy] Error: ${result.error || 'unknown'}`]);
    }
  }, [output, onAppendOutput, onUpdateState]);

  return (
    <div className="card-container">
      <button onClick={handleDecisions} className="btn btn-lg" style={{
        background: 'var(--accent-red)',
        color: 'var(--text-primary)',
        fontWeight: 700,
        marginBottom: '12px',
      }}>
        Refresh Decisions
      </button>
      {decisions.length > 0 ? (
        <div className="card-container">
          {decisions.map((d) => (
            <div key={d.id} className="card">
              <div style={{ fontWeight: 600, color: 'var(--accent-pink)' }}>{d.type}: {d.workflowId}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>{d.rationale}</div>
              <div style={{ color: 'var(--accent-yellow)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
                Confidence: {Math.round(d.confidence * 100)}% | {d.timestamp}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No decisions recorded. Click "Refresh Decisions" to load.</div>
      )}
    </div>
  );
};

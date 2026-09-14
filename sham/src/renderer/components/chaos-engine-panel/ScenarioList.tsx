import React from 'react';
import { Experiment, ExpStatus, TYPE_META } from './shared.js';

interface ScenarioListProps {
  experiments: Experiment[];
  selected: string | null;
  onSelect: (id: string) => void;
}

const statusBadge = (status: ExpStatus) => {
  const color = status === 'COMPLETED' ? 'var(--accent-green)' : status === 'RUNNING' ? 'var(--accent-blue)' : status === 'ABORTED' ? 'var(--accent-red)' : 'var(--text-muted)';
  return (
    <span className="badge badge-responsive" style={{ background: color + '18', color, border: '1px solid ' + color + '33' }}>
      {status}
    </span>
  );
};

export function ScenarioList({ experiments, selected, onSelect }: ScenarioListProps) {
  return (
    <div style={{ width: 'clamp(200px, 30vw, 340px)', borderRight: '1px solid var(--border)', overflowY: 'auto' as const, maxWidth: '400px' }}>
      <div style={{ padding: '10px 16px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', boxSizing: 'border-box' }}>
        Experiments ({experiments.length})
      </div>
      {experiments.map(exp => {
        const meta = TYPE_META[exp.type];
        return (
          <div
            key={exp.id}
            onClick={() => onSelect(exp.id)}
            style={{
              padding: 'clamp(6px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)',
              background: selected === exp.id ? 'var(--bg-secondary)' : 'transparent',
              borderLeft: selected === exp.id ? '3px solid var(--accent)' : '3px solid transparent',
              boxSizing: 'border-box' as const,
            }}
          >
            <div className="flex-between">
              <div className="flex-wrap-gap">
                <span>{meta.icon}</span>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{exp.name}</span>
              </div>
              {statusBadge(exp.status)}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
              {meta.label} → {exp.target} | {exp.blastRadius}
            </div>
            {exp.score !== undefined && (
              <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 4, color: exp.score >= 90 ? 'var(--accent-green)' : exp.score >= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)', fontWeight: 600 }}>
                Resilience: {exp.score}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

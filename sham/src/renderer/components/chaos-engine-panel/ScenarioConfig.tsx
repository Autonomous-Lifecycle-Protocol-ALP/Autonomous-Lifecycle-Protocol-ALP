import React from 'react';
import { Experiment, TYPE_META, scoreColor } from './shared.js';

interface ScenarioConfigProps {
  experiment: Experiment;
}

export function ScenarioConfig({ experiment }: ScenarioConfigProps) {
  return (
    <div className="card" style={{ ...{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 16px)', border: '1px solid var(--border)', marginBottom: 12, boxSizing: 'border-box' as const }, display: 'flex', gap: 'clamp(10px, 3vw, 20px)', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>CONFIGURATION</div>
        <div className="table-responsive">
          <table className="table">
            <tbody>
              <tr><td style={{ color: 'var(--text-muted)' }}>Type:</td><td style={{ color: TYPE_META[experiment.type].color }}>{TYPE_META[experiment.type].label}</td></tr>
              <tr><td style={{ color: 'var(--text-muted)' }}>Target:</td><td style={{ fontFamily: 'monospace' }}>{experiment.target}</td></tr>
              <tr><td style={{ color: 'var(--text-muted)' }}>Blast Radius:</td><td>{experiment.blastRadius}</td></tr>
              <tr><td style={{ color: 'var(--text-muted)' }}>Intensity:</td><td>{(experiment.intensity * 100).toFixed(0)}%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      {experiment.score !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 'clamp(80px, 20vw, 100px)' }}>
          <div style={{
            width: 'clamp(60px, 15vw, 80px)', height: 'clamp(60px, 15vw, 80px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `conic-gradient(${scoreColor(experiment.score)} ${experiment.score * 3.6}deg, var(--border) 0deg)`,
            fontSize: 'clamp(14px, 3vw, 18px)', fontWeight: 700, color: scoreColor(experiment.score),
          }}>
            <div style={{ width: 'clamp(45px, 12vw, 60px)', height: 'clamp(45px, 12vw, 60px)', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {experiment.score}
            </div>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Resilience</div>
        </div>
      )}
    </div>
  );
}

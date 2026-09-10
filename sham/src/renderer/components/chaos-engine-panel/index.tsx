import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { Experiment, ExpStatus, INITIAL_EXPERIMENTS, TYPE_META } from './shared.js';
import { ScenarioList } from './ScenarioList.js';
import { ScenarioConfig } from './ScenarioConfig.js';
import { ResultsView } from './ResultsView.js';

export function ChaosEnginePanel(): React.JSX.Element {
  const [experiments, setExperiments] = useState<Experiment[]>(INITIAL_EXPERIMENTS);
  const [selected, setSelected] = useState<string | null>('chaos-001');

  const selectedExp = experiments.find(e => e.id === selected);

  const runExperiment = (id: string) => {
    setExperiments(prev => prev.map(e => {
      if (e.id !== id) return e;
      const injected = Math.floor(Math.random() * 15) + 5;
      const recovered = Math.floor(injected * (0.7 + Math.random() * 0.3));
      const score = Math.round((recovered / injected) * 100);
      return {
        ...e, status: 'COMPLETED' as ExpStatus, score, injected, recovered,
        meanRecoveryMs: Math.floor(Math.random() * 600) + 100,
        observations: [
          score >= 80 ? 'Fault recovery within acceptable bounds' : 'Recovery time exceeded SLA thresholds',
          score >= 90 ? 'System demonstrates excellent resilience' : score >= 70 ? 'Acceptable resilience' : 'Below threshold',
        ],
      };
    }));
  };

  const statusColor = (s: ExpStatus) => s === 'COMPLETED' ? 'var(--accent-green)' : s === 'RUNNING' ? 'var(--accent-blue)' : s === 'ABORTED' ? 'var(--accent-red)' : 'var(--text-muted)';
  const scoreColor = (s: number) => s >= 90 ? 'var(--accent-green)' : s >= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)';

  const totalCompleted = experiments.filter(e => e.status === 'COMPLETED').length;
  const avgScore = totalCompleted > 0 ? Math.round(experiments.filter(e => e.status === 'COMPLETED' && e.score !== undefined).reduce((s, e) => s + (e.score || 0), 0) / totalCompleted) : 0;

  const s = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const },
    header: { padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' as const },
    kpiRow: { display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-xs) var(--spacing-md)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' as const },
    kpi: (accent: string) => ({ flex: 1, minWidth: 'clamp(100px, 25vw, 150px)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 12px) clamp(10px, 3vw, 14px)', border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 3 }),
    kpiLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    kpiValue: (accent: string) => ({ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, color: accent }),
    body: { flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' as const },
    detail: { flex: 1, overflowY: 'auto' as const, padding: 'var(--spacing-sm)' },
  };

  return (
    <div style={s.container}>
      <div className="panel-header" style={s.header}>
        <div className="flex-wrap-gap">
          <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}><Icon name="alertTriangle" size={18} /></span>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--accent-red)' }}>Chaos Engineering Engine</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent-red)22', color: 'var(--accent-red)', border: '1px solid var(--accent-red)44' }}>v72.0.0</span>
        </div>
        <div className="flex-wrap-gap">
          <span className="badge badge-responsive" style={{ background: 'var(--accent-green)22', color: 'var(--accent-green)' }}>{totalCompleted} Completed</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent-blue)22', color: 'var(--accent-blue)' }}>{experiments.filter(e => e.status === 'RUNNING').length} Running</span>
        </div>
      </div>

      <div style={s.kpiRow}>
        <div style={s.kpi('var(--accent)')}>
          <div style={s.kpiLabel}>Experiments</div>
          <div style={s.kpiValue('var(--accent)')}>{experiments.length}</div>
        </div>
        <div style={s.kpi('var(--accent-green)')}>
          <div style={s.kpiLabel}>Avg Resilience</div>
          <div style={s.kpiValue('var(--accent-green)')}>{avgScore}%</div>
        </div>
        <div style={s.kpi('var(--accent-yellow)')}>
          <div style={s.kpiLabel}>Total Faults</div>
          <div style={s.kpiValue('var(--accent-yellow)')}>{experiments.reduce((t, e) => t + (e.injected || 0), 0)}</div>
        </div>
        <div style={s.kpi('var(--accent-red)')}>
          <div style={s.kpiLabel}>Unrecovered</div>
          <div style={s.kpiValue('var(--accent-red)')}>{experiments.reduce((t, e) => t + ((e.injected || 0) - (e.recovered || 0)), 0)}</div>
        </div>
      </div>

      <div style={s.body}>
        <ScenarioList experiments={experiments} selected={selected} onSelect={setSelected} />
        <div style={s.detail}>
          {selectedExp ? (
            <>
              <div className="flex-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                <div>
                  <div style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 700, color: TYPE_META[selectedExp.type].color }}>
                    {TYPE_META[selectedExp.type].icon} {selectedExp.name}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{selectedExp.id}</div>
                </div>
                {(selectedExp.status === 'PENDING' || selectedExp.status === 'RUNNING') && (
                  <button className="btn btn-responsive" style={{ background: selectedExp.status === 'PENDING' ? 'var(--accent-red)' : 'var(--accent-yellow)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600 }} onClick={() => runExperiment(selectedExp.id)}>
                    {selectedExp.status === 'PENDING' ? '▶️ Run Experiment' : '⏹️ Complete'}
                  </button>
                )}
              </div>

              <ScenarioConfig experiment={selectedExp} />
              <ResultsView experiment={selectedExp} />
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="alertTriangle" size={32} color="var(--text-muted)" /></div>
              <div className="empty-state-title">Select an experiment</div>
              <div className="empty-state-desc">Choose a chaos experiment from the list to view details.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

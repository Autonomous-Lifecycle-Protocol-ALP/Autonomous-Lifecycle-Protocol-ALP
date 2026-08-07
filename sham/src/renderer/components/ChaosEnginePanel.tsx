import React, { useState } from 'react';
import { Icon } from './Icon.js';

type ExpType = 'LATENCY' | 'ERROR' | 'RESOURCE_EXHAUSTION' | 'PARTITION' | 'KILL_AGENT';
type ExpStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ABORTED';

interface Experiment {
  id: string;
  name: string;
  type: ExpType;
  target: string;
  status: ExpStatus;
  intensity: number;
  blastRadius: string;
  score?: number;
  injected?: number;
  recovered?: number;
  meanRecoveryMs?: number;
  observations?: string[];
}

const TYPE_META: Record<ExpType, { icon: string; color: string; label: string }> = {
  LATENCY: { icon: 'clock', color: '#fbbf24', label: 'Latency Injection' },
  ERROR: { icon: 'alertTriangle', color: '#f87171', label: 'Error Simulation' },
  RESOURCE_EXHAUSTION: { icon: 'zap', color: '#fb923c', label: 'Resource Exhaustion' },
  PARTITION: { icon: 'wifiOff', color: '#a78bfa', label: 'Network Partition' },
  KILL_AGENT: { icon: 'xCircle', color: '#ef4444', label: 'Kill Agent' },
};

const INITIAL_EXPERIMENTS: Experiment[] = [
  { id: 'chaos-001', name: 'Latency Storm', type: 'LATENCY', target: 'agent-executor-1', status: 'COMPLETED', intensity: 0.7, blastRadius: 'SINGLE', score: 92, injected: 18, recovered: 17, meanRecoveryMs: 245, observations: ['Circuit breaker activated within SLA', 'PASS: System demonstrates excellent resilience'] },
  { id: 'chaos-002', name: 'Payment Gateway Errors', type: 'ERROR', target: 'payment-gateway', status: 'COMPLETED', intensity: 0.5, blastRadius: 'WORKFLOW', score: 78, injected: 12, recovered: 9, meanRecoveryMs: 520, observations: ['Retry exhaustion detected — escalation needed', 'WARN: Acceptable resilience with room for improvement'] },
  { id: 'chaos-003', name: 'Memory Pressure Test', type: 'RESOURCE_EXHAUSTION', target: 'analytics-worker', status: 'RUNNING', intensity: 0.9, blastRadius: 'SWARM' },
  { id: 'chaos-004', name: 'Split-Brain Simulation', type: 'PARTITION', target: 'consensus-node-3', status: 'PENDING', intensity: 0.6, blastRadius: 'SWARM' },
];

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
          score >= 90 ? <><Icon name="check" size={12} /> System demonstrates excellent resilience</> : score >= 70 ? <><Icon name="alertTriangle" size={12} /> Acceptable resilience</> : <><Icon name="alertTriangle" size={12} /> Below threshold</>,
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
    header: { padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' },
    kpiRow: { display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-xs) var(--spacing-md)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
    kpi: (accent: string) => ({ flex: 1, minWidth: 'clamp(100px, 25vw, 150px)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 12px) clamp(10px, 3vw, 14px)', border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 3 }),
    kpiLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    kpiValue: (accent: string) => ({ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, color: accent }),
    body: { flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' },
    list: { width: 'clamp(200px, 30vw, 340px)', borderRight: '1px solid var(--border)', overflowY: 'auto' as const, maxWidth: '400px' },
    detail: { flex: 1, overflowY: 'auto' as const, padding: 'var(--spacing-sm)' },
    expCard: (active: boolean) => ({
      padding: 'clamp(6px, 1.5vw, 12px) clamp(10px, 2vw, 16px)', cursor: 'pointer', borderBottom: '1px solid var(--border)',
      background: active ? 'var(--bg-secondary)' : 'transparent',
      borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
      boxSizing: 'border-box',
    }),
    badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, background: color + '18', color, fontSize: 'var(--font-size-xs)', fontWeight: 600, border: `1px solid ${color}33` }),
    card: { background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 16px)', border: '1px solid var(--border)', marginBottom: 12, boxSizing: 'border-box' },
    btn: (color: string) => ({ background: color, border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600 }),
    scoreRing: (score: number) => ({
      width: 'clamp(60px, 15vw, 80px)', height: 'clamp(60px, 15vw, 80px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `conic-gradient(${scoreColor(score)} ${score * 3.6}deg, var(--border) 0deg)`,
      fontSize: 'clamp(14px, 3vw, 18px)', fontWeight: 700, color: scoreColor(score),
    }),
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

      {/* KPI Strip */}
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
        <div style={s.list}>
          <div style={{ padding: '10px 16px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', boxSizing: 'border-box' }}>
            Experiments ({experiments.length})
          </div>
          {experiments.map(exp => {
            const meta = TYPE_META[exp.type];
            return (
              <div key={exp.id} style={s.expCard(selected === exp.id)} onClick={() => setSelected(exp.id)}>
                <div className="flex-between">
                  <div className="flex-wrap-gap">
                    <span>{meta.icon}</span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{exp.name}</span>
                  </div>
                  <span className="badge badge-responsive" style={{ background: statusColor(exp.status) + '18', color: statusColor(exp.status), border: '1px solid ' + statusColor(exp.status) + '33' }}>{exp.status}</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                  {meta.label} → {exp.target} | {exp.blastRadius}
                </div>
                {exp.score !== undefined && (
                  <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 4, color: scoreColor(exp.score), fontWeight: 600 }}>
                    Resilience: {exp.score}%
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
                  <button className="btn btn-responsive" style={s.btn(selectedExp.status === 'PENDING' ? 'var(--accent-red)' : 'var(--accent-yellow)')} onClick={() => runExperiment(selectedExp.id)}>
                    {selectedExp.status === 'PENDING' ? '▶️ Run Experiment' : '⏹️ Complete'}
                  </button>
                )}
              </div>

              <div className="card" style={{ ...s.card, display: 'flex', gap: 'clamp(10px, 3vw, 20px)', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>CONFIGURATION</div>
                  <div className="table-responsive">
                    <table className="table">
                      <tbody>
                        <tr><td style={{ color: 'var(--text-muted)' }}>Type:</td><td style={{ color: TYPE_META[selectedExp.type].color }}>{TYPE_META[selectedExp.type].label}</td></tr>
                        <tr><td style={{ color: 'var(--text-muted)' }}>Target:</td><td style={{ fontFamily: 'monospace' }}>{selectedExp.target}</td></tr>
                        <tr><td style={{ color: 'var(--text-muted)' }}>Blast Radius:</td><td>{selectedExp.blastRadius}</td></tr>
                        <tr><td style={{ color: 'var(--text-muted)' }}>Intensity:</td><td>{(selectedExp.intensity * 100).toFixed(0)}%</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {selectedExp.score !== undefined && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 'clamp(80px, 20vw, 100px)' }}>
                    <div style={s.scoreRing(selectedExp.score)}>
                      <div style={{ width: 'clamp(45px, 12vw, 60px)', height: 'clamp(45px, 12vw, 60px)', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedExp.score}
                      </div>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Resilience</div>
                  </div>
                )}
              </div>

              {selectedExp.status === 'COMPLETED' && (selectedExp as unknown as { result?: unknown }).result !== undefined && (
                <>
                  <div className="card">
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>FAULT INJECTION RESULTS</div>
                    <div className="table-responsive">
                      <table className="table">
                        <tbody>
                          <tr>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: 'var(--accent-blue)' }}>{selectedExp.injected}</div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Injected</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: 'var(--accent-green)' }}>{selectedExp.recovered}</div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Recovered</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: 'var(--accent-red)' }}>{(selectedExp.injected || 0) - (selectedExp.recovered || 0)}</div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Unrecovered</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 700, color: 'var(--accent-yellow)' }}>{selectedExp.meanRecoveryMs}ms</div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Mean Recovery</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {selectedExp.observations && selectedExp.observations.length > 0 && (
                    <div className="card">
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>OBSERVATIONS</div>
                      {selectedExp.observations.map((obs, i) => (
                        <div key={i} className="info-row">• {obs}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
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

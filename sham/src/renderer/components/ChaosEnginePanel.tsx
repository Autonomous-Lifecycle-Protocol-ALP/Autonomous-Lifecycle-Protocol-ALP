import React, { useState } from 'react';

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
  LATENCY: { icon: '⏱️', color: '#fbbf24', label: 'Latency Injection' },
  ERROR: { icon: '💥', color: '#f87171', label: 'Error Simulation' },
  RESOURCE_EXHAUSTION: { icon: '🔥', color: '#fb923c', label: 'Resource Exhaustion' },
  PARTITION: { icon: '🔌', color: '#a78bfa', label: 'Network Partition' },
  KILL_AGENT: { icon: '💀', color: '#ef4444', label: 'Kill Agent' },
};

const INITIAL_EXPERIMENTS: Experiment[] = [
  { id: 'chaos-001', name: 'Latency Storm', type: 'LATENCY', target: 'agent-executor-1', status: 'COMPLETED', intensity: 0.7, blastRadius: 'SINGLE', score: 92, injected: 18, recovered: 17, meanRecoveryMs: 245, observations: ['Circuit breaker activated within SLA', '✅ System demonstrates excellent resilience'] },
  { id: 'chaos-002', name: 'Payment Gateway Errors', type: 'ERROR', target: 'payment-gateway', status: 'COMPLETED', intensity: 0.5, blastRadius: 'WORKFLOW', score: 78, injected: 12, recovered: 9, meanRecoveryMs: 520, observations: ['Retry exhaustion detected — escalation needed', '⚠️ Acceptable resilience with room for improvement'] },
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
          score >= 90 ? '✅ System demonstrates excellent resilience' : score >= 70 ? '⚠️ Acceptable resilience' : '🚨 Below threshold',
        ],
      };
    }));
  };

  const statusColor = (s: ExpStatus) => s === 'COMPLETED' ? '#4ade80' : s === 'RUNNING' ? '#4fc3f7' : s === 'ABORTED' ? '#f87171' : '#6b7280';
  const scoreColor = (s: number) => s >= 90 ? '#4ade80' : s >= 70 ? '#fbbf24' : '#f87171';

  const totalCompleted = experiments.filter(e => e.status === 'COMPLETED').length;
  const avgScore = totalCompleted > 0 ? Math.round(experiments.filter(e => e.status === 'COMPLETED' && e.score !== undefined).reduce((s, e) => s + (e.score || 0), 0) / totalCompleted) : 0;

  const s = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: '#0a0a14', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
    header: { padding: '14px 20px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    kpiRow: { display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid #1e2035', background: '#0e1020' },
    kpi: (accent: string) => ({ flex: 1, background: '#16182a', borderRadius: 10, padding: '12px 14px', border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 3 }),
    kpiLabel: { fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1 },
    kpiValue: (accent: string) => ({ fontSize: 20, fontWeight: 700, color: accent }),
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    list: { width: 340, borderRight: '1px solid #1e2035', overflowY: 'auto' as const },
    detail: { flex: 1, overflowY: 'auto' as const, padding: 20 },
    expCard: (active: boolean) => ({
      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #1e203544',
      background: active ? '#1a1d35' : 'transparent',
      borderLeft: active ? '3px solid #a78bfa' : '3px solid transparent',
    }),
    badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, background: color + '18', color, fontSize: 10, fontWeight: 600, border: `1px solid ${color}33` }),
    card: { background: '#16182a', borderRadius: 10, padding: 16, border: '1px solid #1e2035', marginBottom: 12 },
    btn: (color: string) => ({ background: color, border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
    scoreRing: (score: number) => ({
      width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `conic-gradient(${scoreColor(score)} ${score * 3.6}deg, #1e2035 0deg)`,
      fontSize: 18, fontWeight: 700, color: scoreColor(score),
    }),
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💥</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#f87171' }}>Chaos Engineering Engine</span>
          <span style={{ fontSize: 10, background: '#f8717122', color: '#f87171', padding: '2px 8px', borderRadius: 10 }}>v72.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={s.badge('#4ade80')}>{totalCompleted} Completed</span>
          <span style={s.badge('#4fc3f7')}>{experiments.filter(e => e.status === 'RUNNING').length} Running</span>
        </div>
      </div>

      <div style={s.kpiRow}>
        <div style={s.kpi('#a78bfa')}>
          <div style={s.kpiLabel}>Experiments</div>
          <div style={s.kpiValue('#a78bfa')}>{experiments.length}</div>
        </div>
        <div style={s.kpi('#4ade80')}>
          <div style={s.kpiLabel}>Avg Resilience</div>
          <div style={s.kpiValue('#4ade80')}>{avgScore}%</div>
        </div>
        <div style={s.kpi('#fbbf24')}>
          <div style={s.kpiLabel}>Total Faults</div>
          <div style={s.kpiValue('#fbbf24')}>{experiments.reduce((t, e) => t + (e.injected || 0), 0)}</div>
        </div>
        <div style={s.kpi('#f87171')}>
          <div style={s.kpiLabel}>Unrecovered</div>
          <div style={s.kpiValue('#f87171')}>{experiments.reduce((t, e) => t + ((e.injected || 0) - (e.recovered || 0)), 0)}</div>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.list}>
          <div style={{ padding: '10px 16px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1e2035' }}>
            Experiments ({experiments.length})
          </div>
          {experiments.map(exp => {
            const meta = TYPE_META[exp.type];
            return (
              <div key={exp.id} style={s.expCard(selected === exp.id)} onClick={() => setSelected(exp.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{meta.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{exp.name}</span>
                  </div>
                  <span style={s.badge(statusColor(exp.status))}>{exp.status}</span>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  {meta.label} → {exp.target} | {exp.blastRadius}
                </div>
                {exp.score !== undefined && (
                  <div style={{ fontSize: 11, marginTop: 4, color: scoreColor(exp.score), fontWeight: 600 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: TYPE_META[selectedExp.type].color }}>
                    {TYPE_META[selectedExp.type].icon} {selectedExp.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{selectedExp.id}</div>
                </div>
                {(selectedExp.status === 'PENDING' || selectedExp.status === 'RUNNING') && (
                  <button style={s.btn(selectedExp.status === 'PENDING' ? '#f87171' : '#fbbf24')} onClick={() => runExperiment(selectedExp.id)}>
                    {selectedExp.status === 'PENDING' ? '▶️ Run Experiment' : '⏹️ Complete'}
                  </button>
                )}
              </div>

              <div style={{ ...s.card, display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>CONFIGURATION</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>Type:</span><span style={{ color: TYPE_META[selectedExp.type].color }}>{TYPE_META[selectedExp.type].label}</span>
                    <span style={{ color: '#6b7280' }}>Target:</span><span style={{ fontFamily: 'monospace' }}>{selectedExp.target}</span>
                    <span style={{ color: '#6b7280' }}>Blast Radius:</span><span>{selectedExp.blastRadius}</span>
                    <span style={{ color: '#6b7280' }}>Intensity:</span><span>{(selectedExp.intensity * 100).toFixed(0)}%</span>
                  </div>
                </div>
                {selectedExp.score !== undefined && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={s.scoreRing(selectedExp.score)}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#16182a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedExp.score}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>Resilience</div>
                  </div>
                )}
              </div>

              {selectedExp.status === 'COMPLETED' && selectedExp.result !== undefined && (
                <>
                  <div style={s.card}>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 10 }}>FAULT INJECTION RESULTS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#4fc3f7' }}>{selectedExp.injected}</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>Injected</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{selectedExp.recovered}</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>Recovered</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>{(selectedExp.injected || 0) - (selectedExp.recovered || 0)}</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>Unrecovered</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{selectedExp.meanRecoveryMs}ms</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>Mean Recovery</div>
                      </div>
                    </div>
                  </div>

                  {selectedExp.observations && selectedExp.observations.length > 0 && (
                    <div style={s.card}>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>OBSERVATIONS</div>
                      {selectedExp.observations.map((obs, i) => (
                        <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #1e203522' }}>• {obs}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💥</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select an experiment</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Choose a chaos experiment from the list to view details.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

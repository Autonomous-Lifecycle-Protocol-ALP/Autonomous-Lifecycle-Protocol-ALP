import React, { useState } from 'react';

type FlagStatus = 'ENABLED' | 'DISABLED' | 'ROLLOUT' | 'EXPERIMENT';

interface Flag {
  id: string;
  name: string;
  description: string;
  status: FlagStatus;
  rollout: number;
  variants: { id: string; name: string; weight: number }[];
  environments: string[];
  killSwitch: boolean;
  updatedAt: string;
}

const INITIAL_FLAGS: Flag[] = [
  { id: 'flag-001', name: 'New Consensus v3', description: 'Upgraded BFT consensus algorithm', status: 'ROLLOUT', rollout: 30, variants: [{ id: 'control', name: 'BFT v2', weight: 50 }, { id: 'treatment', name: 'BFT v3', weight: 50 }], environments: ['staging', 'production'], killSwitch: false, updatedAt: '2 min ago' },
  { id: 'flag-002', name: 'Enhanced Telemetry', description: 'Extended pub/sub metrics', status: 'ENABLED', rollout: 100, variants: [], environments: ['production'], killSwitch: false, updatedAt: '1 hr ago' },
  { id: 'flag-003', name: 'ML Scheduler', description: 'ML-based task scheduling', status: 'EXPERIMENT', rollout: 50, variants: [{ id: 'fifo', name: 'FIFO', weight: 33 }, { id: 'priority', name: 'Priority', weight: 34 }, { id: 'ml', name: 'ML v1', weight: 33 }], environments: ['staging'], killSwitch: false, updatedAt: '5 min ago' },
  { id: 'flag-004', name: 'Dark Launch: Edge Sync', description: 'Edge node real-time sync', status: 'DISABLED', rollout: 0, variants: [], environments: [], killSwitch: false, updatedAt: '3 hrs ago' },
  { id: 'flag-005', name: 'Auto-Healing v2', description: 'Improved self-healing mesh', status: 'ROLLOUT', rollout: 75, variants: [{ id: 'v1', name: 'Legacy', weight: 25 }, { id: 'v2', name: 'v2 Mesh', weight: 75 }], environments: ['production'], killSwitch: false, updatedAt: '10 min ago' },
];

export function FeatureFlagPanel(): React.JSX.Element {
  const [flags, setFlags] = useState<Flag[]>(INITIAL_FLAGS);
  const [selected, setSelected] = useState<string>('flag-001');

  const selectedFlag = flags.find(f => f.id === selected);

  const statusMeta: Record<FlagStatus, { icon: string; color: string }> = {
    ENABLED: { icon: '🟢', color: '#4ade80' },
    DISABLED: { icon: '⚫', color: '#6b7280' },
    ROLLOUT: { icon: '🟡', color: '#fbbf24' },
    EXPERIMENT: { icon: '🔬', color: '#a78bfa' },
  };

  const toggleStatus = (id: string) => {
    setFlags(prev => prev.map(f => {
      if (f.id !== id) return f;
      const order: FlagStatus[] = ['DISABLED', 'ENABLED', 'ROLLOUT', 'EXPERIMENT'];
      const nextIdx = (order.indexOf(f.status) + 1) % order.length;
      return { ...f, status: order[nextIdx], updatedAt: 'just now' };
    }));
  };

  const toggleKill = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, killSwitch: !f.killSwitch, updatedAt: 'just now' } : f));
  };

  const updateRollout = (id: string, pct: number) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, rollout: pct, updatedAt: 'just now' } : f));
  };

  const enabledCount = flags.filter(f => f.status === 'ENABLED' || f.status === 'ROLLOUT').length;
  const experimentCount = flags.filter(f => f.status === 'EXPERIMENT').length;

  const s = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: '#0a0a14', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
    header: { padding: '14px 20px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    kpiRow: { display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid #1e2035', background: '#0e1020' },
    kpi: (accent: string) => ({ flex: 1, background: '#16182a', borderRadius: 10, padding: '12px 14px', border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 3 }),
    kpiLabel: { fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1 },
    kpiValue: (accent: string) => ({ fontSize: 20, fontWeight: 700, color: accent }),
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    list: { width: 320, borderRight: '1px solid #1e2035', overflowY: 'auto' as const },
    detail: { flex: 1, overflowY: 'auto' as const, padding: 20 },
    flagRow: (active: boolean) => ({
      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #1e203544',
      background: active ? '#1a1d35' : 'transparent',
      borderLeft: active ? '3px solid #4ade80' : '3px solid transparent',
    }),
    badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, background: color + '18', color, fontSize: 10, fontWeight: 600, border: `1px solid ${color}33` }),
    card: { background: '#16182a', borderRadius: 10, padding: 16, border: '1px solid #1e2035', marginBottom: 12 },
    btn: (color: string) => ({ background: color, border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
    slider: { width: '100%', accentColor: '#a78bfa' },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🚩</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#4ade80' }}>Feature Flag Engine</span>
          <span style={{ fontSize: 10, background: '#4ade8022', color: '#4ade80', padding: '2px 8px', borderRadius: 10 }}>v74.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={s.badge('#4ade80')}>{enabledCount} Active</span>
          <span style={s.badge('#a78bfa')}>{experimentCount} Experiments</span>
        </div>
      </div>

      <div style={s.kpiRow}>
        <div style={s.kpi('#4ade80')}>
          <div style={s.kpiLabel}>Total Flags</div>
          <div style={s.kpiValue('#4ade80')}>{flags.length}</div>
        </div>
        <div style={s.kpi('#fbbf24')}>
          <div style={s.kpiLabel}>Rolling Out</div>
          <div style={s.kpiValue('#fbbf24')}>{flags.filter(f => f.status === 'ROLLOUT').length}</div>
        </div>
        <div style={s.kpi('#a78bfa')}>
          <div style={s.kpiLabel}>Experiments</div>
          <div style={s.kpiValue('#a78bfa')}>{experimentCount}</div>
        </div>
        <div style={s.kpi('#f87171')}>
          <div style={s.kpiLabel}>Kill Switches</div>
          <div style={s.kpiValue('#f87171')}>{flags.filter(f => f.killSwitch).length}</div>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.list}>
          <div style={{ padding: '10px 16px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1e2035' }}>
            Flags ({flags.length})
          </div>
          {flags.map(f => (
            <div key={f.id} style={s.flagRow(selected === f.id)} onClick={() => setSelected(f.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{statusMeta[f.status].icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</span>
                </div>
                {f.killSwitch && <span style={s.badge('#f87171')}>🔴 KILLED</span>}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                {f.description} • {f.updatedAt}
              </div>
              {f.status === 'ROLLOUT' && (
                <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: '#1e2035', overflow: 'hidden' }}>
                  <div style={{ width: `${f.rollout}%`, height: '100%', background: '#fbbf24', borderRadius: 2 }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={s.detail}>
          {selectedFlag ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: statusMeta[selectedFlag.status].color }}>
                    {statusMeta[selectedFlag.status].icon} {selectedFlag.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{selectedFlag.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btn('#4fc3f7')} onClick={() => toggleStatus(selectedFlag.id)}>⚡ Toggle</button>
                  <button style={s.btn(selectedFlag.killSwitch ? '#4ade80' : '#f87171')} onClick={() => toggleKill(selectedFlag.id)}>
                    {selectedFlag.killSwitch ? '✅ Revive' : '🔴 Kill'}
                  </button>
                </div>
              </div>

              <div style={{ ...s.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: 12 }}>
                <span style={{ color: '#6b7280' }}>Status:</span><span style={s.badge(statusMeta[selectedFlag.status].color)}>{selectedFlag.status}</span>
                <span style={{ color: '#6b7280' }}>Kill Switch:</span><span style={{ color: selectedFlag.killSwitch ? '#f87171' : '#4ade80' }}>{selectedFlag.killSwitch ? '🔴 ACTIVE' : '⚪ OFF'}</span>
                <span style={{ color: '#6b7280' }}>Environments:</span><span>{selectedFlag.environments.length > 0 ? selectedFlag.environments.join(', ') : 'All'}</span>
                <span style={{ color: '#6b7280' }}>Variants:</span><span>{selectedFlag.variants.length || 'None'}</span>
              </div>

              {(selectedFlag.status === 'ROLLOUT' || selectedFlag.status === 'EXPERIMENT') && (
                <div style={s.card}>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>ROLLOUT PERCENTAGE</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="range" min={0} max={100} value={selectedFlag.rollout} onChange={e => updateRollout(selectedFlag.id, parseInt(e.target.value))} style={s.slider} />
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa', minWidth: 50 }}>{selectedFlag.rollout}%</span>
                  </div>
                  <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: '#1e2035', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedFlag.rollout}%`, height: '100%', background: 'linear-gradient(90deg, #a78bfa, #4ade80)', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              {selectedFlag.variants.length > 0 && (
                <div style={s.card}>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 10 }}>VARIANT DISTRIBUTION</div>
                  {selectedFlag.variants.map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e203522' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.id === 'control' || v.id === 'v1' || v.id === 'fifo' ? '#4fc3f7' : v.id === 'treatment' || v.id === 'v2' || v.id === 'priority' ? '#4ade80' : '#a78bfa' }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{v.name}</span>
                        <span style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace' }}>{v.id}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{v.weight}%</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚩</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select a feature flag</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

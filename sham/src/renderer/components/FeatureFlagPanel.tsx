import React, { useState } from 'react';
import { Icon } from './Icon.js';

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
    ENABLED: { icon: 'check', color: '#4ade80' },
    DISABLED: { icon: 'xCircle', color: '#6b7280' },
    ROLLOUT: { icon: 'alertTriangle', color: '#fbbf24' },
    EXPERIMENT: { icon: 'search', color: '#a78bfa' },
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
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const },
    header: { padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' as const },
    kpiRow: { display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-xs) var(--spacing-md)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
    kpi: (accent: string) => ({ flex: 1, minWidth: 'clamp(100px, 25vw, 150px)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 12px) clamp(10px, 3vw, 14px)', border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 3 }),
    kpiLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    kpiValue: (accent: string) => ({ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, color: accent }),
    body: { flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' },
    list: { width: 'clamp(200px, 30vw, 320px)', borderRight: '1px solid var(--border)', overflowY: 'auto' as const, maxWidth: '400px' },
    detail: { flex: 1, overflowY: 'auto' as const, padding: 'var(--spacing-sm)' },
    flagRow: (active: boolean) => ({
      padding: 'clamp(6px, 1.5vw, 12px) clamp(10px, 2vw, 16px)', cursor: 'pointer', borderBottom: '1px solid var(--border)',
      background: active ? 'var(--bg-secondary)' : 'transparent',
      borderLeft: active ? '3px solid var(--accent-green)' : '3px solid transparent',
      boxSizing: 'border-box',
    }),
    badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, background: color + '18', color, fontSize: 'var(--font-size-xs)', fontWeight: 600, border: `1px solid ${color}33` }),
    card: { background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 16px)', border: '1px solid var(--border)', marginBottom: 12, boxSizing: 'border-box' },
    btn: (color: string) => ({ background: color, border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600 }),
    slider: { width: '100%', accentColor: 'var(--accent)' },
  };

  return (
    <div style={s.container}>
      <div className="panel-header" style={s.header}>
        <div className="flex-wrap-gap">
          <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}><Icon name="flag" size={18} /></span>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--accent-green)' }}>Feature Flag Engine</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent-green)22', color: 'var(--accent-green)', border: '1px solid var(--accent-green)44' }}>v74.0.0</span>
        </div>
        <div className="flex-wrap-gap">
          <span className="badge badge-responsive" style={{ background: 'var(--accent-green)22', color: 'var(--accent-green)' }}>{enabledCount} Active</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent)22', color: 'var(--accent)' }}>{experimentCount} Experiments</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={s.kpiRow}>
        <div style={s.kpi('var(--accent-green)')}>
          <div style={s.kpiLabel}>Total Flags</div>
          <div style={s.kpiValue('var(--accent-green)')}>{flags.length}</div>
        </div>
        <div style={s.kpi('var(--accent-yellow)')}>
          <div style={s.kpiLabel}>Rolling Out</div>
          <div style={s.kpiValue('var(--accent-yellow)')}>{flags.filter(f => f.status === 'ROLLOUT').length}</div>
        </div>
        <div style={s.kpi('var(--accent)')}>
          <div style={s.kpiLabel}>Experiments</div>
          <div style={s.kpiValue('var(--accent)')}>{experimentCount}</div>
        </div>
        <div style={s.kpi('var(--accent-red)')}>
          <div style={s.kpiLabel}>Kill Switches</div>
          <div style={s.kpiValue('var(--accent-red)')}>{flags.filter(f => f.killSwitch).length}</div>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.list}>
          <div style={{ padding: '10px 16px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', boxSizing: 'border-box' }}>
            Flags ({flags.length})
          </div>
          {flags.map(f => (
            <div key={f.id} style={s.flagRow(selected === f.id)} onClick={() => setSelected(f.id)}>
              <div className="flex-between">
                <div className="flex-wrap-gap">
                   <span><Icon name={statusMeta[f.status].icon} size={14} color={statusMeta[f.status].color} /></span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{f.name}</span>
                </div>
                 {f.killSwitch && <span className="badge badge-responsive" style={{ background: 'var(--accent-red)18', color: 'var(--accent-red)' }}><Icon name="xCircle" size={12} /> KILLED</span>}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                {f.description} • {f.updatedAt}
              </div>
              {f.status === 'ROLLOUT' && (
                <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${f.rollout}%`, height: '100%', background: 'var(--accent-yellow)', borderRadius: 2 }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={s.detail}>
          {selectedFlag ? (
            <>
              <div className="flex-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                <div>
                     <div style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 700, color: statusMeta[selectedFlag.status].color }}>
                     <Icon name={statusMeta[selectedFlag.status].icon} size={14} color={statusMeta[selectedFlag.status].color} /> {selectedFlag.name}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 4 }}>{selectedFlag.description}</div>
                </div>
                <div className="flex-wrap-gap">
                   <button className="btn btn-sm" style={s.btn('var(--accent-blue)')} onClick={() => toggleStatus(selectedFlag.id)}><Icon name="zap" size={14} /> Toggle</button>
                   <button className="btn btn-sm" style={s.btn(selectedFlag.killSwitch ? 'var(--accent-green)' : 'var(--accent-red)')} onClick={() => toggleKill(selectedFlag.id)}>
                     {selectedFlag.killSwitch ? <><Icon name="check" size={14} /> Revive</> : <><Icon name="xCircle" size={14} /> Kill</>}
                   </button>
                </div>
              </div>

              <div className="card" style={{ ...s.card, display: 'grid', gridTemplateColumns: '1fr clamp(120px, 30vw, 200px)', gap: '8px 20px', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span><span className="badge badge-responsive" style={{ background: statusMeta[selectedFlag.status].color + '18', color: statusMeta[selectedFlag.status].color, border: '1px solid ' + statusMeta[selectedFlag.status].color + '33' }}>{selectedFlag.status}</span>
                 <span style={{ color: 'var(--text-muted)' }}>Kill Switch:</span><span style={{ color: selectedFlag.killSwitch ? 'var(--accent-red)' : 'var(--accent-green)' }}>{selectedFlag.killSwitch ? <><Icon name="x-circle" size={12} /> ACTIVE</> : <><Icon name="circle" size={12} /> OFF</>}</span>
                <span style={{ color: 'var(--text-muted)' }}>Environments:</span><span>{selectedFlag.environments.length > 0 ? selectedFlag.environments.join(', ') : 'All'}</span>
                <span style={{ color: 'var(--text-muted)' }}>Variants:</span><span>{selectedFlag.variants.length || 'None'}</span>
              </div>

              {(selectedFlag.status === 'ROLLOUT' || selectedFlag.status === 'EXPERIMENT') && (
                <div className="card">
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>ROLLOUT PERCENTAGE</div>
                  <div className="flex-wrap-gap">
                    <input type="range" min={0} max={100} value={selectedFlag.rollout} onChange={e => updateRollout(selectedFlag.id, parseInt(e.target.value))} style={s.slider} />
                    <span style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 700, color: 'var(--accent)', minWidth: 'clamp(40px, 10vw, 50px)' }}>{selectedFlag.rollout}%</span>
                  </div>
                  <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedFlag.rollout}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-green))', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              {selectedFlag.variants.length > 0 && (
                <div className="card">
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>VARIANT DISTRIBUTION</div>
                  {selectedFlag.variants.map(v => (
                    <div key={v.id} className="info-row">
                      <div className="flex-wrap-gap">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.id === 'control' || v.id === 'v1' || v.id === 'fifo' ? 'var(--accent-blue)' : v.id === 'treatment' || v.id === 'v2' || v.id === 'priority' ? 'var(--accent-green)' : 'var(--accent)' }} />
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{v.name}</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{v.id}</span>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--accent)' }}>{v.weight}%</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="flag" size={32} color="var(--text-muted)" /></div>
              <div className="empty-state-title">Select a feature flag</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

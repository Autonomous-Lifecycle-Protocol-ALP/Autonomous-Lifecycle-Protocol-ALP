import React from 'react';
import { Icon } from '../Icon.js';
import { statusMeta, s } from './shared.js';

interface FlagEditorProps {
  flag: { id: string; name: string; description: string; status: string; rollout: number; variants: { id: string; name: string; weight: number }[]; environments: string[]; killSwitch: boolean; updatedAt: string } | null;
  onToggleStatus: (id: string) => void;
  onToggleKill: (id: string) => void;
  onUpdateRollout: (id: string, pct: number) => void;
}

export const FlagEditor: React.FC<FlagEditorProps> = ({ flag, onToggleStatus, onToggleKill, onUpdateRollout }) => {
  if (!flag) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Icon name="flag" size={32} color="var(--text-muted)" /></div>
        <div className="empty-state-title">Select a feature flag</div>
      </div>
    );
  }

  const status = flag.status as 'ENABLED' | 'DISABLED' | 'ROLLOUT' | 'EXPERIMENT';

  return (
    <>
      <div className="flex-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        <div>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 700, color: statusMeta[status].color }}>
            <Icon name={statusMeta[status].icon} size={14} color={statusMeta[status].color} /> {flag.name}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 4 }}>{flag.description}</div>
        </div>
        <div className="flex-wrap-gap">
          <button className="btn btn-sm" style={s.btn('var(--accent-blue)')} onClick={() => onToggleStatus(flag.id)}><Icon name="zap" size={14} /> Toggle</button>
          <button className="btn btn-sm" style={s.btn(flag.killSwitch ? 'var(--accent-green)' : 'var(--accent-red)')} onClick={() => onToggleKill(flag.id)}>
            {flag.killSwitch ? <><Icon name="check" size={14} /> Revive</> : <><Icon name="xCircle" size={14} /> Kill</>}
          </button>
        </div>
      </div>

      <div className="card" style={{ ...s.card, display: 'grid', gridTemplateColumns: '1fr clamp(120px, 30vw, 200px)', gap: '8px 20px', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}>
        <span style={{ color: 'var(--text-muted)' }}>Status:</span><span className="badge badge-responsive" style={{ background: statusMeta[status].color + '18', color: statusMeta[status].color, border: '1px solid ' + statusMeta[status].color + '33' }}>{status}</span>
        <span style={{ color: 'var(--text-muted)' }}>Kill Switch:</span><span style={{ color: flag.killSwitch ? 'var(--accent-red)' : 'var(--accent-green)' }}>{flag.killSwitch ? <><Icon name="x-circle" size={12} /> ACTIVE</> : <><Icon name="circle" size={12} /> OFF</>}</span>
        <span style={{ color: 'var(--text-muted)' }}>Environments:</span><span>{flag.environments.length > 0 ? flag.environments.join(', ') : 'All'}</span>
        <span style={{ color: 'var(--text-muted)' }}>Variants:</span><span>{flag.variants.length || 'None'}</span>
      </div>

      {(status === 'ROLLOUT' || status === 'EXPERIMENT') && (
        <div className="card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>ROLLOUT PERCENTAGE</div>
          <div className="flex-wrap-gap">
            <input type="range" min={0} max={100} value={flag.rollout} onChange={e => onUpdateRollout(flag.id, parseInt(e.target.value))} style={s.slider} />
            <span style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 700, color: 'var(--accent)', minWidth: 'clamp(40px, 10vw, 50px)' }}>{flag.rollout}%</span>
          </div>
          <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ width: `${flag.rollout}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-green))', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {flag.variants.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>VARIANT DISTRIBUTION</div>
          {flag.variants.map(v => (
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
  );
};

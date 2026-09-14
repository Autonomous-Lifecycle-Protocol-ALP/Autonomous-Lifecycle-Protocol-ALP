import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { INITIAL_FLAGS, statusMeta, s } from './shared.js';
import { FlagList } from './FlagList.js';
import { FlagEditor } from './FlagEditor.js';

export function FeatureFlagPanel(): React.JSX.Element {
  const [flagState, setFlags] = useState(INITIAL_FLAGS);
  const [selected, setSelected] = useState<string>('flag-001');

  const selectedFlag = flagState.find(f => f.id === selected);

  const toggleStatus = (id: string) => {
    setFlags(prev => prev.map(f => {
      if (f.id !== id) return f;
      const order: Array<'DISABLED' | 'ENABLED' | 'ROLLOUT' | 'EXPERIMENT'> = ['DISABLED', 'ENABLED', 'ROLLOUT', 'EXPERIMENT'];
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

  const enabledCount = flagState.filter(f => f.status === 'ENABLED' || f.status === 'ROLLOUT').length;
  const experimentCount = flagState.filter(f => f.status === 'EXPERIMENT').length;

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

      <div style={s.kpiRow}>
        <div style={s.kpi('var(--accent-green)')}>
          <div style={s.kpiLabel}>Total Flags</div>
          <div style={s.kpiValue('var(--accent-green)')}>{flagState.length}</div>
        </div>
        <div style={s.kpi('var(--accent-yellow)')}>
          <div style={s.kpiLabel}>Rolling Out</div>
          <div style={s.kpiValue('var(--accent-yellow)')}>{flagState.filter(f => f.status === 'ROLLOUT').length}</div>
        </div>
        <div style={s.kpi('var(--accent)')}>
          <div style={s.kpiLabel}>Experiments</div>
          <div style={s.kpiValue('var(--accent)')}>{experimentCount}</div>
        </div>
        <div style={s.kpi('var(--accent-red)')}>
          <div style={s.kpiLabel}>Kill Switches</div>
          <div style={s.kpiValue('var(--accent-red)')}>{flagState.filter(f => f.killSwitch).length}</div>
        </div>
      </div>

      <div style={s.body}>
        <FlagList flags={flagState} selected={selected} onSelect={setSelected} />
        <div style={s.detail}>
          <FlagEditor flag={selectedFlag ?? null} onToggleStatus={toggleStatus} onToggleKill={toggleKill} onUpdateRollout={updateRollout} />
        </div>
      </div>
    </div>
  );
}

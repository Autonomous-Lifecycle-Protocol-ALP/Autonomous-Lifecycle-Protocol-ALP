import React from 'react';
import { Icon } from '../Icon.js';
import { INITIAL_FLAGS, statusMeta, s } from './shared.js';

interface FlagListProps {
  flags: typeof INITIAL_FLAGS;
  selected: string;
  onSelect: (id: string) => void;
}

export const FlagList: React.FC<FlagListProps> = ({ flags, selected, onSelect }) => {
  return (
    <div style={s.list}>
      <div style={{ padding: '10px 16px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', boxSizing: 'border-box' }}>
        Flags ({flags.length})
      </div>
      {flags.map(f => (
        <div key={f.id} style={s.flagRow(selected === f.id)} onClick={() => onSelect(f.id)}>
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
  );
};

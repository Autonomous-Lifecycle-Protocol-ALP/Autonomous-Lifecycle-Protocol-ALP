import React from 'react';
import { PresenceListProps } from './shared.js';

export function PresenceList({ presence }: PresenceListProps): React.JSX.Element | null {
  if (presence.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Active Agents</div>
      {presence.map((peer) => (
        <div
          key={peer.peerId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 8px',
            background: 'var(--bg-surface)',
            borderRadius: 4,
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: peer.color, display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>{peer.displayName}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {peer.cursor ? `Ln ${peer.cursor.line}, Col ${peer.cursor.column}` : 'Idle'}
          </span>
        </div>
      ))}
    </div>
  );
}

import React from 'react';
import { Command } from './shared.js';

interface CommandDetailProps {
  command: Command | null;
}

export function CommandDetail({ command }: CommandDetailProps): React.JSX.Element {
  if (!command) {
    return (
      <div className="empty-state" style={{ padding: '24px 16px', textAlign: 'center' }}>
        <div className="empty-state-desc">Select a command to see details.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
        {command.label}
      </div>
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>
        {command.category}
      </div>
      {command.shortcut && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Shortcut:</span>
          {command.shortcut.map((k) => (
            <kbd key={k} style={{ fontSize: 'var(--font-size-xs)', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border-color)' }}>
              {k}
            </kbd>
          ))}
        </div>
      )}
    </div>
  );
}

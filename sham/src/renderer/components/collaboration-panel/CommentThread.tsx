import React from 'react';
import { CommentThreadProps } from './shared.js';

export function CommentThread({ output }: CommentThreadProps): React.JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg-secondary)',
        borderRadius: 6,
        border: '1px solid var(--border)',
        padding: 8,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 6,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Activity
      </div>
      {output.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No activity yet.</div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {output.map((line, i) => (
            <li
              key={i}
              style={{
                fontSize: 12,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                padding: '2px 0',
              }}
            >
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

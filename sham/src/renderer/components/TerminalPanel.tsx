import React from 'react';
import { theme } from '../styles/theme.js';

interface TerminalPanelProps {
  output: string[];
}

export function TerminalPanel({ output }: TerminalPanelProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: theme.terminalBackground }}>
      <div style={{ padding: '4px 12px', background: theme.headerBackground, borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.textMuted }}>
        Terminal
      </div>
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: 8, fontFamily: 'monospace', fontSize: 12, color: theme.textPrimary }}>
        {output.length === 0 ? (
          <div style={{ color: theme.textMuted }}>No output yet. Run an agent to see results here.</div>
        ) : (
          output.map((line, i) => (
            <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</div>
          ))
        )}
      </div>
      <div style={{ padding: '4px 12px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 8 }}>
        <input type="text" placeholder="Type a command..." style={{ flex: 1, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '4px 8px', borderRadius: 4, fontSize: 12, outline: 'none' }} />
        <button style={{ padding: '4px 12px', background: theme.accent, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Run</button>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../styles/theme.js';
import { execTerminalCommand } from '../shared/alp-client.js';
import type { TerminalResult } from '../shared/types.js';

interface TerminalPanelProps {
  output: string[];
  onAppendOutput: (lines: string[]) => void;
}

export function TerminalPanel({ output, onAppendOutput }: TerminalPanelProps): React.JSX.Element {
  const [command, setCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = async () => {
    const trimmed = command.trim();
    if (!trimmed || isRunning) return;
    setCommand('');
    setIsRunning(true);
    try {
      onAppendOutput([`$ ${trimmed}`]);
      const result = await execTerminalCommand(trimmed);
      if (result.stdout) {
        onAppendOutput(result.stdout.split('\n'));
      }
      if (result.stderr) {
        onAppendOutput(result.stderr.split('\n'));
      }
      if (!result.success && result.error) {
        onAppendOutput([`Error: ${result.error}`]);
      }
    } finally {
      setIsRunning(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: theme.terminalBackground }}>
      <div style={{ padding: '4px 12px', background: theme.headerBackground, borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.textMuted }}>
        Terminal
      </div>
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: 8, fontFamily: 'monospace', fontSize: 12, color: theme.textPrimary }}>
        {output.length === 0 ? (
          <div style={{ color: theme.textMuted }}>Ready. Type an ALP CLI command, e.g. `alp validate file.alp`.</div>
        ) : (
          output.map((line, i) => {
            const isError = line.startsWith('Error:');
            return (
              <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: isError ? theme.accentRed : theme.textPrimary }}>{line}</div>
            );
          })
        )}
      </div>
      <div style={{ padding: '4px 12px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 8 }}>
        <span style={{ color: theme.textMuted, fontSize: 12, padding: '4px 0' }}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          placeholder="Type a command..."
          disabled={isRunning}
          style={{ flex: 1, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '4px 8px', borderRadius: 4, fontSize: 12, outline: 'none', opacity: isRunning ? 0.7 : 1 }}
        />
        <button onClick={handleSubmit} disabled={isRunning} style={{ padding: '4px 12px', background: theme.accent, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: isRunning ? 0.7 : 1 }}>
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  );
}

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--terminal-bg)' }}>
      <div style={{ padding: '4px 12px', background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Terminal</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>ALP CLI</span>
      </div>
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
        {output.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>Ready. Type an ALP CLI command, e.g. `alp validate file.alp`.</div>
        ) : (
          output.map((line, i) => {
            const isError = line.startsWith('Error:');
            return (
              <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: isError ? 'var(--accent-red)' : 'var(--text-primary)', animation: 'fadeIn 0.1s ease' }}>{line}</div>
            );
          })
        )}
      </div>
      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <span style={{ color: 'var(--accent-green)', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$</span>
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
          style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', opacity: isRunning ? 0.7 : 1 }}
        />
        <button onClick={handleSubmit} disabled={isRunning} style={{ padding: '4px 12px', background: 'var(--accent)', border: 'none', color: 'var(--bg-primary)', borderRadius: 4, cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: isRunning ? 0.7 : 1 }}>
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  );
}

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
    <div className="panel-container" style={{ backgroundColor: 'var(--terminal-bg)' }}>
      <div className="panel-header">
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Terminal</span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', opacity: 0.7 }}>ALP CLI</span>
      </div>
      <div ref={containerRef} className="detail-panel" style={{ padding: 'var(--spacing-xs)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.6, boxSizing: 'border-box' }}>
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
      <div className="panel-header" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <span style={{ color: 'var(--accent-green)', fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$</span>
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
          className="input-field"
          style={{ flex: 1, backgroundColor: 'var(--bg-primary)', fontFamily: 'var(--font-mono)', opacity: isRunning ? 0.7 : 1, boxSizing: 'border-box' }}
        />
        <button onClick={handleSubmit} disabled={isRunning} className="btn btn-sm" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)', opacity: isRunning ? 0.7 : 1 }}>
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Icon } from './Icon.js';

interface DebugSession {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'stopped';
  breakpoints: string[];
  callStack: { name: string; file: string; line: number }[];
  variables: Record<string, unknown>;
}

interface DebugPanelProps {
  session?: DebugSession | null;
  output: string[];
  onAppendOutput: (lines: string[]) => void;
  onStartDebug: (filePath: string) => void;
  onStopDebug: () => void;
  onToggleBreakpoint: (line: number) => void;
}

export function DebugPanel({ session, output, onAppendOutput, onStartDebug, onStopDebug, onToggleBreakpoint }: DebugPanelProps): React.JSX.Element {
  return (
    <div className="panel-container">
      <div className="panel-header">
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Debug Console</span>
        <div style={{ flex: 1 }} />
        {session && session.status !== 'idle' ? (
          <button className="btn btn-danger btn-sm" onClick={onStopDebug}>Stop</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => onStartDebug('active-file')}>Start Debugging</button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {session && session.status !== 'idle' ? (
          <>
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '8px 12px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Breakpoints</div>
              {session.breakpoints.length === 0 ? (
                <div style={{ padding: '0 12px 8px', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>No breakpoints</div>
              ) : (
                session.breakpoints.map((bp, i) => (
                  <div key={i} className="list-item" onClick={() => onToggleBreakpoint(Number(bp))}>
                     <span className="list-item-icon" style={{ color: 'var(--accent-red)' }}><Icon name="circle" size={10} /></span>
                    <div className="list-item-content">
                      <div className="list-item-title">Line {bp}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '8px 12px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Call Stack</div>
              {session.callStack.length === 0 ? (
                <div style={{ padding: '0 12px 8px', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>No active stack</div>
              ) : (
                session.callStack.map((frame, i) => (
                  <div key={i} className="list-item">
                     <span className="list-item-icon" style={{ color: 'var(--accent)' }}><Icon name="gitCompare" size={14} /></span>
                    <div className="list-item-content">
                      <div className="list-item-title">{frame.name}</div>
                      <div className="list-item-subtitle">{frame.file}:{frame.line}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)', padding: 'var(--spacing-xs)' }}>
              {output.map((line, i) => (
                <div key={i} style={{ padding: '2px 0', color: 'var(--text-secondary)' }}>{line}</div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="search" size={32} color="var(--text-muted)" /></div>
            <div className="empty-state-title">No debug session</div>
            <div className="empty-state-desc">Open an ALP file and click Start Debugging to attach the debugger.</div>
          </div>
        )}
      </div>
    </div>
  );
}

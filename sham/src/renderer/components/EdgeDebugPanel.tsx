import React, { useState } from 'react';

interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
}

interface CallFrame {
  functionName: string;
  file: string;
  line: number;
}

export function EdgeDebugPanel(): React.JSX.Element {
  const [nodeId, setNodeId] = useState<string>('node-us-east-1');
  const [agentId, setAgentId] = useState<string>('agent-executor-1');
  const [status, setStatus] = useState<'PAUSED' | 'RUNNING' | 'DISCONNECTED'>('PAUSED');

  const [frame, setFrame] = useState<CallFrame>({
    functionName: 'executePolicy',
    file: 'policy-eval.alp',
    line: 14,
  });

  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([
    { id: 'bp-1', file: 'policy-eval.alp', line: 15, enabled: true },
    { id: 'bp-2', file: 'task-runner.alp', line: 42, enabled: true },
  ]);

  const [variables, setVariables] = useState<Record<string, unknown>>({
    tokenBalance: 45.0,
    consensusStatus: 'QUORUM_REACHED',
    retryCount: 0,
    activeRegion: 'us-east',
  });

  const handleStepOver = () => {
    setFrame(prev => ({ ...prev, line: prev.line + 1 }));
    setStatus('PAUSED');
  };

  const handleResume = () => {
    setStatus('RUNNING');
  };

  const toggleBreakpoint = (id: string) => {
    setBreakpoints(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  return (
    <div className="panel-container" style={{ height: '100%', backgroundColor: 'var(--terminal-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}>
      <div className="panel-header">
        <div className="flex-wrap-gap">
          <span style={{ fontSize: 'var(--font-size-md)' }}>🐛</span>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--accent)' }}>Cloud Edge Live Debugger</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent)22', color: 'var(--accent)', border: '1px solid var(--accent)44' }}>v68.0.0</span>
        </div>
        <div className="flex-wrap-gap">
          <span className="badge badge-responsive" style={{ background: 'var(--accent-blue)22', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)44' }}>Node: {nodeId}</span>
          <span className="badge badge-responsive" style={{ background: status === 'PAUSED' ? 'var(--accent-yellow)22' : 'var(--accent-green)22', color: status === 'PAUSED' ? 'var(--accent-yellow)' : 'var(--accent-green)', border: `1px solid ${status === 'PAUSED' ? 'var(--accent-yellow)' : 'var(--accent-green)'}44` }}>● {status}</span>
        </div>
      </div>

      <div className="action-bar" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button className="btn btn-responsive btn-primary" onClick={handleStepOver}>⏭️ Step Over</button>
        <button className="btn btn-responsive btn-success" onClick={handleResume}>▶️ Resume</button>
        <button className="btn btn-responsive btn-warning" onClick={() => setStatus('PAUSED')}>⏸️ Pause</button>
      </div>

      <div className="panel-split" style={{ height: '100%', overflow: 'hidden', flex: 1, flexDirection: 'row' }}>
        {/* Left Pane: Stack & Breakpoints */}
        <div className="panel-split-sidebar" style={{ width: 'clamp(200px, 30vw, 320px)', maxWidth: '400px', borderRight: '1px solid var(--border)', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div className="section-card">
            <div className="section-card-title">Active Call Frame</div>
            <div className="card">
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--accent)' }}>{frame.functionName}()</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{frame.file}:{frame.line}</div>
            </div>

            <div className="section-card-title">Distributed Breakpoints ({breakpoints.length})</div>
            {breakpoints.map(bp => (
              <div key={bp.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{bp.file}:{bp.line}</div>
                </div>
                <input
                  type="checkbox"
                  checked={bp.enabled}
                  onChange={() => toggleBreakpoint(bp.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Variable Watch Tree */}
        <div className="panel-split-main" style={{ overflowY: 'auto', boxSizing: 'border-box' }}>
          <div className="section-card">
            <div className="section-card-title">Variables Watch Tree</div>
            <div className="card">
              {Object.entries(variables).map(([k, v]) => (
                <div key={k} className="info-row">
                  <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{k}</span>
                  <span style={{ color: 'var(--accent-green)', fontFamily: 'monospace' }}>{JSON.stringify(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

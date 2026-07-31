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

  const styles = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: '#0a0a14', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
    header: { padding: '12px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    controls: { padding: '8px 16px', background: '#121324', borderBottom: '1px solid #1e2035', display: 'flex', gap: 10, alignItems: 'center' },
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    pane: { flex: 1, padding: 16, borderRight: '1px solid #1e2035', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 12 },
    btn: (color: string) => ({ background: color, border: 'none', borderRadius: 6, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
    badge: (color: string) => ({ padding: '3px 10px', borderRadius: 12, background: color + '22', color, fontSize: 11, fontWeight: 600, border: `1px solid ${color}44` }),
    card: { background: '#16182a', borderRadius: 8, padding: 12, border: '1px solid #1e2035' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🐛</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>Cloud Edge Live Debugger</span>
          <span style={{ fontSize: 11, background: '#a78bfa22', color: '#a78bfa', padding: '2px 8px', borderRadius: 10 }}>v68.0.0</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={styles.badge('#4fc3f7')}>Node: {nodeId}</span>
          <span style={styles.badge(status === 'PAUSED' ? '#ffd54f' : '#aed581')}>● {status}</span>
        </div>
      </div>

      <div style={styles.controls}>
        <button style={styles.btn('#4fc3f7')} onClick={handleStepOver}>
          ⏭️ Step Over
        </button>
        <button style={styles.btn('#aed581')} onClick={handleResume}>
          ▶️ Resume
        </button>
        <button style={styles.btn('#ff8a65')} onClick={() => setStatus('PAUSED')}>
          ⏸️ Pause
        </button>
      </div>

      <div style={styles.body}>
        {/* Left Pane: Stack & Breakpoints */}
        <div style={styles.pane}>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Active Call Frame:</div>
          <div style={styles.card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{frame.functionName}()</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{frame.file}:{frame.line}</div>
          </div>

          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 12 }}>Distributed Breakpoints ({breakpoints.length}):</div>
          {breakpoints.map(bp => (
            <div key={bp.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#e0e0e0' }}>{bp.file}:{bp.line}</div>
              </div>
              <input
                type="checkbox"
                checked={bp.enabled}
                onChange={() => toggleBreakpoint(bp.id)}
              />
            </div>
          ))}
        </div>

        {/* Right Pane: Variable Watch Tree */}
        <div style={styles.pane}>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Variables Watch Tree:</div>
          <div style={styles.card}>
            {Object.entries(variables).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e2035', fontSize: 12 }}>
                <span style={{ color: '#4fc3f7', fontFamily: 'monospace' }}>{k}</span>
                <span style={{ color: '#aed581', fontFamily: 'monospace' }}>{JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

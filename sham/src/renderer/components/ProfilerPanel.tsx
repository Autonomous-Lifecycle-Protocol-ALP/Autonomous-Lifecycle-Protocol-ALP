import React, { useState, useEffect } from 'react';
import {
  profilerStart,
  profilerStop,
  profilerList,
  profilerClear,
} from '../shared/alp-client.js';
import type { ProfileTrace } from '../shared/types.js';

interface ProfilerPanelProps {
  traces: ProfileTrace[];
  output: string[];
  onUpdateTraces: (traces: ProfileTrace[]) => void;
  onAppendOutput: (lines: string[]) => void;
}

export function ProfilerPanel({
  traces,
  output,
  onUpdateTraces,
  onAppendOutput,
}: ProfilerPanelProps): React.JSX.Element {
  const [agentId, setAgentId] = useState('');
  const [command, setCommand] = useState('');
  const [runningTraceId, setRunningTraceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    profilerList().then((result) => {
      if (result.success) {
        onUpdateTraces(result.traces);
      }
    });
  }, []);

  const appendFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    onAppendOutput([`[${type.toUpperCase()}] ${message}`]);
  };

  const handleStart = async () => {
    setLoading(true);
    setFeedback(null);
    const result = await profilerStart({
      agentId: agentId.trim() || undefined,
      command: command.trim() || undefined,
    });
    if (result.success && result.trace) {
      onUpdateTraces([result.trace, ...traces]);
      setRunningTraceId(result.trace.id);
      appendFeedback('success', `Trace ${result.trace.id} started`);
    } else {
      appendFeedback('error', result.error ?? 'Failed to start trace');
    }
    setLoading(false);
  };

  const handleStop = async (trace: ProfileTrace, status: 'completed' | 'failed') => {
    setLoading(true);
    setFeedback(null);
    const result = await profilerStop({
      traceId: trace.id,
      status,
      stdout: trace.stdout,
      stderr: trace.stderr,
      error: status === 'failed' ? trace.error : undefined,
    });
    if (result.success && result.trace) {
      onUpdateTraces(traces.map((t) => (t.id === trace.id ? result.trace! : t)));
      appendFeedback('success', `Trace ${trace.id} stopped`);
      if (runningTraceId === trace.id) {
        setRunningTraceId(null);
      }
    } else {
      appendFeedback('error', result.error ?? 'Failed to stop trace');
    }
    setLoading(false);
  };

  const handleClear = async () => {
    setLoading(true);
    setFeedback(null);
    const result = await profilerClear();
    if (result.success) {
      onUpdateTraces([]);
      appendFeedback('success', 'Traces cleared');
    } else {
      appendFeedback('error', 'Failed to clear traces');
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <div className="panel-title" style={{ padding: 0, marginBottom: 8 }}>Profiler</div>
        {feedback && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              marginBottom: 8,
              backgroundColor: feedback.type === 'success' ? 'rgba(166, 227, 161, 0.1)' : 'rgba(243, 139, 168, 0.1)',
              color: feedback.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            }}
          >
            {feedback.message}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Agent ID (optional)"
            className="input-field"
            style={{ flex: 1, minWidth: 140 }}
          />
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Command (optional)"
            className="input-field"
            style={{ flex: 1, minWidth: 180 }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleStart}
            disabled={loading || !!runningTraceId}
            style={{ opacity: loading || runningTraceId ? 0.6 : 1 }}
          >
            Start Trace
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {traces.length === 0 ? (
          <div className="empty-state" style={{ height: 'auto', padding: 24 }}>
            <div className="empty-state-icon">&#9201;</div>
            <div className="empty-state-title">No traces recorded yet</div>
            <div className="empty-state-desc">Start a trace to profile agent execution, policy decisions, and memory operations.</div>
          </div>
        ) : (
          traces.map((trace) => (
            <div
              key={trace.id}
              className="section-card"
              style={{ marginBottom: 8, opacity: trace.status === 'running' ? 1 : 0.85 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{trace.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {trace.agentId ? `Agent: ${trace.agentId}` : trace.command ? `Command: ${trace.command}` : 'Manual trace'}
                    {trace.durationMs !== undefined && ` · ${trace.durationMs}ms`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Started: {new Date(trace.startedAt).toLocaleTimeString()}
                    {trace.finishedAt && ` · Finished: ${new Date(trace.finishedAt).toLocaleTimeString()}`}
                  </div>
                </div>
                <span
                  className={`badge ${trace.status === 'running' ? 'badge-info' : trace.status === 'completed' ? 'badge-success' : 'badge-error'}`}
                >
                  {trace.status}
                </span>
              </div>

              {trace.status === 'running' && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleStop(trace, 'completed')} disabled={loading}>Complete</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleStop(trace, 'failed')} disabled={loading}>Fail</button>
                </div>
              )}

              {(trace.stdout || trace.stderr || trace.error) && (
                <div style={{ marginTop: 8, background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border)', padding: 8 }}>
                  {trace.stdout && (
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{trace.stdout}</div>
                  )}
                  {trace.stderr && (
                    <div style={{ fontSize: 11, color: 'var(--accent-yellow)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{trace.stderr}</div>
                  )}
                  {trace.error && (
                    <div style={{ fontSize: 11, color: 'var(--accent-red)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>Error: {trace.error}</div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Profiler Log</div>
          <button className="btn btn-secondary btn-sm" onClick={handleClear} disabled={loading || traces.length === 0}>Clear</button>
        </div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)', padding: 8 }}>
          {output.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No profiler activity yet.</div>
          ) : (
            output.map((line, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '1px 0' }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

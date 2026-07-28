import React, { useState, useEffect } from 'react';
import { theme } from '../styles/theme.js';
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
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Profiler</div>
        {feedback && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              marginBottom: 8,
              backgroundColor: feedback.type === 'success' ? '#1a3a2a' : '#3a1a1a',
              color: feedback.type === 'success' ? theme.accentGreen : theme.accentRed,
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
            style={{ flex: 1, minWidth: 140, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }}
          />
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Command (optional)"
            style={{ flex: 1, minWidth: 180, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }}
          />
          <button
            onClick={handleStart}
            disabled={loading || !!runningTraceId}
            style={{ padding: '6px 14px', background: theme.accentGreen, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading || runningTraceId ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading || runningTraceId ? 0.6 : 1 }}
          >
            Start Trace
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {traces.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: 24 }}>
            No traces recorded yet.
          </div>
        ) : (
          traces.map((trace) => (
            <div
              key={trace.id}
              style={{
                padding: 10,
                marginBottom: 8,
                background: theme.bgSurface,
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                opacity: trace.status === 'running' ? 1 : 0.85,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: theme.textPrimary }}>{trace.id}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    {trace.agentId ? `Agent: ${trace.agentId}` : trace.command ? `Command: ${trace.command}` : 'Manual trace'}
                    {trace.durationMs !== undefined && ` · ${trace.durationMs}ms`}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    Started: {new Date(trace.startedAt).toLocaleTimeString()}
                    {trace.finishedAt && ` · Finished: ${new Date(trace.finishedAt).toLocaleTimeString()}`}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 10,
                    backgroundColor:
                      trace.status === 'running'
                        ? '#1a1a3a'
                        : trace.status === 'completed'
                          ? '#1a3a2a'
                          : '#3a1a1a',
                    color:
                      trace.status === 'running'
                        ? theme.accent
                        : trace.status === 'completed'
                          ? theme.accentGreen
                          : theme.accentRed,
                  }}
                >
                  {trace.status}
                </span>
              </div>

              {trace.status === 'running' && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleStop(trace, 'completed')}
                    disabled={loading}
                    style={{ padding: '4px 10px', background: theme.accentGreen, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleStop(trace, 'failed')}
                    disabled={loading}
                    style={{ padding: '4px 10px', background: theme.accentRed, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                  >
                    Fail
                  </button>
                </div>
              )}

              {(trace.stdout || trace.stderr || trace.error) && (
                <div style={{ marginTop: 8, background: theme.bgSecondary, borderRadius: 4, border: `1px solid ${theme.border}`, padding: 8 }}>
                  {trace.stdout && (
                    <div style={{ fontSize: 11, color: theme.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{trace.stdout}</div>
                  )}
                  {trace.stderr && (
                    <div style={{ fontSize: 11, color: theme.accentYellow, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{trace.stderr}</div>
                  )}
                  {trace.error && (
                    <div style={{ fontSize: 11, color: theme.accentRed, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>Error: {trace.error}</div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: theme.textMuted }}>Profiler Log</div>
          <button onClick={handleClear} disabled={loading || traces.length === 0} style={{ padding: '4px 10px', background: theme.bgHover, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 4, cursor: loading || traces.length === 0 ? 'not-allowed' : 'pointer', fontSize: 11, opacity: loading || traces.length === 0 ? 0.6 : 1 }}>
            Clear
          </button>
        </div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: theme.bgSecondary, borderRadius: 6, border: `1px solid ${theme.border}`, padding: 8 }}>
          {output.length === 0 ? (
            <div style={{ color: theme.textMuted, fontSize: 12 }}>No profiler activity yet.</div>
          ) : (
            output.map((line, i) => (
              <div key={i} style={{ fontSize: 12, color: theme.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '1px 0' }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

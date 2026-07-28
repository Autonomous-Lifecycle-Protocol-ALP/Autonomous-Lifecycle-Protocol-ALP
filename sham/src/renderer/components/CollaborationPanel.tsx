import React, { useState, useEffect } from 'react';
import { theme } from '../styles/theme.js';
import {
  startCollab,
  joinCollab,
  getCollabStatus,
  leaveCollab,
  getCRDTStatus,
  mergeCRDT,
} from '../shared/alp-client.js';
import type { CollabSession } from '../shared/types.js';

interface CollaborationPanelProps {
  session: CollabSession | null;
  output: string[];
  onUpdateSession: (session: CollabSession | null) => void;
  onAppendOutput: (lines: string[]) => void;
}

export function CollaborationPanel({
  session,
  output,
  onUpdateSession,
  onAppendOutput,
}: CollaborationPanelProps): React.JSX.Element {
  const [mode, setMode] = useState<'host' | 'peer'>('host');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    getCollabStatus().then((result) => {
      if (result.success && result.stdout) {
        onAppendOutput(result.stdout.split('\n').filter(Boolean));
      }
    });
  }, []);

  const appendResult = async (result: { success: boolean; stdout: string; stderr: string; error?: string }) => {
    if (result.stdout) {
      onAppendOutput(result.stdout.split('\n').filter(Boolean));
    }
    if (result.stderr) {
      onAppendOutput(result.stderr.split('\n').filter(Boolean));
    }
    if (!result.success && result.error) {
      setFeedback({ type: 'error', message: result.error });
    } else {
      setFeedback({ type: 'success', message: 'Operation completed.' });
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setFeedback(null);
    const result = await startCollab(mode);
    await appendResult(result);
    if (result.success) {
      onUpdateSession({
        id: `session-${Date.now()}`,
        mode,
        peers: [],
        status: 'running',
        lastSyncAt: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!sessionId.trim()) return;
    setLoading(true);
    setFeedback(null);
    const result = await joinCollab(sessionId.trim());
    await appendResult(result);
    if (result.success) {
      onUpdateSession({
        id: sessionId.trim(),
        mode: 'peer',
        peers: [],
        status: 'running',
        lastSyncAt: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  const handleLeave = async () => {
    setLoading(true);
    setFeedback(null);
    const result = await leaveCollab();
    await appendResult(result);
    onUpdateSession(null);
    setLoading(false);
  };

  const handleCRDTStatus = async () => {
    setLoading(true);
    setFeedback(null);
    const result = await getCRDTStatus();
    await appendResult(result);
    setLoading(false);
  };

  const handleCRDTMerge = async () => {
    setLoading(true);
    setFeedback(null);
    const result = await mergeCRDT();
    await appendResult(result);
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Collaboration</div>
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
        {session ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: theme.textSecondary }}>
              <div>Session: <span style={{ color: theme.textPrimary, fontFamily: 'monospace' }}>{session.id}</span></div>
              <div>Mode: <span style={{ color: theme.textPrimary, textTransform: 'capitalize' }}>{session.mode}</span></div>
              <div>Status: <span style={{ color: theme.accentGreen, textTransform: 'capitalize' }}>{session.status}</span></div>
              {session.lastSyncAt && (
                <div>Last sync: <span style={{ color: theme.textPrimary }}>{session.lastSyncAt}</span></div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleLeave} disabled={loading} style={{ padding: '6px 14px', background: theme.accentRed, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                Leave Session
              </button>
              <button onClick={handleCRDTStatus} disabled={loading} style={{ padding: '6px 14px', background: theme.bgHover, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                CRDT Status
              </button>
              <button onClick={handleCRDTMerge} disabled={loading} style={{ padding: '6px 14px', background: theme.accent, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                Merge CRDT
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: theme.textMuted }}>Start or join a collaboration session.</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'host' | 'peer')}
                style={{ background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12 }}
              >
                <option value="host">Host</option>
                <option value="peer">Peer</option>
              </select>
              <button onClick={handleStart} disabled={loading} style={{ padding: '6px 14px', background: theme.accentGreen, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                Start Session
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Session ID to join"
                style={{ flex: 1, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }}
              />
              <button onClick={handleJoin} disabled={loading || !sessionId.trim()} style={{ padding: '6px 14px', background: theme.accent, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading || !sessionId.trim() ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading || !sessionId.trim() ? 0.6 : 1 }}>
                Join
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: theme.bgSecondary, borderRadius: 6, border: `1px solid ${theme.border}`, padding: 8 }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>Activity</div>
        {output.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12 }}>No activity yet.</div>
        ) : (
          output.map((line, i) => (
            <div key={i} style={{ fontSize: 12, color: theme.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '2px 0' }}>{line}</div>
          ))
        )}
      </div>
    </div>
  );
}

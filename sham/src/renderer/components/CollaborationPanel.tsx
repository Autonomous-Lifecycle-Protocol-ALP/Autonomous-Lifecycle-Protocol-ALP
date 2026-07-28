import React, { useState, useEffect } from 'react';
import {
  startCollab,
  joinCollab,
  getCollabStatus,
  leaveCollab,
  getCRDTStatus,
  mergeCRDT,
} from '../shared/alp-client.js';
import type { CollabSession, CollabPresence } from '../shared/types.js';

interface CollaborationPanelProps {
  session: CollabSession | null;
  output: string[];
  presence: CollabPresence[];
  onUpdateSession: (session: CollabSession | null) => void;
  onAppendOutput: (lines: string[]) => void;
  onUpdatePresence: (presence: CollabPresence[]) => void;
}

export function CollaborationPanel({
  session,
  output,
  presence,
  onUpdateSession,
  onAppendOutput,
  onUpdatePresence,
}: CollaborationPanelProps): React.JSX.Element {
  const [mode, setMode] = useState<'host' | 'peer'>('host');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCollabStatus().then((result) => {
      if (result.success && result.stdout) {
        onAppendOutput(result.stdout.split('\n').filter(Boolean));
      }
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    const peers = session.peers.map((peerId, index) => ({
      peerId,
      displayName: `Peer ${index + 1}`,
      color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'][index % 5],
      lastSeenAt: new Date().toISOString(),
    }));
    onUpdatePresence(peers);
  }, [session?.id, session?.peers.length]);

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

  const handleCopyShareLink = async () => {
    if (!session) return;
    const link = `sham://collab/join/${session.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setFeedback({ type: 'success', message: 'Share link copied to clipboard.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to copy link to clipboard.' });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <div className="panel-title" style={{ padding: 0, marginBottom: 8 }}>Collaboration</div>
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
        {session ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <div>Session: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{session.id}</span></div>
              <div>Mode: <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{session.mode}</span></div>
              <div>Status: <span style={{ color: 'var(--accent-green)', textTransform: 'capitalize' }}>{session.status}</span></div>
              {session.lastSyncAt && (
                <div>Last sync: <span style={{ color: 'var(--text-primary)' }}>{session.lastSyncAt}</span></div>
              )}
            </div>
            {presence.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Peers</div>
                {presence.map((peer) => (
                  <div key={peer.peerId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'var(--bg-surface)', borderRadius: 4, border: '1px solid var(--border)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: peer.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>{peer.displayName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {peer.cursor ? `Ln ${peer.cursor.line}, Col ${peer.cursor.column}` : 'Idle'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyShareLink} disabled={loading}>
                {copied ? 'Copied!' : 'Copy Share Link'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleLeave} disabled={loading}>Leave Session</button>
              <button className="btn btn-secondary btn-sm" onClick={handleCRDTStatus} disabled={loading}>CRDT Status</button>
              <button className="btn btn-primary btn-sm" onClick={handleCRDTMerge} disabled={loading}>Merge CRDT</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Start or join a collaboration session.</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'host' | 'peer')}
                className="input-field"
                style={{ width: 100 }}
              >
                <option value="host">Host</option>
                <option value="peer">Peer</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleStart} disabled={loading}>Start Session</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Session ID to join"
                className="input-field"
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleJoin} disabled={loading || !sessionId.trim()}>Join</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)', padding: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Activity</div>
        {output.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No activity yet.</div>
        ) : (
          output.map((line, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '2px 0' }}>{line}</div>
          ))
        )}
      </div>
    </div>
  );
}

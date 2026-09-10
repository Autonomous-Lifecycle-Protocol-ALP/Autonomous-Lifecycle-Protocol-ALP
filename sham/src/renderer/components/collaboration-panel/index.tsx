import React, { useState, useEffect } from 'react';
import {
  startCollab,
  joinCollab,
  getCollabStatus,
  leaveCollab,
  getCRDTStatus,
  mergeCRDT,
} from '../../shared/alp-client.js';
import {
  CollaborationPanelProps,
  CollabMode,
  Feedback,
  CollabResult,
  buildPeerPresence,
  buildShareLink,
  splitLines,
} from './shared.js';
import { PresenceList } from './PresenceList.js';
import { CommentThread } from './CommentThread.js';
import { ShareControls } from './ShareControls.js';

export function CollaborationPanel({
  session,
  output,
  presence,
  onUpdateSession,
  onAppendOutput,
  onUpdatePresence,
}: CollaborationPanelProps): React.JSX.Element {
  const [mode, setMode] = useState<CollabMode>('host');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCollabStatus().then((result) => {
      if (result.success && result.stdout) {
        onAppendOutput(splitLines(result.stdout));
      }
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    const peers = buildPeerPresence(session.peers, new Date().toISOString());
    onUpdatePresence(peers);
  }, [session?.id, session?.peers.length]);

  const appendResult = async (result: CollabResult) => {
    if (result.stdout) {
      onAppendOutput(splitLines(result.stdout));
    }
    if (result.stderr) {
      onAppendOutput(splitLines(result.stderr));
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
    const link = buildShareLink(session.id);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setFeedback({ type: 'success', message: 'Share link copied to clipboard.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to copy link to clipboard.' });
    }
  };

  const shareControls = (
    <ShareControls
      session={session}
      mode={mode}
      sessionId={sessionId}
      loading={loading}
      copied={copied}
      onModeChange={setMode}
      onSessionIdChange={setSessionId}
      onStart={handleStart}
      onJoin={handleJoin}
      onCopyShareLink={handleCopyShareLink}
      onLeave={handleLeave}
      onCRDTStatus={handleCRDTStatus}
      onCRDTMerge={handleCRDTMerge}
    />
  );

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
            <PresenceList presence={presence} />
            {shareControls}
          </div>
        ) : (
          shareControls
        )}
      </div>
      <CommentThread output={output} />
    </div>
  );
}

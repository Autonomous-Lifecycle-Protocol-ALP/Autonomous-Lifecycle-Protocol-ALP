import React from 'react';
import { ShareControlsProps, CollabMode } from './shared.js';

export function ShareControls({
  session,
  mode,
  sessionId,
  loading,
  copied,
  onModeChange,
  onSessionIdChange,
  onStart,
  onJoin,
  onCopyShareLink,
  onLeave,
  onCRDTStatus,
  onCRDTMerge,
}: ShareControlsProps): React.JSX.Element {
  if (session) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={onCopyShareLink} disabled={loading}>
          {copied ? 'Copied!' : 'Copy Share Link'}
        </button>
        <button className="btn btn-danger btn-sm" onClick={onLeave} disabled={loading}>Leave Session</button>
        <button className="btn btn-secondary btn-sm" onClick={onCRDTStatus} disabled={loading}>CRDT Status</button>
        <button className="btn btn-primary btn-sm" onClick={onCRDTMerge} disabled={loading}>Merge CRDT</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Start or join a collaboration session.</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as CollabMode)}
          className="input-field"
          style={{ width: 100 }}
        >
          <option value="host">Host</option>
          <option value="peer">Peer</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={onStart} disabled={loading}>Start Session</button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={sessionId}
          onChange={(e) => onSessionIdChange(e.target.value)}
          placeholder="Session ID to join"
          className="input-field"
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" onClick={onJoin} disabled={loading || !sessionId.trim()}>Join</button>
      </div>
    </div>
  );
}

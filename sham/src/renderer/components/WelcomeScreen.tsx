import React from 'react';

interface WelcomeScreenProps {
  onOpenFile: (filePath: string) => void;
}

export function WelcomeScreen({ onOpenFile }: WelcomeScreenProps): React.JSX.Element {
  return (
    <div className="empty-state" style={{ height: '100%' }}>
      <div className="empty-state-icon" style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
        SHAM
      </div>
      <div className="empty-state-title" style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 400 }}>
        Smart Hosted Agent Manager
      </div>
      <div className="empty-state-desc" style={{ marginBottom: 24 }}>
        Build, test, and deploy ALP agents with a dedicated IDE. Open an ALP file to get started, or create a new one.
      </div>
      <button
        className="btn btn-primary"
        style={{ padding: '10px 24px', fontSize: 14, borderRadius: 6 }}
        onClick={() => onOpenFile('example.alp')}
      >
        New ALP File
      </button>
      <div style={{ marginTop: 24, display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>Editor</span>
        <span>Terminal</span>
        <span>Agents</span>
        <span>MCP Tools</span>
      </div>
    </div>
  );
}

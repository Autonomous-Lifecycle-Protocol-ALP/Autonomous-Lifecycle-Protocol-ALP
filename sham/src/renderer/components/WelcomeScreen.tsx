import React from 'react';

interface WelcomeScreenProps {
  onOpenFile: (filePath: string) => void;
}

export function WelcomeScreen({ onOpenFile }: WelcomeScreenProps): React.JSX.Element {
  return (
    <div className="empty-state" style={{ height: '100%', flexWrap: 'wrap' }}>
      <div className="empty-state-icon" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, color: 'var(--accent)', marginBottom: 'clamp(8px, 2vw, 16px)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}>
        SHAM
      </div>
      <div className="empty-state-title" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'var(--text-secondary)', marginBottom: 'clamp(8px, 2vw, 16px)', fontWeight: 400 }}>
        Smart Hosted Agent Manager
      </div>
      <div className="empty-state-desc" style={{ marginBottom: 'clamp(16px, 4vw, 24px)', maxWidth: '90vw' }}>
        Build, test, and deploy ALP agents with a dedicated IDE. Open an ALP file to get started, or create a new one.
      </div>
      <button
        className="btn btn-primary btn-lg btn-responsive"
        onClick={() => onOpenFile('example.alp')}
      >
        New ALP File
      </button>
      <div className="flex-wrap-gap" style={{ marginTop: 'clamp(16px, 4vw, 24px)', gap: 'clamp(12px, 3vw, 24px)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        <span>Editor</span>
        <span>Terminal</span>
        <span>Agents</span>
        <span>MCP Tools</span>
      </div>
    </div>
  );
}

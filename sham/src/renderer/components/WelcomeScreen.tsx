import React from 'react';
import { theme } from '../styles/theme.js';

interface WelcomeScreenProps {
  onOpenFile: (filePath: string) => void;
}

export function WelcomeScreen({ onOpenFile }: WelcomeScreenProps): React.JSX.Element {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgPrimary }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: theme.accent, marginBottom: 8 }}>SHAM</div>
      <div style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 32 }}>Smart Hosted Agent Manager</div>
      <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 24, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
        Build, test, and deploy ALP agents with a dedicated IDE. Open an ALP file to get started, or create a new one.
      </div>
      <button onClick={() => onOpenFile('example.alp')} style={{ padding: '10px 24px', background: theme.accent, border: 'none', color: theme.bgPrimary, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
        New ALP File
      </button>
      <div style={{ marginTop: 24, display: 'flex', gap: 24, fontSize: 12, color: theme.textMuted }}>
        <span>Editor</span>
        <span>Terminal</span>
        <span>Agents</span>
        <span>MCP Tools</span>
      </div>
    </div>
  );
}
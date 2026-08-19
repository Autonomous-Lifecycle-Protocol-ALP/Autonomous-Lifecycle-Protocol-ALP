import React from 'react';
import { Icon } from './Icon.js';

interface WelcomeScreenProps {
  onOpenFile: (filePath: string) => void;
}

export function WelcomeScreen({ onOpenFile }: WelcomeScreenProps): React.JSX.Element {
  return (
    <div className="empty-state" style={{ height: '100%', flexWrap: 'wrap', justifyContent: 'center', background: 'radial-gradient(circle at top, var(--bg-surface) 0%, var(--bg-primary) 60%)' }}>
      <div className="empty-state-icon" style={{ 
        background: 'linear-gradient(135deg, var(--accent), var(--accent-purple))', 
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: 'clamp(3rem, 8vw, 5rem)', 
        fontWeight: 800, 
        marginBottom: 'clamp(8px, 2vw, 16px)', 
        fontFamily: 'var(--font-sans)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-purple))',
          boxShadow: '0 0 32px rgba(137, 180, 250, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--bg-primary)',
        }}>
          <Icon name="cpu" size={32} />
        </div>
        SHAM IDE
      </div>
      <div className="empty-state-title" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'var(--text-secondary)', marginBottom: 'clamp(16px, 3vw, 32px)', fontWeight: 500, letterSpacing: '0.5px' }}>
        Smart Hosted Agent Manager
      </div>
      <div className="empty-state-desc" style={{ marginBottom: 'clamp(24px, 5vw, 40px)', maxWidth: '500px', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
        Build, test, and deploy Autonomous Lifecycle Protocol (ALP) agents with a modern, fully-integrated development environment.
      </div>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius)', boxShadow: '0 4px 12px rgba(137, 180, 250, 0.3)' }}
          onClick={() => onOpenFile('untitled.alp')}
        >
          <Icon name="plus" size={18} /> New Agent
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '12px 24px', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius)' }}
          onClick={() => onOpenFile('project.alp')}
        >
          <Icon name="folderOpen" size={18} /> Open Project
        </button>
      </div>

      <div className="flex-wrap-gap" style={{ 
        marginTop: 'clamp(32px, 6vw, 64px)', 
        gap: 'clamp(16px, 4vw, 32px)', 
        fontSize: 'var(--font-size-sm)', 
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        backdropFilter: 'var(--blur)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="edit3" size={14} /> Monaco Editor</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="terminal" size={14} /> Integrated Terminal</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="cpu" size={14} /> MCP Browser</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="bot" size={14} /> Intelligence</span>
      </div>
    </div>
  );
}

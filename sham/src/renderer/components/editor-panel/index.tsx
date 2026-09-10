import React from 'react';
import type { SHAMState } from '../shared/types.js';
import { EditorView } from './EditorView.js';

interface EditorPanelProps {
  state: SHAMState;
  onValidate: (content: string, filePath: string) => Promise<unknown>;
  onCursorChange?: (position: { line: number; column: number }) => void;
}

export function EditorPanel({ state, onValidate, onCursorChange }: EditorPanelProps): React.JSX.Element {
  return (
    <div className="panel-container" style={{ background: 'var(--bg-primary)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(30, 30, 46, 0.6)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
          {state.activeFile || 'No file open'}
        </span>
        {state.diagnostics.length > 0 && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--bg-primary)', background: 'var(--accent-red)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
            {state.diagnostics.length} issue(s)
          </span>
        )}
      </div>
      <EditorView
        blockTypes={state.blockTypes ?? []}
        diagnostics={state.diagnostics}
        activeFile={state.activeFile}
        onValidate={onValidate}
        onCursorChange={onCursorChange}
      />
    </div>
  );
}

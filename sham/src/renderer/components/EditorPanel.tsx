import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { theme } from '../styles/theme.js';
import type { SHAMState } from '../shared/types.js';

interface EditorPanelProps {
  state: SHAMState;
  onValidate: (content: string, filePath: string) => Promise<unknown>;
}

export function EditorPanel({ state, onValidate }: EditorPanelProps): React.JSX.Element {
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current && state.activeFile) {
      editorRef.current.focus();
    }
  }, [state.activeFile]);

  const handleEditorChange = (value: string | undefined) => {
    if (value && state.activeFile) {
      const debounce = setTimeout(() => {
        onValidate(value, state.activeFile!);
      }, 500);
      return () => clearTimeout(debounce);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '4px 12px', background: theme.headerBackground, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: theme.textSecondary }}>{state.activeFile || 'No file open'}</span>
        {state.diagnostics.length > 0 && (
          <span style={{ fontSize: 11, color: theme.accentRed }}>{state.diagnostics.length} issue(s)</span>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          ref={editorRef}
          height="100%"
          language="alp"
          theme="vs-dark"
          value=""
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 8 },
            suggest: { showKeywords: true },
            quickSuggestions: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
      {state.diagnostics.length > 0 && (
        <div style={{ maxHeight: 120, overflowY: 'auto', background: theme.bgSecondary, borderTop: `1px solid ${theme.border}` }}>
          {state.diagnostics.map((diag, i) => (
            <div key={i} style={{ padding: '2px 12px', fontSize: 11, color: diag.severity === 'error' ? theme.accentRed : theme.accentYellow, fontFamily: 'monospace' }}>
              [{diag.severity}] Line {diag.line}:{diag.column} — {diag.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
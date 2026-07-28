import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { theme } from '../styles/theme.js';
import type { SHAMState } from '../shared/types.js';

const ALP_SNIPPETS: Record<string, string> = {
  agent: `@agent ${'{name}'}\n  description: ${'{description}'}\n  model: gpt-4o\n  tools: []\n`,
  skill: `@skill ${'{name}'}\n  description: ${'{description}'}\n  input: text\n  output: text\n`,
  macro: `@macro ${'{name}'}\n  input: ${'{input}'}\n  expand: ${'{expansion}'}\n`,
  event: `@event ${'{name}'}\n  type: pubsub\n  payload: ${'{json}'}\n`,
  memory: `@memory ${'{name}'}\n  backend: redis\n  ttl: 3600\n`,
  contract: `@contract ${'{name}'}\n  precondition: ${'{pre}'}\n  postcondition: ${'{post}'}\n`,
  vault: `@vault ${'{name}'}\n  encryption: aes256\n  rotation: daily\n`,
  swarm: `@swarm ${'{name}'}\n  maxAgents: 8\n  policy: balanced\n`,
  workflow: `@workflow ${'{name}'}\n  steps:\n    - id: step-1\n      agent: ${'{agentId}'}\n`,
};

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

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const monaco = (window as any).monaco;
    if (!monaco) return;

    const blockTypes = state.blockTypes ?? [];
    const keywordSuggestions = blockTypes.map((type) => ({
      label: `@${type}`,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: ALP_SNIPPETS[type] ?? `@${type}\n  ${'{name}'}: ${'{value}'}\n`,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: `Insert @${type} block`,
      range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
    }));

    const snippetSuggestions = Object.entries(ALP_SNIPPETS).map(([type, template]) => ({
      label: `@${type} template`,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: template,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: `Template for @${type}`,
      range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
    }));

    const disposable = monaco.languages.registerCompletionItemProvider('alp', {
      provideCompletionItems: () => {
        return { suggestions: [...keywordSuggestions, ...snippetSuggestions] };
      },
    });

    return () => disposable.dispose();
  }, [state.blockTypes]);

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
            suggest: { showKeywords: true, showSnippets: true },
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
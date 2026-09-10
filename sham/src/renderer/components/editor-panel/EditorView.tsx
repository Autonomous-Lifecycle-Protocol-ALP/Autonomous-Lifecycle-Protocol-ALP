import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { theme } from '../../styles/theme.js';
import { registerAlpLanguage, ALP_SNIPPETS } from './shared.js';

interface EditorViewProps {
  blockTypes: string[];
  diagnostics: { severity: string; line: number; column: number; message: string }[];
  activeFile: string | null;
  onValidate: (content: string, filePath: string) => Promise<unknown>;
  onCursorChange?: (position: { line: number; column: number }) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({ blockTypes, diagnostics, activeFile, onValidate, onCursorChange }) => {
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current && activeFile) {
      editorRef.current.focus();
    }
  }, [activeFile]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const monaco = (window as any).monaco;
    if (!monaco) return;

    registerAlpLanguage(monaco);

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

    const cursorListener = editor.onDidChangeCursorPosition((e: { position: { lineNumber: number; column: number } }) => {
      if (onCursorChange) {
        onCursorChange({ line: e.position.lineNumber, column: e.position.column });
      }
    });

    return () => {
      disposable.dispose();
      cursorListener.dispose();
    };
  }, [blockTypes, onCursorChange]);

  const handleEditorChange = (value: string | undefined) => {
    if (value && activeFile) {
      const debounce = setTimeout(() => {
        onValidate(value, activeFile);
      }, 500);
      return () => clearTimeout(debounce);
    }
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <Editor
        onMount={(editor) => { (editorRef as unknown as { current: unknown }).current = editor; }}
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
      {diagnostics.length > 0 && (
        <div style={{ maxHeight: 'clamp(100px, 20vh, 120px)', overflowY: 'auto', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}>
          {diagnostics.map((diag, i) => (
            <div key={i} style={{ padding: '2px 12px', fontSize: 'var(--font-size-xs)', color: diag.severity === 'error' ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
              [{diag.severity}] Line {diag.line}:{diag.column} — {diag.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

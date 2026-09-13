import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { registerAlpLanguage, ALP_SNIPPETS } from './shared.js';
import { highlightCode } from './syntaxHighlighter.js';
import { Icon } from '../Icon.js';

export const DEFAULT_FILE_CONTENTS: Record<string, string> = {
  'package.json': `{
  "name": "alp-workspace",
  "version": "1.0.0",
  "private": true,
  "description": "Smart Hosted Agent Manager - ALP Autonomous Workspace",
  "main": "src/index.ts",
  "scripts": {
    "start": "alp run src/agents/hello.alp",
    "test": "alp test",
    "validate": "alp validate ."
  },
  "dependencies": {
    "@autonomous-lifecycle-protocol-alp/sdk": "^80.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
`,
  'src/index.ts': `import { AgentRunner } from '@autonomous-lifecycle-protocol-alp/sdk';

async function main() {
  console.log('Initializing ALP Agent Runtime...');
  const runner = new AgentRunner({ workspace: '.' });
  await runner.start();
}

main().catch(console.error);
`,
  'src/agents/hello.alp': `@agent hello_agent
  description: "A friendly greeting agent"
  model: "claude-3-5-sonnet"
  instructions: "Respond warmly to greetings and introduce yourself."

@skill greet
  input: string
  output: string

@workflow main
  step greet
`,
  'src/agents/swarm.alp': `@agent swarm_coordinator
  description: "Coordinates multi-agent task distribution"
  model: "claude-3-5-sonnet"

@swarm mesh_network
  nodes: 5
  protocol: "bft-consensus"
`,
  'src/skills/utils.alp': `@skill format_data
  input: json
  output: json

@macro log_metric
  param: metric_name
  param: value
`,
  'docs/README.md': `# ALP Project Workspace

Welcome to your Autonomous Lifecycle Protocol (ALP) workspace in SHAM IDE.

## Getting Started
- Open \`.alp\` files in \`src/agents/\` to configure autonomous agents.
- Use the **Panels Drawer** (\`Ctrl+Shift+O\`) to inspect Swarms, CRDT Canvas, and Telemetry.
- Run \`Terminal\` (\`Ctrl+\`\`) for ALP CLI commands.
`,
  'project.alp': `@project my_alp_project
  version: "1.0.0"
  alp_version: "80.0.0"

@workspace default
  root: "src"
  entry: "src/agents/hello.alp"
`,
  'untitled.alp': `@agent new_agent
  description: "Autonomous agent template"
  model: "claude-3-5-sonnet"

@workflow main
  step start
`,
};

export function getLanguageForFile(filePath: string | null): string {
  if (!filePath) return 'plaintext';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
  if (filePath.endsWith('.md')) return 'markdown';
  if (filePath.endsWith('.alp')) return 'alp';
  if (filePath.endsWith('.html')) return 'html';
  if (filePath.endsWith('.css')) return 'css';
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
  return 'plaintext';
}

interface EditorViewProps {
  blockTypes: string[];
  diagnostics: { severity: string; line: number; column: number; message: string }[];
  activeFile: string | null;
  onValidate: (content: string, filePath: string) => Promise<unknown>;
  onCursorChange?: (position: { line: number; column: number }) => void;
}

interface FallbackEditorProps {
  value: string;
  language: string;
  activeFile: string | null;
  onChange: (value: string) => void;
  isFallback?: boolean;
  onRetryMonaco?: () => void;
  onCursorChange?: (position: { line: number; column: number }) => void;
}

function FallbackCodeEditor({
  value,
  language,
  activeFile,
  onChange,
  isFallback = false,
  onRetryMonaco,
  onCursorChange,
}: FallbackEditorProps): React.JSX.Element {
  const lineCount = useMemo(() => {
    return value ? value.split('\n').length : 1;
  }, [value]);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }, [lineCount]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const highlightedHtml = useMemo(() => {
    return highlightCode(value, language);
  }, [value, language]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
    if (preRef.current) {
      preRef.current.scrollTop = textarea.scrollTop;
      preRef.current.scrollLeft = textarea.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(nextValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        if (preRef.current) {
          preRef.current.scrollTop = textarea.scrollTop;
          preRef.current.scrollLeft = textarea.scrollLeft;
        }
      }, 0);
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (!onCursorChange) return;
    const textarea = e.currentTarget;
    const cursor = textarea.selectionStart;
    const lines = value.substring(0, cursor).split('\n');
    const line = lines.length;
    const column = (lines[lines.length - 1]?.length ?? 0) + 1;
    onCursorChange({ line, column });
  };

  return (
    <div className="fallback-editor-container">
      <div className="fallback-editor-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            textTransform: 'uppercase',
            fontWeight: 700,
            color: language === 'alp' ? 'var(--accent)' : '#f38ba8',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Icon name="code" size={13} />
            {language}
          </span>
          <span>•</span>
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{value.length} chars</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isFallback ? (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-green)', fontWeight: 500 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
                Syntax Highlight Engine
              </span>
              {onRetryMonaco && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={onRetryMonaco}
                >
                  Load Monaco
                </button>
              )}
            </>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-green)' }}>
              <Icon name="check" size={12} /> Ready
            </span>
          )}
        </div>
      </div>

      <div className="fallback-editor-body">
        <div ref={gutterRef} className="fallback-editor-gutter">
          {lineNumbers.map((num) => (
            <div key={num} style={{ height: '20px' }}>{num}</div>
          ))}
        </div>

        <div className="fallback-editor-code-wrapper">
          <pre
            ref={preRef}
            className="fallback-editor-pre"
            aria-hidden="true"
          >
            <code
              dangerouslySetInnerHTML={{
                __html: highlightedHtml + (value.endsWith('\n') ? ' ' : ''),
              }}
            />
          </pre>

          <textarea
            ref={textareaRef}
            className="fallback-editor-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onKeyUp={handleSelect}
            onClick={handleSelect}
            placeholder={activeFile ? `Empty file: ${activeFile}` : 'Open a file to start editing'}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

export const EditorView: React.FC<EditorViewProps> = ({
  blockTypes,
  diagnostics,
  activeFile,
  onValidate,
  onCursorChange,
}) => {
  const editorRef = useRef<any>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>(DEFAULT_FILE_CONTENTS);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [monacoFailed, setMonacoFailed] = useState(false);

  const currentContent = useMemo(() => {
    if (!activeFile) return '';
    return fileContents[activeFile] ?? DEFAULT_FILE_CONTENTS[activeFile] ?? '// New file\n';
  }, [activeFile, fileContents]);

  const language = useMemo(() => {
    return getLanguageForFile(activeFile);
  }, [activeFile]);

  // Attempt to load Monaco with timeout and catch failure
  useEffect(() => {
    let isMounted = true;
    if (typeof loader !== 'undefined' && typeof loader?.init === 'function') {
      loader.init()
        .then(() => {
          if (isMounted) {
            setMonacoLoaded(true);
          }
        })
        .catch((err) => {
          console.warn('Monaco CDN loader failed, using built-in editor:', err);
          if (isMounted) {
            setMonacoFailed(true);
          }
        });
    }

    const timeout = setTimeout(() => {
      if (isMounted && !monacoLoaded) {
        setMonacoFailed(true);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [monacoLoaded]);

  useEffect(() => {
    if (editorRef.current && activeFile) {
      editorRef.current.focus?.();
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
      insertText: ALP_SNIPPETS[type] ?? `@${type}\n  \${name}: \${value}\n`,
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

    const cursorListener = editor.onDidChangeCursorPosition?.((e: { position: { lineNumber: number; column: number } }) => {
      if (onCursorChange) {
        onCursorChange({ line: e.position.lineNumber, column: e.position.column });
      }
    });

    return () => {
      disposable?.dispose?.();
      cursorListener?.dispose?.();
    };
  }, [blockTypes, onCursorChange]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const updated = value ?? '';
    if (activeFile) {
      setFileContents((prev) => ({ ...prev, [activeFile]: updated }));
      const debounce = setTimeout(() => {
        onValidate(updated, activeFile);
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [activeFile, onValidate]);

  const retryMonaco = useCallback(() => {
    setMonacoFailed(false);
    if (typeof loader !== 'undefined' && typeof loader?.init === 'function') {
      loader.init()
        .then(() => setMonacoLoaded(true))
        .catch(() => setMonacoFailed(true));
    }
  }, []);

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {monacoFailed && !monacoLoaded ? (
        <FallbackCodeEditor
          value={currentContent}
          language={language}
          activeFile={activeFile}
          onChange={handleEditorChange}
          isFallback={true}
          onRetryMonaco={retryMonaco}
          onCursorChange={onCursorChange}
        />
      ) : (
        <Editor
          onMount={(editor) => {
            (editorRef as unknown as { current: unknown }).current = editor;
            setMonacoLoaded(true);
          }}
          height="100%"
          language={language}
          theme={language === 'alp' ? 'alp-dark' : 'vs-dark'}
          value={currentContent}
          onChange={handleEditorChange}
          loading={
            <FallbackCodeEditor
              value={currentContent}
              language={language}
              activeFile={activeFile}
              onChange={handleEditorChange}
              isFallback={false}
              onCursorChange={onCursorChange}
            />
          }
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
      )}
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

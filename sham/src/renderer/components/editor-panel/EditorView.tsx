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
  splitFile?: string | null;
  isDiffMode?: boolean;
  wordWrap?: boolean;
  onToggleSplit?: () => void;
  onToggleDiff?: () => void;
  onToggleWordWrap?: () => void;
  onRunAlp?: (filePath: string) => void;
  onCopyPath?: (filePath: string) => void;
  onFormatCode?: () => void;
  onMarkDirty?: (filePath: string) => void;
}

interface FallbackEditorProps {
  value: string;
  language: string;
  activeFile: string | null;
  onChange: (value: string) => void;
  isFallback?: boolean;
  onRetryMonaco?: () => void;
  onCursorChange?: (position: { line: number; column: number }) => void;
  wordWrap?: boolean;
}

function FallbackCodeEditor({
  value,
  language,
  activeFile,
  onChange,
  isFallback = false,
  onRetryMonaco,
  onCursorChange,
  wordWrap = false,
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

  const wrapStyle: React.CSSProperties = wordWrap ? { whiteSpace: 'pre-wrap', wordBreak: 'break-all' } : {};

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
            style={wrapStyle}
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
            style={wrapStyle}
            data-testid="mock-monaco"
          />
        </div>
      </div>
    </div>
  );
}

/* ---- Simple line-based diff utility ---- */
function computeDiff(oldLines: string[], newLines: string[]): { type: 'added' | 'removed' | 'unchanged'; line: string; num: number }[] {
  const result: { type: 'added' | 'removed' | 'unchanged'; line: string; num: number }[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === undefined && newLine !== undefined) {
      result.push({ type: 'added', line: newLine, num: i + 1 });
    } else if (newLine === undefined && oldLine !== undefined) {
      result.push({ type: 'removed', line: oldLine, num: i + 1 });
    } else if (oldLine !== newLine) {
      result.push({ type: 'removed', line: oldLine ?? '', num: i + 1 });
      result.push({ type: 'added', line: newLine ?? '', num: i + 1 });
    } else {
      result.push({ type: 'unchanged', line: oldLine ?? '', num: i + 1 });
    }
  }
  return result;
}

/* ---- Format code utility ---- */
function formatCodeContent(content: string, language: string): string {
  if (language === 'json') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }
  // For ALP: normalize indentation (2 spaces)
  if (language === 'alp') {
    return content
      .split('\n')
      .map((line) => {
        if (line.match(/^(\t|\s{3,})/)) {
          return '  ' + line.trimStart();
        }
        return line;
      })
      .join('\n');
  }
  return content;
}

export const EditorView: React.FC<EditorViewProps> = ({
  blockTypes,
  diagnostics,
  activeFile,
  onValidate,
  onCursorChange,
  splitFile = null,
  isDiffMode = false,
  wordWrap: wordWrapProp = false,
  onToggleSplit,
  onToggleDiff,
  onToggleWordWrap,
  onRunAlp,
  onCopyPath,
  onFormatCode: _onFormatCodeProp,
  onMarkDirty,
}) => {
  const editorRef = useRef<any>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>(DEFAULT_FILE_CONTENTS);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [monacoFailed, setMonacoFailed] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [localWordWrap, setLocalWordWrap] = useState(wordWrapProp);
  // Track original content for diff
  const [originalContents] = useState<Record<string, string>>(DEFAULT_FILE_CONTENTS);

  const wordWrap = wordWrapProp || localWordWrap;

  const currentContent = useMemo(() => {
    if (!activeFile) return '';
    return fileContents[activeFile] ?? DEFAULT_FILE_CONTENTS[activeFile] ?? '// New file\n';
  }, [activeFile, fileContents]);

  const splitContent = useMemo(() => {
    if (!splitFile) return '';
    return fileContents[splitFile] ?? DEFAULT_FILE_CONTENTS[splitFile] ?? '// New file\n';
  }, [splitFile, fileContents]);

  const language = useMemo(() => {
    return getLanguageForFile(activeFile);
  }, [activeFile]);

  const splitLanguage = useMemo(() => {
    return getLanguageForFile(splitFile ?? null);
  }, [splitFile]);

  // Line/col metrics
  const lineCount = useMemo(() => currentContent.split('\n').length, [currentContent]);
  const charCount = useMemo(() => currentContent.length, [currentContent]);

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
      setCursorPos({ line: e.position.lineNumber, column: e.position.column });
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
      onMarkDirty?.(activeFile);
      const debounce = setTimeout(() => {
        onValidate(updated, activeFile);
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [activeFile, onValidate, onMarkDirty]);

  const handleSplitEditorChange = useCallback((value: string | undefined) => {
    const updated = value ?? '';
    if (splitFile) {
      setFileContents((prev) => ({ ...prev, [splitFile]: updated }));
      onMarkDirty?.(splitFile);
    }
  }, [splitFile, onMarkDirty]);

  const handleCursorUpdate = useCallback((pos: { line: number; column: number }) => {
    setCursorPos(pos);
    onCursorChange?.(pos);
  }, [onCursorChange]);

  const retryMonaco = useCallback(() => {
    setMonacoFailed(false);
    if (typeof loader !== 'undefined' && typeof loader?.init === 'function') {
      loader.init()
        .then(() => setMonacoLoaded(true))
        .catch(() => setMonacoFailed(true));
    }
  }, []);

  const handleFormatCode = useCallback(() => {
    if (!activeFile) return;
    const formatted = formatCodeContent(currentContent, language);
    setFileContents((prev) => ({ ...prev, [activeFile]: formatted }));
  }, [activeFile, currentContent, language]);

  const handleCopyPath = useCallback(() => {
    if (!activeFile) return;
    onCopyPath?.(activeFile);
  }, [activeFile, onCopyPath]);

  const handleRunAlp = useCallback(() => {
    if (!activeFile) return;
    onRunAlp?.(activeFile);
  }, [activeFile, onRunAlp]);

  const handleValidateClick = useCallback(() => {
    if (!activeFile) return;
    onValidate(currentContent, activeFile);
  }, [activeFile, currentContent, onValidate]);

  // Diff computation
  const diffResult = useMemo(() => {
    if (!isDiffMode || !activeFile) return null;
    const origContent = originalContents[activeFile] ?? '';
    const origLines = origContent.split('\n');
    const newLines = currentContent.split('\n');
    return computeDiff(origLines, newLines);
  }, [isDiffMode, activeFile, currentContent, originalContents]);

  const diffStats = useMemo(() => {
    if (!diffResult) return { added: 0, removed: 0 };
    return {
      added: diffResult.filter((d) => d.type === 'added').length,
      removed: diffResult.filter((d) => d.type === 'removed').length,
    };
  }, [diffResult]);

  /* ---- Render an editor instance ---- */
  const renderEditor = (
    content: string,
    lang: string,
    file: string | null,
    onChange: (val: string | undefined) => void,
  ) => {
    if (monacoFailed && !monacoLoaded) {
      return (
        <FallbackCodeEditor
          value={content}
          language={lang}
          activeFile={file}
          onChange={onChange}
          isFallback={true}
          onRetryMonaco={retryMonaco}
          onCursorChange={handleCursorUpdate}
          wordWrap={wordWrap}
        />
      );
    }
    return (
      <Editor
        onMount={(editor) => {
          (editorRef as unknown as { current: unknown }).current = editor;
          setMonacoLoaded(true);
        }}
        height="100%"
        language={lang}
        theme={lang === 'alp' ? 'alp-dark' : 'vs-dark'}
        value={content}
        onChange={onChange}
        loading={
          <FallbackCodeEditor
            value={content}
            language={lang}
            activeFile={file}
            onChange={onChange}
            isFallback={false}
            onCursorChange={handleCursorUpdate}
            wordWrap={wordWrap}
          />
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: wordWrap ? 'on' : 'off',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 8 },
          suggest: { showKeywords: true, showSnippets: true },
          quickSuggestions: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    );
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ---- Editor Action Toolbar ---- */}
      <div className="editor-action-toolbar" data-testid="editor-action-toolbar">
        <div className="editor-action-toolbar-group">
          <button
            className="editor-action-btn run-btn"
            onClick={handleRunAlp}
            title="Run ALP (alp run <file>)"
            disabled={!activeFile}
            data-testid="toolbar-run-alp"
          >
            <Icon name="play" size={12} />
            Run ALP
          </button>
          <button
            className="editor-action-btn validate-btn"
            onClick={handleValidateClick}
            title="Validate / Lint"
            disabled={!activeFile}
            data-testid="toolbar-validate"
          >
            <Icon name="shield" size={12} />
            Validate
          </button>
        </div>

        <div className="editor-action-toolbar-separator" />

        <div className="editor-action-toolbar-group">
          <button
            className="editor-action-btn"
            onClick={handleFormatCode}
            title="Format Code"
            disabled={!activeFile}
            data-testid="toolbar-format"
          >
            <Icon name="code" size={12} />
            Format
          </button>
          <button
            className={`editor-action-btn ${wordWrap ? 'active' : ''}`}
            onClick={() => {
              setLocalWordWrap((prev) => !prev);
              onToggleWordWrap?.();
            }}
            title="Toggle Word Wrap"
            data-testid="toolbar-word-wrap"
          >
            <Icon name="wrapText" size={12} />
            Wrap
          </button>
        </div>

        <div className="editor-action-toolbar-separator" />

        <div className="editor-action-toolbar-group">
          <button
            className={`editor-action-btn ${splitFile !== null ? 'active' : ''}`}
            onClick={onToggleSplit}
            title="Split Editor (Ctrl+\)"
            data-testid="toolbar-split"
          >
            <Icon name="columns" size={12} />
            Split
          </button>
          <button
            className={`editor-action-btn ${isDiffMode ? 'active' : ''}`}
            onClick={onToggleDiff}
            title="Diff View (Ctrl+Alt+D)"
            data-testid="toolbar-diff"
          >
            <Icon name="gitCompare" size={12} />
            Diff
          </button>
          <button
            className="editor-action-btn"
            onClick={handleCopyPath}
            title="Copy File Path"
            disabled={!activeFile}
            data-testid="toolbar-copy-path"
          >
            <Icon name="copy" size={12} />
            Path
          </button>
        </div>

        <div className="editor-metrics-pill" data-testid="editor-metrics">
          <span>Ln {cursorPos.line}</span>
          <span>Col {cursorPos.column}</span>
          <span>{lineCount} lines</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* ---- Diff Mode ---- */}
      {isDiffMode && diffResult ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="diff-header-bar">
            <Icon name="gitCompare" size={14} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Diff: {activeFile ?? 'unknown'} (original → current)
            </span>
            <span className="diff-stat-badge added">+{diffStats.added}</span>
            <span className="diff-stat-badge removed">-{diffStats.removed}</span>
          </div>
          <div className="diff-view-container" data-testid="diff-view-container">
            <div className="diff-pane" data-testid="diff-pane-original">
              <div className="diff-pane-header">
                <Icon name="file" size={12} />
                Original
              </div>
              {diffResult
                .filter((d) => d.type !== 'added')
                .map((d, i) => (
                  <div key={i} className={`diff-line diff-line-${d.type}`}>
                    <span className="diff-line-num">{d.num}</span>
                    <span className="diff-line-content">{d.line}</span>
                  </div>
                ))}
            </div>
            <div className="diff-pane" data-testid="diff-pane-modified">
              <div className="diff-pane-header">
                <Icon name="edit" size={12} />
                Modified
              </div>
              {diffResult
                .filter((d) => d.type !== 'removed')
                .map((d, i) => (
                  <div key={i} className={`diff-line diff-line-${d.type}`}>
                    <span className="diff-line-num">{d.num}</span>
                    <span className="diff-line-content">{d.line}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : splitFile ? (
        /* ---- Split Editor Mode ---- */
        <div className="editor-split-container" data-testid="editor-split-container">
          <div className="editor-pane" data-testid="editor-pane-primary">
            <div className="editor-pane-label">
              <span className="pane-badge">1</span>
              {activeFile ?? 'No file'}
            </div>
            {renderEditor(currentContent, language, activeFile, handleEditorChange)}
          </div>
          <div className="split-resize-handle" />
          <div className="editor-pane" data-testid="editor-pane-secondary">
            <div className="editor-pane-label">
              <span className="pane-badge">2</span>
              {splitFile}
            </div>
            {renderEditor(splitContent, splitLanguage, splitFile, handleSplitEditorChange)}
          </div>
        </div>
      ) : (
        /* ---- Single Editor ---- */
        renderEditor(currentContent, language, activeFile, handleEditorChange)
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

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { EditorPanel } from '../src/renderer/components/EditorPanel';
import type { SHAMState } from '../src/renderer/shared/types';

const baseState: SHAMState = {
  activeFile: 'src/index.ts',
  openFiles: ['src/index.ts'],
  selectedAgent: null,
  terminalOutput: [],
  diagnostics: [],
  blockTypes: [],
  agents: [],
  mcpTools: [],
  parseResult: null,
  collab: { session: null, output: [], presence: [] },
  plugins: { plugins: [], output: [] },
  profiler: { traces: [], output: [] },
  copilot: { suggestions: [], output: [] },
  refactor: { renames: [], output: [] },
  debug: { session: null, output: [] },
  testRunner: { suites: [], output: [] },
  intelligence: { suggestions: [], output: [] },
  autonomy: { decisions: [], output: [] },
};

afterEach(() => {
  cleanup();
});

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, options }: any) => (
    <textarea
      data-testid="mock-monaco"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      data-options={JSON.stringify(options)}
    />
  ),
  loader: {
    init: () => Promise.resolve({}),
    config: () => {},
  },
}));


describe('EditorPanel', () => {
  it('renders the active file name in the header', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} />);
    expect(screen.getByText('src/index.ts')).toBeDefined();
  });

  it('renders the Monaco editor mock', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} />);
    expect(screen.getByTestId('mock-monaco')).toBeDefined();
  });

  it('shows diagnostics count when diagnostics exist', () => {
    const stateWithDiagnostics: SHAMState = {
      ...baseState,
      diagnostics: [
        { line: 1, column: 1, message: 'Test error', severity: 'error' },
        { line: 2, column: 1, message: 'Test warning', severity: 'warning' },
      ],
    };
    render(<EditorPanel state={stateWithDiagnostics} onValidate={vi.fn()} />);
    expect(screen.getByText('2 issue(s)')).toBeDefined();
  });

  it('shows diagnostic details in the footer', () => {
    const stateWithDiagnostics: SHAMState = {
      ...baseState,
      diagnostics: [
        { line: 1, column: 1, message: 'Missing agent name', severity: 'error' },
      ],
    };
    render(<EditorPanel state={stateWithDiagnostics} onValidate={vi.fn()} />);
    expect(screen.getByText('[error] Line 1:1 — Missing agent name')).toBeDefined();
  });

  it('renders No file open when no active file', () => {
    const stateNoFile: SHAMState = { ...baseState, activeFile: null };
    render(<EditorPanel state={stateNoFile} onValidate={vi.fn()} />);
    expect(screen.getByText('No file open')).toBeDefined();
  });
});

describe('EditorPanel - Editor Action Toolbar', () => {
  it('renders the editor action toolbar', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} />);
    expect(screen.getByTestId('editor-action-toolbar')).toBeDefined();
  });

  it('renders Run ALP toolbar button', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} onRunAlp={vi.fn()} />);
    expect(screen.getByTestId('toolbar-run-alp')).toBeDefined();
  });

  it('renders Validate toolbar button', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} />);
    expect(screen.getByTestId('toolbar-validate')).toBeDefined();
  });

  it('renders Format toolbar button', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} onFormatCode={vi.fn()} />);
    expect(screen.getByTestId('toolbar-format')).toBeDefined();
  });

  it('renders Word Wrap toggle button', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} wordWrap={false} onToggleWordWrap={vi.fn()} />);
    expect(screen.getByTestId('toolbar-word-wrap')).toBeDefined();
  });

  it('renders Split toggle button', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} onToggleSplit={vi.fn()} />);
    expect(screen.getByTestId('toolbar-split')).toBeDefined();
  });

  it('renders Diff toggle button', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} onToggleDiff={vi.fn()} />);
    expect(screen.getByTestId('toolbar-diff')).toBeDefined();
  });

  it('renders Copy Path button', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} onCopyPath={vi.fn()} />);
    expect(screen.getByTestId('toolbar-copy-path')).toBeDefined();
  });

  it('renders editor metrics pill', () => {
    render(<EditorPanel state={baseState} onValidate={vi.fn()} />);
    expect(screen.getByTestId('editor-metrics')).toBeDefined();
  });
});

describe('EditorPanel - Split Editor', () => {
  it('renders split editor container when splitFile is provided', () => {
    render(
      <EditorPanel
        state={baseState}
        onValidate={vi.fn()}
        splitFile="src/agents/hello.alp"
        onToggleSplit={vi.fn()}
      />
    );
    expect(screen.getByTestId('editor-split-container')).toBeDefined();
    expect(screen.getByTestId('editor-pane-primary')).toBeDefined();
    expect(screen.getByTestId('editor-pane-secondary')).toBeDefined();
  });

  it('shows split pane labels with file names', () => {
    render(
      <EditorPanel
        state={baseState}
        onValidate={vi.fn()}
        splitFile="src/agents/hello.alp"
      />
    );
    const splitContainer = screen.getByTestId('editor-split-container');
    expect(within(splitContainer).getByText('src/index.ts')).toBeDefined();
    expect(within(splitContainer).getByText('src/agents/hello.alp')).toBeDefined();
  });
});

describe('EditorPanel - Diff View', () => {
  it('renders diff view container when isDiffMode is true', () => {
    render(
      <EditorPanel
        state={baseState}
        onValidate={vi.fn()}
        isDiffMode={true}
        onToggleDiff={vi.fn()}
      />
    );
    expect(screen.getByTestId('diff-view-container')).toBeDefined();
  });

  it('shows diff panes for original and modified', () => {
    render(
      <EditorPanel
        state={baseState}
        onValidate={vi.fn()}
        isDiffMode={true}
      />
    );
    expect(screen.getByTestId('diff-pane-original')).toBeDefined();
    expect(screen.getByTestId('diff-pane-modified')).toBeDefined();
  });
});

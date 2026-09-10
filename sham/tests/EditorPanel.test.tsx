import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SecondarySidebar } from '../src/renderer/components/SecondarySidebar';
import type { SHAMState } from '../src/renderer/shared/types';

const baseState: SHAMState = {
  activeFile: 'src/index.ts',
  openFiles: ['src/index.ts', 'src/agents/hello.alp'],
  selectedAgent: null,
  terminalOutput: [],
  diagnostics: [
    { severity: 'error', message: 'Syntax error on line 42', line: 42, file: 'src/index.ts' },
  ],
  blockTypes: [],
  agents: [
    {
      id: 'agent-alpha',
      name: 'Agent Alpha',
      role: 'Analyst',
      status: 'idle',
      capabilities: ['parse', 'validate'],
      memory: ['mem-1'],
      lastRun: null,
      errorCount: 0,
    },
  ],
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

describe('SecondarySidebar', () => {
  it('renders header, title, and default Copilot tab', () => {
    render(
      <SecondarySidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('SECONDARY SIDEBAR')).toBeDefined();
    expect(screen.getByRole('tab', { name: /Copilot/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Inspector/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Agents/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Notes/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Saved/i })).toBeDefined();
    expect(screen.getByText('Explain Code')).toBeDefined();
  });

  it('calls onClose when hide button is clicked', () => {
    const onClose = vi.fn();
    render(
      <SecondarySidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByTitle('Hide Secondary Sidebar (Ctrl+Alt+B)');
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends a prompt when a prompt chip is clicked', () => {
    render(
      <SecondarySidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const testChip = screen.getByText('Generate Test');
    fireEvent.click(testChip);

    // Should create assistant reply with generated test
    expect(screen.getByText(/Generated test suite/i)).toBeDefined();
  });

  it('switches to Inspector tab and shows file metrics and diagnostics', () => {
    render(
      <SecondarySidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const inspectorTab = screen.getByRole('tab', { name: /Inspector/i });
    fireEvent.click(inspectorTab);

    expect(screen.getByText('Active File Metrics')).toBeDefined();
    expect(screen.getByText('src/index.ts')).toBeDefined();
    expect(screen.getByText('Syntax error on line 42')).toBeDefined();
    expect(screen.getByText('Line 42')).toBeDefined();
  });

  it('switches to Agents tab and allows running an agent', () => {
    const onRunAgent = vi.fn();
    render(
      <SecondarySidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onRunAgent={onRunAgent}
        onClose={vi.fn()}
      />
    );

    const agentsTab = screen.getByRole('tab', { name: /Agents/i });
    fireEvent.click(agentsTab);

    expect(screen.getByText('Agent Alpha')).toBeDefined();
    expect(screen.getByText('Analyst')).toBeDefined();

    const triggerBtn = screen.getByText('Trigger Agent');
    fireEvent.click(triggerBtn);
    expect(onRunAgent).toHaveBeenCalledWith('agent-alpha');
  });

  it('switches to Notes tab and allows typing in scratchpad', () => {
    render(
      <SecondarySidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const notesTab = screen.getByRole('tab', { name: /Notes/i });
    fireEvent.click(notesTab);

    const textarea = screen.getByPlaceholderText(/Type temporary notes/i);
    expect(textarea).toBeDefined();

    fireEvent.change(textarea, { target: { value: 'Important notes for deployment' } });
    expect((textarea as HTMLTextAreaElement).value).toBe('Important notes for deployment');
    expect(screen.getByText(/chars/i)).toBeDefined();
  });

  it('switches to Saved/Bookmarks tab and opens a bookmarked file', () => {
    const onOpenFile = vi.fn();
    render(
      <SecondarySidebar
        state={baseState}
        onOpenFile={onOpenFile}
        onClose={vi.fn()}
      />
    );

    const bookmarksTab = screen.getByRole('tab', { name: /Saved/i });
    fireEvent.click(bookmarksTab);

    expect(screen.getByText('src/agents/hello.alp')).toBeDefined();
    fireEvent.click(screen.getByText('src/agents/hello.alp'));
    expect(onOpenFile).toHaveBeenCalledWith('src/agents/hello.alp');
  });

  it('toggles maximize width on secondary sidebar', () => {
    render(
      <SecondarySidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const maximizeBtn = screen.getByTitle('Maximize Width');
    fireEvent.click(maximizeBtn);

    const aside = screen.getByLabelText('Secondary Sidebar');
    expect(aside.className).toContain('maximized');

    const restoreBtn = screen.getByTitle('Restore Width');
    fireEvent.click(restoreBtn);
    expect(aside.className).not.toContain('maximized');
  });
});

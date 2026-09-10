import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Sidebar } from '../src/renderer/components/Sidebar';
import type { SHAMState } from '../src/renderer/shared/types';

const baseState: SHAMState = {
  activeFile: 'src/index.ts',
  openFiles: ['src/index.ts', 'src/agents/hello.alp'],
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

describe('Sidebar', () => {
  it('renders Explorer section with open files', () => {
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
      />
    );
    expect(screen.getByText('Explorer')).toBeDefined();
    expect(screen.getAllByText('src/index.ts').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onOpenFile when a workspace file is clicked', () => {
    const onOpenFile = vi.fn();
    render(
      <Sidebar
        state={baseState}
        onOpenFile={onOpenFile}
        onCloseFile={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
      />
    );
    const readmeItems = screen.getAllByText('README.md');
    readmeItems[0].click();
    expect(onOpenFile).toHaveBeenCalledWith('docs/README.md');
  });

  it('calls onCloseFile when the close button is clicked', () => {
    const onCloseFile = vi.fn();
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={onCloseFile}
        activePanel="editor"
        setActivePanel={vi.fn()}
      />
    );
    const fileItems = screen.getAllByText('src/index.ts');
    const closeBtn = fileItems[0].closest('.sidebar-item')?.querySelector('.sidebar-item-close');
    expect(closeBtn).toBeDefined();
    closeBtn!.click();
    expect(onCloseFile).toHaveBeenCalledWith('src/index.ts');
  });

  it('toggles folder expansion in the workspace tree', () => {
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
      />
    );
    expect(screen.getByText('agents')).toBeDefined();
    expect(screen.getByText('hello.alp')).toBeDefined();
  });

  it('calls setActivePanel when a footer panel button is clicked', () => {
    const setActivePanel = vi.fn();
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        activePanel="editor"
        setActivePanel={setActivePanel}
      />
    );
    const terminalButtons = screen.getAllByText('Terminal');
    terminalButtons[terminalButtons.length - 1].click();
    expect(setActivePanel).toHaveBeenCalledWith('terminal');
  });

  it('highlights the active panel in the footer', () => {
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        activePanel="agents"
        setActivePanel={vi.fn()}
      />
    );
    const agentsButtons = screen.getAllByText('Agents');
    const footerAgents = agentsButtons[agentsButtons.length - 1];
    expect(footerAgents.className).toContain('active');
  });
});

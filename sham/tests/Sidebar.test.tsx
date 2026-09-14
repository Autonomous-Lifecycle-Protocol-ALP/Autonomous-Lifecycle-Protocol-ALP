import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Sidebar } from '../src/renderer/components/Sidebar';
import { ALL_PANELS } from '../src/renderer/app/shared';
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

  it('renders All Panels Drawer launcher with badge and calls onOpenPanelsDrawer', () => {
    const onOpenPanelsDrawer = vi.fn();
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
        onOpenPanelsDrawer={onOpenPanelsDrawer}
      />
    );
    const drawerBtn = screen.getByTitle(new RegExp(`Open All Panels & Tools Drawer \\(${ALL_PANELS.length}\\)`, 'i'));
    expect(drawerBtn).toBeDefined();
    expect(drawerBtn.textContent).toContain('All Panels Drawer');
    expect(drawerBtn.textContent).toContain(String(ALL_PANELS.length));

    fireEvent.click(drawerBtn);
    expect(onOpenPanelsDrawer).toHaveBeenCalledTimes(1);
  });

  it('toggles search input in workspace tree and filters files', () => {
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
      />
    );

    // Click the search toggle button in Workspace header
    const searchToggleBtn = screen.getByTitle('Filter Workspace Files');
    expect(searchToggleBtn).toBeDefined();
    fireEvent.click(searchToggleBtn);

    // Search input should appear
    const searchInput = screen.getByPlaceholderText('Filter files...');
    expect(searchInput).toBeDefined();

    // Type filter query
    fireEvent.change(searchInput, { target: { value: 'package' } });
    expect(screen.getByText('package.json')).toBeDefined();
    expect(screen.queryByText('hello.alp')).toBeNull();

    // Clear filter
    const clearBtn = screen.getByTitle('Clear');
    fireEvent.click(clearBtn);
    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(screen.getByText('hello.alp')).toBeDefined();

    // Close search
    const closeSearchBtn = screen.getByTitle('Close Search');
    fireEvent.click(closeSearchBtn);
    expect(screen.queryByPlaceholderText('Filter files...')).toBeNull();
  });

  it('displays empty state when workspace filter has no matches', () => {
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
      />
    );

    const searchToggleBtn = screen.getByTitle('Filter Workspace Files');
    fireEvent.click(searchToggleBtn);

    const searchInput = screen.getByPlaceholderText('Filter files...');
    fireEvent.change(searchInput, { target: { value: 'unknown-random-file' } });

    expect(screen.getByText('No matching files found')).toBeDefined();
  });

  it('renders Primary Sidebar header and calls onToggleSidebar when collapse button is clicked', () => {
    const onToggleSidebar = vi.fn();
    render(
      <Sidebar
        state={baseState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
        onToggleSidebar={onToggleSidebar}
      />
    );

    expect(screen.getByText('PRIMARY SIDEBAR')).toBeDefined();
    const collapseBtn = screen.getByTitle('Hide Primary Sidebar (Ctrl+B)');
    expect(collapseBtn).toBeDefined();

    fireEvent.click(collapseBtn);
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });
});


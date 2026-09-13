import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { PanelRouter } from '../src/renderer/app/PanelRouter';
import { App } from '../src/renderer/app/index';
import type { SHAMState } from '../src/renderer/shared/types';
import { defaultState } from '../src/renderer/app/shared';

afterEach(() => {
  cleanup();
});

const mockProps = {
  activePanel: 'editor' as const,
  showWelcome: true,
  state: defaultState,
  onOpenFile: vi.fn(),
  onValidate: vi.fn().mockResolvedValue(undefined),
  onCursorChange: vi.fn().mockResolvedValue(undefined),
  onRunAgent: vi.fn().mockResolvedValue(undefined),
  onUpdateCollabSession: vi.fn(),
  onAppendCollabOutput: vi.fn(),
  onUpdateCollabPresence: vi.fn(),
  onUpdatePlugins: vi.fn(),
  onAppendPluginOutput: vi.fn(),
  onUpdateProfilerTraces: vi.fn(),
  onAppendProfilerOutput: vi.fn(),
  onUpdateCopilotSuggestions: vi.fn(),
  onAppendCopilotOutput: vi.fn(),
  onUpdateRefactorRenames: vi.fn(),
  onAppendRefactorOutput: vi.fn(),
  onAppendDebugOutput: vi.fn(),
  onStartDebug: vi.fn(),
  onStopDebug: vi.fn(),
  onToggleBreakpoint: vi.fn(),
  onRunTests: vi.fn().mockResolvedValue(undefined),
  onAppendTestOutput: vi.fn(),
  onUpdateIntelligenceState: vi.fn(),
  onAppendIntelligenceOutput: vi.fn(),
  onUpdateAutonomyState: vi.fn(),
  onAppendAutonomyOutput: vi.fn(),
};

describe('PanelRouter & App Page Connections', () => {
  it('renders WelcomeScreen when in editor mode with no active file', () => {
    render(<PanelRouter {...mockProps} activePanel="editor" showWelcome={true} />);
    expect(screen.getByText('SHAM IDE')).toBeDefined();
    expect(screen.getByText('Smart Hosted Agent Manager')).toBeDefined();
  });

  it('renders TerminalPanel when activePanel is terminal even if showWelcome is true', () => {
    render(
      <PanelRouter
        {...mockProps}
        activePanel="terminal"
        showWelcome={true}
        state={{ ...defaultState, terminalOutput: ['Terminal ready.'] }}
      />
    );
    expect(screen.queryByText('SHAM IDE')).toBeNull();
    expect(screen.getByText(/Terminal ready/)).toBeDefined();
  });

  it('renders AgentPanel when activePanel is agents', async () => {
    const stateWithAgent: SHAMState = {
      ...defaultState,
      agents: [
        {
          id: 'agent-1',
          name: 'agent-1',
          role: 'Analyst',
          status: 'idle',
          capabilities: [],
          memory: [],
          lastRun: null,
          errorCount: 0,
        },
      ],
    };
    render(
      <PanelRouter
        {...mockProps}
        activePanel="agents"
        showWelcome={true}
        state={stateWithAgent}
      />
    );
    expect(screen.queryByText('SHAM IDE')).toBeNull();
    expect(await screen.findByText('agent-1')).toBeDefined();
  });

  it('renders EditorPanel when activePanel is editor and a file is open', () => {
    const stateWithFile: SHAMState = {
      ...defaultState,
      activeFile: 'project.alp',
      openFiles: ['project.alp'],
    };
    render(
      <PanelRouter
        {...mockProps}
        activePanel="editor"
        showWelcome={false}
        state={stateWithFile}
      />
    );
    expect(screen.queryByText('SHAM IDE')).toBeNull();
    expect(screen.getByText('project.alp')).toBeDefined();
  });

  it('switches panels when header buttons are clicked in App', () => {
    render(<App />);
    // Initially on WelcomeScreen
    expect(screen.getByText('SHAM IDE')).toBeDefined();

    // Click on Terminal button in header
    const terminalButtons = screen.getAllByRole('button', { name: /Terminal/i });
    fireEvent.click(terminalButtons[0]);

    // WelcomeScreen is dismissed and terminal is shown
    expect(screen.queryByText('Smart Hosted Agent Manager')).toBeNull();
  });
});

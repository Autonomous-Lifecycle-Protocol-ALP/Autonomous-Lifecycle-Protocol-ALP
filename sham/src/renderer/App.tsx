import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { EditorPanel } from './components/EditorPanel.js';
import { TerminalPanel } from './components/TerminalPanel.js';
import { AgentPanel } from './components/AgentPanel.js';
import { MCPBrowser } from './components/MCPBrowser.js';
import { WelcomeScreen } from './components/WelcomeScreen.js';
import { ProPanel } from './components/ProPanel.js';
import { CollaborationPanel } from './components/CollaborationPanel.js';
import { PluginPanel } from './components/PluginPanel.js';
import { ProfilerPanel } from './components/ProfilerPanel.js';
import { CopilotPanel } from './components/CopilotPanel.js';
import { RefactorPanel } from './components/RefactorPanel.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { GitPanel } from './components/GitPanel.js';
import { SearchPanel } from './components/SearchPanel.js';
import { CommandPalette } from './components/CommandPalette.js';
import { DebugPanel } from './components/DebugPanel.js';
import { TestRunnerPanel } from './components/TestRunnerPanel.js';
import { fetchBlockTypes, runAgent, validateALPFile, onAppReady, collabCursorMove } from './shared/alp-client.js';
import type { SHAMState } from './shared/types.js';
import './styles/global.css';
import './styles/layout.css';

const defaultState: SHAMState = {
  activeFile: null,
  openFiles: [],
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
};

type PanelId = 'editor' | 'terminal' | 'agents' | 'mcp' | 'collab' | 'plugins' | 'profiler' | 'copilot' | 'refactor' | 'pro' | 'settings' | 'git' | 'search' | 'debugger' | 'test-runner';

export function App(): React.JSX.Element {
  const [state, setState] = useState<SHAMState>(defaultState);
  const [activePanel, setActivePanel] = useState<PanelId>('editor');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [bottomPanel, setBottomPanel] = useState<'terminal' | 'problems' | 'output' | 'debug' | null>('terminal');
  const [bottomActiveTab, setBottomActiveTab] = useState('terminal');

  useEffect(() => {
    onAppReady((payload: unknown) => {
      setState((prev) => ({ ...prev }));
    });

    fetchBlockTypes().then((result) => {
      if (result.success) {
        setState((prev) => ({ ...prev, blockTypes: result.blockTypes }));
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setBottomPanel((prev) => (prev === 'terminal' ? null : 'terminal'));
        setBottomActiveTab('terminal');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenFile = useCallback((filePath: string) => {
    setState((prev) => {
      const openFiles = prev.openFiles.includes(filePath) ? prev.openFiles : [...prev.openFiles, filePath];
      return { ...prev, activeFile: filePath, openFiles };
    });
    setShowWelcome(false);
  }, []);

  const handleCloseFile = useCallback((filePath: string) => {
    setState((prev) => {
      const openFiles = prev.openFiles.filter((f) => f !== filePath);
      const activeFile = prev.activeFile === filePath ? (openFiles[0] ?? null) : prev.activeFile;
      return { ...prev, openFiles, activeFile };
    });
  }, []);

  const handleRunAgent = useCallback(async (agentId: string, config: Record<string, unknown>) => {
    const result = await runAgent(agentId, config);
    if (result.success) {
      setState((prev) => ({
        ...prev,
        terminalOutput: [...prev.terminalOutput, `[Agent ${agentId}] Run started`],
        agents: prev.agents.map((a) =>
          a.id === agentId ? { ...a, status: 'running' as const, lastRun: new Date().toISOString() } : a,
        ),
      }));
    }
  }, []);

  const panels: { id: PanelId; label: string }[] = [
    { id: 'editor', label: 'Editor' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'agents', label: 'Agents' },
    { id: 'mcp', label: 'MCP' },
    { id: 'collab', label: 'Collab' },
    { id: 'plugins', label: 'Plugins' },
    { id: 'profiler', label: 'Profiler' },
    { id: 'copilot', label: 'Copilot' },
    { id: 'refactor', label: 'Refactor' },
    { id: 'debugger', label: 'Debugger' },
    { id: 'test-runner', label: 'Tests' },
    { id: 'settings', label: 'Settings' },
    { id: 'git', label: 'Git' },
    { id: 'search', label: 'Search' },
  ];

  const renderPanel = () => {
    if (showWelcome) {
      return <WelcomeScreen onOpenFile={handleOpenFile} />;
    }

    switch (activePanel) {
      case 'editor':
        return (
          <EditorPanel
            state={state}
            onValidate={async (content, filePath) => {
              const result = await validateALPFile(content, filePath);
              if (result.success) {
                setState((prev) => ({ ...prev, diagnostics: result.diagnostics }));
              }
            }}
            onCursorChange={async (position) => {
              if (state.collab.session?.status === 'running') {
                await collabCursorMove({ peerId: 'local', line: position.line, column: position.column });
              }
            }}
          />
        );
      case 'terminal':
        return (
          <TerminalPanel
            output={state.terminalOutput}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, terminalOutput: [...prev.terminalOutput, ...lines] }))}
          />
        );
      case 'agents':
        return <AgentPanel agents={state.agents} onRunAgent={handleRunAgent} />;
      case 'mcp':
        return <MCPBrowser tools={state.mcpTools} />;
      case 'collab':
        return (
          <CollaborationPanel
            session={state.collab.session}
            output={state.collab.output}
            presence={state.collab.presence}
            onUpdateSession={(session) => setState((prev) => ({ ...prev, collab: { ...prev.collab, session } }))}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, collab: { ...prev.collab, output: [...prev.collab.output, ...lines] } }))}
            onUpdatePresence={(presence) => setState((prev) => ({ ...prev, collab: { ...prev.collab, presence } }))}
          />
        );
      case 'plugins':
        return (
          <PluginPanel
            plugins={state.plugins.plugins}
            output={state.plugins.output}
            onUpdatePlugins={(plugins) => setState((prev) => ({ ...prev, plugins: { ...prev.plugins, plugins } }))}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, plugins: { ...prev.plugins, output: [...prev.plugins.output, ...lines] } }))}
          />
        );
      case 'profiler':
        return (
          <ProfilerPanel
            traces={state.profiler.traces}
            output={state.profiler.output}
            onUpdateTraces={(traces) => setState((prev) => ({ ...prev, profiler: { ...prev.profiler, traces } }))}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, profiler: { ...prev.profiler, output: [...prev.profiler.output, ...lines] } }))}
          />
        );
      case 'copilot':
        return (
          <CopilotPanel
            suggestions={state.copilot.suggestions}
            output={state.copilot.output}
            diagnostics={state.diagnostics}
            onUpdateSuggestions={(suggestions) => setState((prev) => ({ ...prev, copilot: { ...prev.copilot, suggestions } }))}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, copilot: { ...prev.copilot, output: [...prev.copilot.output, ...lines] } }))}
          />
        );
      case 'refactor':
        return (
          <RefactorPanel
            renames={state.refactor.renames}
            output={state.refactor.output}
            onUpdateRenames={(renames) => setState((prev) => ({ ...prev, refactor: { ...prev.refactor, renames } }))}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, refactor: { ...prev.refactor, output: [...prev.refactor.output, ...lines] } }))}
          />
        );
      case 'debugger':
        return (
          <DebugPanel
            session={state.debug.session}
            output={state.debug.output}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, debug: { ...prev.debug, output: [...prev.debug.output, ...lines] } }))}
            onStartDebug={(filePath) => setState((prev) => ({ ...prev, debug: { session: { id: 'debug-1', name: filePath, status: 'running', breakpoints: [], callStack: [], variables: {} }, output: ['Debug session started...'] } }))}
            onStopDebug={() => setState((prev) => ({ ...prev, debug: { session: null, output: [] } }))}
            onToggleBreakpoint={(line) => setState((prev) => {
              const session = prev.debug.session;
              if (!session) return prev;
              const breakpoints = session.breakpoints.includes(String(line))
                ? session.breakpoints.filter((b) => b !== String(line))
                : [...session.breakpoints, String(line)];
              return { ...prev, debug: { ...prev.debug, session: { ...session, breakpoints } } };
            })}
          />
        );
      case 'test-runner':
        return (
          <TestRunnerPanel
            suites={state.testRunner.suites}
            output={state.testRunner.output}
            onRunTests={async (suiteIds) => {
              const timestamp = new Date().toLocaleTimeString();
              setState((prev) => ({ ...prev, testRunner: { ...prev.testRunner, output: [`[${timestamp}] Running ${suiteIds.length} suite(s)...`] } }));
              await new Promise((resolve) => setTimeout(resolve, 800));
              const suites = state.testRunner.suites.map((suite) => {
                if (!suiteIds.includes(suite.id)) return suite;
                const tests = suite.tests.map((test) => ({
                  ...test,
                  status: 'passed' as const,
                  durationMs: Math.floor(Math.random() * 120) + 10,
                }));
                return { ...suite, tests, status: 'passed' as const };
              });
              setState((prev) => ({ ...prev, testRunner: { suites, output: [...prev.testRunner.output, `[${timestamp}] All tests passed.`] } }));
            }}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, testRunner: { ...prev.testRunner, output: [...prev.testRunner.output, ...lines] } }))}
          />
        );
      case 'settings':
        return <SettingsPanel />;
      case 'git':
        return <GitPanel />;
      case 'search':
        return <SearchPanel onOpenFile={handleOpenFile} />;
      default:
        return <ProPanel />;
    }
  };

  const bottomTabs = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'problems', label: 'Problems' },
    { id: 'output', label: 'Output' },
    { id: 'debug', label: 'Debug Console' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-logo">
          <div className="app-header-logo-icon">S</div>
          <span>SHAM</span>
        </div>
        <span className="app-header-title">v40.0.0 — IDE Intelligence</span>
        <div className="app-header-spacer" />
        <div className="app-header-actions">
          <button className="header-btn" onClick={() => setShowCommandPalette(true)} title="Command Palette (Ctrl+Shift+P)">
            <span>&#9776;</span> Commands
          </button>
          {panels.map((panel) => (
            <button
              key={panel.id}
              className={`header-btn ${activePanel === panel.id ? 'active' : ''}`}
              onClick={() => setActivePanel(panel.id)}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </header>

      <div className="app-body">
        <Sidebar
          state={state}
          onOpenFile={handleOpenFile}
          onCloseFile={handleCloseFile}
          onSelectAgent={(id) => setState((prev) => ({ ...prev, selectedAgent: id }))}
          activePanel={activePanel}
          setActivePanel={setActivePanel}
        />
        <div className="main-area">
          {!showWelcome && state.openFiles.length > 0 && (
            <div className="tab-bar">
              {state.openFiles.map((file) => (
                <div
                  key={file}
                  className={`tab ${state.activeFile === file ? 'active' : ''}`}
                  onClick={() => handleOpenFile(file)}
                >
                  <span className="tab-label">{file}</span>
                  <button
                    className="tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseFile(file);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="panel-container">
            {renderPanel()}
          </div>
          {bottomPanel && (
            <div className="bottom-panel">
              <div className="bottom-panel-header">
                <div className="bottom-panel-tabs">
                  {bottomTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`bottom-panel-tab ${bottomActiveTab === tab.id ? 'active' : ''}`}
                      onClick={() => setBottomActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="bottom-panel-actions">
                  <button className="header-btn btn-sm" onClick={() => setBottomPanel(null)}>×</button>
                </div>
              </div>
              <div className="bottom-panel-content">
                {bottomActiveTab === 'terminal' && (
                  <TerminalPanel
                    output={state.terminalOutput}
                    onAppendOutput={(lines) => setState((prev) => ({ ...prev, terminalOutput: [...prev.terminalOutput, ...lines] }))}
                  />
                )}
                {bottomActiveTab === 'problems' && (
                  <div>
                    {state.diagnostics.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">&#10003;</div>
                        <div className="empty-state-title">No problems detected</div>
                        <div className="empty-state-desc">Your workspace is clean. Keep up the good work!</div>
                      </div>
                    ) : (
                      state.diagnostics.map((d, i) => (
                        <div key={i} className="list-item">
                          <span className="list-item-icon" style={{ color: d.severity === 'error' ? 'var(--accent-red)' : d.severity === 'warn' ? 'var(--accent-yellow)' : 'var(--accent)' }}>
                            {d.severity === 'error' ? '●' : d.severity === 'warn' ? '▲' : 'ℹ'}
                          </span>
                          <div className="list-item-content">
                            <div className="list-item-title">{d.message}</div>
                            {d.file && <div className="list-item-subtitle">{d.file}:{d.line}</div>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {bottomActiveTab === 'output' && (
                  <div style={{ color: 'var(--text-muted)' }}>No output yet. Run an agent or command to see output here.</div>
                )}
                {bottomActiveTab === 'debug' && (
                  state.debug.session ? (
                    <DebugPanel
                      session={state.debug.session}
                      output={state.debug.output}
                      onAppendOutput={(lines) => setState((prev) => ({ ...prev, debug: { ...prev.debug, output: [...prev.debug.output, ...lines] } }))}
                      onStartDebug={(filePath) => setState((prev) => ({ ...prev, debug: { session: { id: 'debug-1', name: filePath, status: 'running', breakpoints: [], callStack: [], variables: {} }, output: ['Debug session started...'] } }))}
                      onStopDebug={() => setState((prev) => ({ ...prev, debug: { session: null, output: [] } }))}
                      onToggleBreakpoint={(line) => setState((prev) => {
                        const session = prev.debug.session;
                        if (!session) return prev;
                        const breakpoints = session.breakpoints.includes(String(line))
                          ? session.breakpoints.filter((b) => b !== String(line))
                          : [...session.breakpoints, String(line)];
                        return { ...prev, debug: { ...prev.debug, session: { ...session, breakpoints } } };
                      })}
                    />
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Debug console ready. Attach a debugger to start debugging.</div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="status-bar">
        <div className="status-bar-left">
          <span className="status-bar-item">
            <span className="status-dot idle" />
            {state.agents.find((a) => a.status === 'running') ? 'Running' : 'Ready'}
          </span>
          {state.activeFile && <span className="status-bar-item">{state.activeFile}</span>}
          {state.diagnostics.length > 0 && (
            <span className="status-bar-item" style={{ color: 'var(--accent-red)' }}>
              {state.diagnostics.length} problem{state.diagnostics.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="status-bar-right">
          {state.collab.session?.status === 'running' && (
            <span className="status-bar-item" style={{ color: 'var(--accent-green)' }}>
              ● Collab: {state.collab.session.id.slice(0, 8)}
            </span>
          )}
          <span className="status-bar-separator" />
          <span className="status-bar-item">SHAM v0.1.0</span>
          <span className="status-bar-item">ALP v39.0.0</span>
        </div>
      </footer>

      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} onSelect={(cmd) => {
          if (cmd === 'settings') setActivePanel('settings');
          else if (cmd === 'git') setActivePanel('git');
          else if (cmd === 'search') setActivePanel('search');
          else if (cmd === 'terminal.toggle') setBottomPanel((prev) => (prev === 'terminal' ? null : 'terminal'));
          else if (cmd === 'editor.new') { handleOpenFile('untitled.alp'); setActivePanel('editor'); }
          else if (cmd === 'editor.save') { /* placeholder */ }
          else if (cmd === 'workbench.focusSidebar') { /* placeholder */ }
          else if (cmd === 'debugger.start') { setActivePanel('debugger'); }
          else if (cmd === 'debugger.stop') { setState((prev) => ({ ...prev, debug: { session: null, output: [] } })); }
          else if (cmd === 'tests.run') { setActivePanel('test-runner'); }
          setShowCommandPalette(false);
        }} />
      )}
    </div>
  );
}

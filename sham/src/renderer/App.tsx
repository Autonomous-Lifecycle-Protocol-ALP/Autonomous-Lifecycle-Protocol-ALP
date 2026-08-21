import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { EditorPanel } from './components/EditorPanel.js';
import { TerminalPanel } from './components/TerminalPanel.js';
import { WelcomeScreen } from './components/WelcomeScreen.js';
import { Icon } from './components/Icon.js';
import { CommandPalette } from './components/CommandPalette.js';
import { fetchBlockTypes, runAgent, validateALPFile, onAppReady, collabCursorMove } from './shared/alp-client.js';
import type { SHAMState } from './shared/types.js';
import './styles/global.css';
import './styles/layout.css';

// Lazy-loaded panel components for code-splitting
const AgentPanel = React.lazy(() => import('./components/AgentPanel.js').then(m => ({ default: m.AgentPanel })));
const MCPBrowser = React.lazy(() => import('./components/MCPBrowser.js').then(m => ({ default: m.MCPBrowser })));
const ProPanel = React.lazy(() => import('./components/ProPanel.js').then(m => ({ default: m.ProPanel })));
const CollaborationPanel = React.lazy(() => import('./components/CollaborationPanel.js').then(m => ({ default: m.CollaborationPanel })));
const PluginPanel = React.lazy(() => import('./components/PluginPanel.js').then(m => ({ default: m.PluginPanel })));
const ProfilerPanel = React.lazy(() => import('./components/ProfilerPanel.js').then(m => ({ default: m.ProfilerPanel })));
const CopilotPanel = React.lazy(() => import('./components/CopilotPanel.js').then(m => ({ default: m.CopilotPanel })));
const RefactorPanel = React.lazy(() => import('./components/RefactorPanel.js').then(m => ({ default: m.RefactorPanel })));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel.js').then(m => ({ default: m.SettingsPanel })));
const GitPanel = React.lazy(() => import('./components/GitPanel.js').then(m => ({ default: m.GitPanel })));
const SearchPanel = React.lazy(() => import('./components/SearchPanel.js').then(m => ({ default: m.SearchPanel })));
const DebugPanel = React.lazy(() => import('./components/DebugPanel.js').then(m => ({ default: m.DebugPanel })));
const TestRunnerPanel = React.lazy(() => import('./components/TestRunnerPanel.js').then(m => ({ default: m.TestRunnerPanel })));
const SwarmMarketplacePanel = React.lazy(() => import('./components/SwarmMarketplacePanel.js').then(m => ({ default: m.SwarmMarketplacePanel })));
const ZKProofPanel = React.lazy(() => import('./components/ZKProofPanel.js').then(m => ({ default: m.ZKProofPanel })));
const DAGPartitionPanel = React.lazy(() => import('./components/DAGPartitionPanel.js').then(m => ({ default: m.DAGPartitionPanel })));
const CRDTCanvasPanel = React.lazy(() => import('./components/CRDTCanvasPanel.js').then(m => ({ default: m.CRDTCanvasPanel })));
const WasmAstPanel = React.lazy(() => import('./components/WasmAstPanel.js').then(m => ({ default: m.WasmAstPanel })));
const EdgeDebugPanel = React.lazy(() => import('./components/EdgeDebugPanel.js').then(m => ({ default: m.EdgeDebugPanel })));
const TelemetryInspectorPanel = React.lazy(() => import('./components/TelemetryInspectorPanel.js').then(m => ({ default: m.TelemetryInspectorPanel })));
const ChaosEnginePanel = React.lazy(() => import('./components/ChaosEnginePanel.js').then(m => ({ default: m.ChaosEnginePanel })));
const FeatureFlagPanel = React.lazy(() => import('./components/FeatureFlagPanel.js').then(m => ({ default: m.FeatureFlagPanel })));
const WorkflowReplayPanel = React.lazy(() => import('./components/WorkflowReplayPanel.js').then(m => ({ default: m.WorkflowReplayPanel })));
const LocalStoragePanel = React.lazy(() => import('./components/LocalStoragePanel.js').then(m => ({ default: m.LocalStoragePanel })));
const SelfHealingMeshPanel = React.lazy(() => import('./components/SelfHealingMeshPanel.js').then(m => ({ default: m.SelfHealingMeshPanel })));
const IntelligencePanel = React.lazy(() => import('./components/IntelligencePanel.js').then(m => ({ default: m.IntelligencePanel })));
const AutonomyPanel = React.lazy(() => import('./components/AutonomyPanel.js').then(m => ({ default: m.AutonomyPanel })));
const SynapsePanel = React.lazy(() => import('./components/SynapsePanel.js').then(m => ({ default: m.SynapsePanel })));
const MultiModalPanel = React.lazy(() => import('./components/MultiModalPanel.js').then(m => ({ default: m.MultiModalPanel })));


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
  intelligence: { suggestions: [], output: [] },
  autonomy: { decisions: [], output: [] },
};

type PanelId = 'editor' | 'terminal' | 'agents' | 'synapse' | 'multimodal' | 'mcp' | 'collab' | 'plugins' | 'profiler' | 'copilot' | 'refactor' | 'pro' | 'settings' | 'git' | 'search' | 'debugger' | 'test-runner' | 'marketplace' | 'zk' | 'partition' | 'crdtCanvas' | 'wasmAst' | 'edgeDebug' | 'telemetryInspector' | 'chaosEngine' | 'featureFlags' | 'workflowReplay' | 'localStorage' | 'selfHealingMesh' | 'intelligence' | 'autonomy';

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
    { id: 'synapse', label: 'Synapse' },
    { id: 'mcp', label: 'MCP' },
    { id: 'intelligence', label: 'Intelligence' },
    { id: 'autonomy', label: 'Autonomy' },
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
      case 'synapse':
        return <SynapsePanel parsedObjects={state.parseResult?.objects || null} />;
      case 'multimodal':
        return <MultiModalPanel parsedObjects={state.parseResult?.objects || null} />;
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
      case 'marketplace':
        return <SwarmMarketplacePanel />;
      case 'zk':
        return <ZKProofPanel />;
      case 'partition':
        return <DAGPartitionPanel />;
      case 'crdtCanvas':
        return <CRDTCanvasPanel />;
      case 'wasmAst':
        return <WasmAstPanel />;
      case 'edgeDebug':
        return <EdgeDebugPanel />;
      case 'telemetryInspector':
        return <TelemetryInspectorPanel />;
      case 'chaosEngine':
        return <ChaosEnginePanel />;
      case 'featureFlags':
        return <FeatureFlagPanel />;
      case 'workflowReplay':
        return <WorkflowReplayPanel />;
      case 'localStorage':
        return <LocalStoragePanel />;
      case 'selfHealingMesh':
        return <SelfHealingMeshPanel />;
      case 'intelligence':
        return (
          <IntelligencePanel
            state={state.intelligence}
            onUpdateState={(s) => setState((prev) => ({ ...prev, intelligence: s }))}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, intelligence: { suggestions: prev.intelligence.suggestions, output: [...prev.intelligence.output, ...lines] } }))}
          />
        );
      case 'autonomy':
        return (
          <AutonomyPanel
            state={state.autonomy}
            onUpdateState={(s) => setState((prev) => ({ ...prev, autonomy: s }))}
            onAppendOutput={(lines) => setState((prev) => ({ ...prev, autonomy: { decisions: prev.autonomy.decisions, output: [...prev.autonomy.output, ...lines] } }))}
          />
        );
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
        <span className="app-header-title">v80.0.0 — IDE Intelligence</span>
        <div className="app-header-spacer" />
        <div className="app-header-actions">
          <button className="header-btn" onClick={() => setShowCommandPalette(true)} title="Command Palette (Ctrl+Shift+P)">
            <Icon name="menu" size={16} /> Commands
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
          setActivePanel={(panel: string) => setActivePanel(panel as PanelId)}
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
            <Suspense fallback={<div className="panel-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading panel...</div>}>
              {renderPanel()}
            </Suspense>
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
                        <div className="empty-state-icon"><Icon name="check" size={48} color="var(--accent-green)" /></div>
                        <div className="empty-state-title">No problems detected</div>
                        <div className="empty-state-desc">Your workspace is clean. Keep up the good work!</div>
                      </div>
                    ) : (
                      state.diagnostics.map((d, i) => {
                        const isWarn = d.severity === 'warning' || (d.severity as string) === 'warn';
                        const isErr = d.severity === 'error';
                        const filePath = (d as unknown as { file?: string; filePath?: string }).file ?? (d as unknown as { file?: string; filePath?: string }).filePath;
                        return (
                          <div key={i} className="list-item">
                            <span className="list-item-icon" style={{ color: isErr ? 'var(--accent-red)' : isWarn ? 'var(--accent-yellow)' : 'var(--accent)' }}>
                              {isErr ? '●' : isWarn ? '▲' : 'ℹ'}
                            </span>
                            <div className="list-item-content">
                              <div className="list-item-title">{d.message}</div>
                              {filePath && <div className="list-item-subtitle">{filePath}:{d.line}</div>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                {bottomActiveTab === 'output' && (
                  <div style={{ color: 'var(--text-muted)' }}>No output yet. Run an agent or command to see output here.</div>
                )}
                {bottomActiveTab === 'debug' && (
                  state.debug.session ? (
                    <Suspense fallback={<div style={{ color: 'var(--text-muted)' }}>Loading debugger...</div>}>
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
                    </Suspense>
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
          <span className="status-bar-item">SHAM v80.0.0</span>
          <span className="status-bar-item">ALP v80.0.0</span>
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
          else if (cmd === 'collab.start') { setActivePanel('collab'); }
          else if (cmd === 'collab.share') {
            if (state.collab.session) {
              navigator.clipboard.writeText(`sham://collab/join/${state.collab.session.id}`).catch(() => {});
            }
          }
          setShowCommandPalette(false);
        }} />
      )}
    </div>
  );
}


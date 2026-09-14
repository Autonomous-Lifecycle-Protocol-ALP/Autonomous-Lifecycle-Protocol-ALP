import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar.js';
import { SecondarySidebar } from '../components/SecondarySidebar.js';
import { ShortcutsModal } from '../components/ShortcutsModal.js';
import { CommandPalette } from '../components/CommandPalette.js';
import { TerminalPanel } from '../components/TerminalPanel.js';
import { DebugPanel } from '../components/DebugPanel.js';
import { PanelsDrawer } from '../components/PanelsDrawer.js';
import { Icon } from '../components/Icon.js';
import { PanelRouter } from './PanelRouter.js';
import { useAppState } from './useAppState.js';
import { PanelSuspense, type PanelId, type BottomTabId, defaultState, panels, bottomTabs, type AppProps, ALL_PANELS } from './shared.js';
import '../styles/global.css';
import '../styles/layout.css';

export function App(_props: AppProps): React.JSX.Element {
  const {
    state,
    setState,
    handleOpenFile,
    handleCloseFile,
    handleRunAgent,
    handleCreateAgent,
    handleValidate,
    handleCursorChange,
  } = useAppState();

  const [activePanel, setActivePanel] = useState<PanelId>('editor');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showPanelsDrawer, setShowPanelsDrawer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [secondarySidebarOpen, setSecondarySidebarOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [bottomPanel, setBottomPanel] = useState<BottomTabId | null>('terminal');
  const [bottomActiveTab, setBottomActiveTab] = useState<BottomTabId>('terminal');

  // Editor enhancement state
  const [splitFile, setSplitFile] = useState<string | null>(null);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());
  const [pinnedFiles, setPinnedFiles] = useState<string[]>([]);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; file: string } | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Save toast auto-dismiss
  useEffect(() => {
    if (saveToast) {
      const timer = setTimeout(() => setSaveToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  // Close context menu on click outside
  useEffect(() => {
    if (!tabContextMenu) return;
    const close = () => setTabContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [tabContextMenu]);

  // Warn before unloading if there are dirty files
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyFiles.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyFiles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Save file
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (state.activeFile && dirtyFiles.has(state.activeFile)) {
          setDirtyFiles((prev) => {
            const next = new Set(prev);
            next.delete(state.activeFile!);
            return next;
          });
          setSaveToast(state.activeFile);
        }
      // Ctrl+\: Toggle split editor
      } else if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setSplitFile((prev) => {
          if (prev) return null;
          // Pick the next open file or the active file
          const other = state.openFiles.find((f) => f !== state.activeFile);
          return other ?? state.activeFile ?? null;
        });
      // Ctrl+Alt+D: Toggle diff mode
      } else if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsDiffMode((prev) => !prev);
      // Secondary Sidebar toggle: Ctrl+Alt+B
      } else if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setSecondarySidebarOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        // Primary Sidebar toggle: Ctrl+B
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      } else if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === '?'))) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && (e.key === 'O' || e.key === 'o')) || (e.altKey && (e.key === 'p' || e.key === 'P')))
      ) {
        e.preventDefault();
        setShowPanelsDrawer((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setBottomPanel((prev) => (prev ? null : 'terminal'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.activeFile, state.openFiles, dirtyFiles]);

  const onOpenFile = useCallback((filePath: string) => {
    handleOpenFile(filePath);
    setActivePanel('editor');
    setShowWelcome(false);
  }, [handleOpenFile]);

  const onCloseFile = useCallback((filePath: string) => {
    handleCloseFile(filePath);
    if (state.openFiles.length <= 1) {
      setShowWelcome(true);
    }
  }, [handleCloseFile, state.openFiles.length]);

  const handleSelectPanel = useCallback((panel: PanelId) => {
    setActivePanel(panel);
    setShowWelcome(false);
  }, []);

  const onUpdateCollabSession = useCallback((session: typeof defaultState.collab.session) => {
    setState((prev) => ({ ...prev, collab: { ...prev.collab, session } }));
  }, [setState]);

  const onAppendCollabOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, collab: { ...prev.collab, output: [...prev.collab.output, ...lines] } }));
  }, [setState]);

  const onUpdateCollabPresence = useCallback((presence: typeof defaultState.collab.presence) => {
    setState((prev) => ({ ...prev, collab: { ...prev.collab, presence } }));
  }, [setState]);

  const onUpdatePlugins = useCallback((plugins: typeof defaultState.plugins.plugins) => {
    setState((prev) => ({ ...prev, plugins: { ...prev.plugins, plugins } }));
  }, [setState]);

  const onAppendPluginOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, plugins: { ...prev.plugins, output: [...prev.plugins.output, ...lines] } }));
  }, [setState]);

  const onUpdateProfilerTraces = useCallback((traces: typeof defaultState.profiler.traces) => {
    setState((prev) => ({ ...prev, profiler: { ...prev.profiler, traces } }));
  }, [setState]);

  const onAppendProfilerOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, profiler: { ...prev.profiler, output: [...prev.profiler.output, ...lines] } }));
  }, [setState]);

  const onUpdateCopilotSuggestions = useCallback((suggestions: typeof defaultState.copilot.suggestions) => {
    setState((prev) => ({ ...prev, copilot: { ...prev.copilot, suggestions } }));
  }, [setState]);

  const onAppendCopilotOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, copilot: { ...prev.copilot, output: [...prev.copilot.output, ...lines] } }));
  }, [setState]);

  const onUpdateRefactorRenames = useCallback((renames: typeof defaultState.refactor.renames) => {
    setState((prev) => ({ ...prev, refactor: { ...prev.refactor, renames } }));
  }, [setState]);

  const onAppendRefactorOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, refactor: { ...prev.refactor, output: [...prev.refactor.output, ...lines] } }));
  }, [setState]);

  const onAppendDebugOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, debug: { ...prev.debug, output: [...prev.debug.output, ...lines] } }));
  }, [setState]);

  const onStartDebug = useCallback((filePath: string) => {
    setState((prev) => ({
      ...prev,
      debug: {
        session: { id: 'debug-1', name: filePath, status: 'running', breakpoints: [], callStack: [], variables: {} },
        output: ['Debug session started...'],
      },
    }));
  }, [setState]);

  const onStopDebug = useCallback(() => {
    setState((prev) => ({ ...prev, debug: { session: null, output: [] } }));
  }, [setState]);

  const onToggleBreakpoint = useCallback((line: number | string) => {
    setState((prev) => {
      const session = prev.debug.session;
      if (!session) return prev;
      const breakpoints = session.breakpoints.includes(String(line))
        ? session.breakpoints.filter((b) => b !== String(line))
        : [...session.breakpoints, String(line)];
      return { ...prev, debug: { ...prev.debug, session: { ...session, breakpoints } } };
    });
  }, [setState]);

  const onRunTests = useCallback(async (suiteIds: string[]) => {
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
  }, [setState, state.testRunner.suites]);

  const onAppendTestOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, testRunner: { ...prev.testRunner, output: [...prev.testRunner.output, ...lines] } }));
  }, [setState]);

  const onUpdateIntelligenceState = useCallback((s: typeof defaultState.intelligence) => {
    setState((prev) => ({ ...prev, intelligence: s }));
  }, [setState]);

  const onAppendIntelligenceOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, intelligence: { suggestions: prev.intelligence.suggestions, output: [...prev.intelligence.output, ...lines] } }));
  }, [setState]);

  const onUpdateAutonomyState = useCallback((s: typeof defaultState.autonomy) => {
    setState((prev) => ({ ...prev, autonomy: s }));
  }, [setState]);

  const onAppendAutonomyOutput = useCallback((lines: string[]) => {
    setState((prev) => ({ ...prev, autonomy: { decisions: prev.autonomy.decisions, output: [...prev.autonomy.output, ...lines] } }));
  }, [setState]);

  return (
    <div className="app">
      <header className="app-header">
        <button
          className={`header-btn header-sidebar-toggle ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen((prev) => !prev)}
          title="Toggle Sidebar (Ctrl+B)"
          aria-label="Toggle Sidebar"
        >
          <Icon name="sidebar" size={16} />
        </button>
        <div className="app-header-logo">
          <div className="app-header-logo-icon">S</div>
          <span>SHAM</span>
        </div>
        <span className="app-header-title">v80.0.0 — IDE Intelligence</span>
        <div className="app-header-spacer" />
        <div className="app-header-actions">
          <div className="header-layout-controls">
            <button
              className={`header-btn header-layout-btn ${sidebarOpen && !zenMode ? 'active' : ''}`}
              onClick={() => setSidebarOpen((prev) => !prev)}
              title="Toggle Primary Sidebar (Ctrl+B)"
              aria-label="Toggle Primary Sidebar"
            >
              <Icon name="sidebar" size={14} />
            </button>
            <button
              className={`header-btn header-layout-btn ${Boolean(bottomPanel) && !zenMode ? 'active' : ''}`}
              onClick={() => setBottomPanel((prev) => (prev ? null : 'terminal'))}
              title="Toggle Bottom Terminal Drawer (Ctrl+`)"
              aria-label="Toggle Bottom Panel"
            >
              <Icon name="terminal" size={14} />
            </button>
            <button
              className={`header-btn header-layout-btn header-secondary-sidebar-toggle ${secondarySidebarOpen && !zenMode ? 'active' : ''}`}
              onClick={() => setSecondarySidebarOpen((prev) => !prev)}
              title="Toggle Secondary Sidebar (Ctrl+Alt+B)"
              aria-label="Toggle Secondary Sidebar"
            >
              <Icon name="panelRight" size={14} />
            </button>
          </div>

          <button
            className={`header-btn ${zenMode ? 'active' : ''}`}
            onClick={() => setZenMode((prev) => !prev)}
            title="Toggle Distraction-Free Zen Mode"
            aria-label="Toggle Zen Mode"
          >
            <Icon name="zenMode" size={14} />
            <span>Zen</span>
          </button>

          <button
            className="header-btn"
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard Shortcuts & Help (F1)"
            aria-label="Shortcuts Help"
          >
            <Icon name="helpCircle" size={14} />
          </button>

          <button
            className={`header-btn header-drawer-btn ${showPanelsDrawer ? 'active' : ''}`}
            onClick={() => setShowPanelsDrawer((prev) => !prev)}
            title="Panels & Workspaces Drawer (Ctrl+Shift+O)"
          >
            <Icon name="layers" size={15} />
            <span>Panels</span>
            <span className="navbar-badge">{ALL_PANELS.length}</span>
          </button>
          <button className="header-btn" onClick={() => setShowCommandPalette(true)} title="Command Palette (Ctrl+Shift+P)">
            <Icon name="menu" size={16} /> Commands
          </button>
          {panels.map((panel) => (
            <button
              key={panel.id}
              className={`header-btn ${activePanel === panel.id ? 'active' : ''}`}
              onClick={() => handleSelectPanel(panel.id)}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </header>

      <div className={`app-body ${zenMode ? 'zen-mode' : ''}`}>
        {!zenMode && sidebarOpen && (
          <Sidebar
            state={state}
            onOpenFile={onOpenFile}
            onCloseFile={onCloseFile}
            onSelectAgent={(id) => setState((prev) => ({ ...prev, selectedAgent: id }))}
            activePanel={activePanel}
            setActivePanel={(panel: string) => handleSelectPanel(panel as PanelId)}
            onOpenPanelsDrawer={() => setShowPanelsDrawer(true)}
            onToggleSidebar={() => setSidebarOpen(false)}
          />
        )}
        {!zenMode && !sidebarOpen && (
          <button
            className="sidebar-edge-pill sidebar-edge-pill-left"
            onClick={() => setSidebarOpen(true)}
            title="Open Primary Sidebar (Ctrl+B)"
            aria-label="Open Primary Sidebar"
          >
            <Icon name="chevronRight" size={13} />
            <span>Explorer</span>
          </button>
        )}

        <div className="main-area">
          <div className="breadcrumbs-bar">
            <div className="breadcrumbs-path">
              <span className="breadcrumb-root">SHAM</span>
              <span className="breadcrumb-separator">/</span>
              {state.activeFile ? (
                <>
                  {state.activeFile.split('/').slice(0, -1).map((seg, idx) => (
                    <React.Fragment key={idx}>
                      <span className="breadcrumb-folder">{seg}</span>
                      <span className="breadcrumb-separator">/</span>
                    </React.Fragment>
                  ))}
                  <span className="breadcrumb-file">{state.activeFile.split('/').pop()}</span>
                </>
              ) : (
                <span className="breadcrumb-file">Overview</span>
              )}
            </div>
            <div className="breadcrumbs-meta">
              {state.activeFile && <span className="breadcrumbs-badge">UTF-8</span>}
              <span className="breadcrumbs-badge">{activePanel.toUpperCase()}</span>
            </div>
          </div>

          {!showWelcome && state.openFiles.length > 0 && (
            <div className="tab-bar">
              {/* Pinned tabs first */}
              {[...pinnedFiles.filter(f => state.openFiles.includes(f)), ...state.openFiles.filter(f => !pinnedFiles.includes(f))].map((file) => (
                <div
                  key={file}
                  className={`tab ${state.activeFile === file ? 'active' : ''} ${pinnedFiles.includes(file) ? 'pinned' : ''}`}
                  onClick={() => onOpenFile(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setTabContextMenu({ x: e.clientX, y: e.clientY, file });
                  }}
                >
                  {pinnedFiles.includes(file) && (
                    <span className="tab-pinned" title="Pinned"><Icon name="bookmark" size={8} /></span>
                  )}
                  {dirtyFiles.has(file) && (
                    <span className="tab-dirty-dot" title="Unsaved changes" />
                  )}
                  <span className="tab-label">{file}</span>
                  <button
                    className="tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(file);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="panel-container">
            <PanelSuspense>
              <PanelRouter
                activePanel={activePanel}
                showWelcome={showWelcome}
                state={state}
                onOpenFile={onOpenFile}
                onValidate={handleValidate}
                onCursorChange={handleCursorChange}
                onRunAgent={handleRunAgent}
                onCreateAgent={handleCreateAgent}
                onUpdateCollabSession={onUpdateCollabSession}
                onAppendCollabOutput={onAppendCollabOutput}
                onUpdateCollabPresence={onUpdateCollabPresence}
                onUpdatePlugins={onUpdatePlugins}
                onAppendPluginOutput={onAppendPluginOutput}
                onUpdateProfilerTraces={onUpdateProfilerTraces}
                onAppendProfilerOutput={onAppendProfilerOutput}
                onUpdateCopilotSuggestions={onUpdateCopilotSuggestions}
                onAppendCopilotOutput={onAppendCopilotOutput}
                onUpdateRefactorRenames={onUpdateRefactorRenames}
                onAppendRefactorOutput={onAppendRefactorOutput}
                onAppendDebugOutput={onAppendDebugOutput}
                onStartDebug={onStartDebug}
                onStopDebug={onStopDebug}
                onToggleBreakpoint={onToggleBreakpoint}
                onRunTests={onRunTests}
                onAppendTestOutput={onAppendTestOutput}
                onUpdateIntelligenceState={onUpdateIntelligenceState}
                onAppendIntelligenceOutput={onAppendIntelligenceOutput}
                onUpdateAutonomyState={onUpdateAutonomyState}
                onAppendAutonomyOutput={onAppendAutonomyOutput}
                splitFile={splitFile}
                isDiffMode={isDiffMode}
                wordWrap={wordWrap}
                onToggleSplit={() => setSplitFile((prev) => {
                  if (prev) return null;
                  const other = state.openFiles.find((f) => f !== state.activeFile);
                  return other ?? state.activeFile ?? null;
                })}
                onToggleDiff={() => setIsDiffMode((prev) => !prev)}
                onToggleWordWrap={() => setWordWrap((prev) => !prev)}
                onRunAlp={(filePath) => {
                  setBottomPanel('terminal');
                  setBottomActiveTab('terminal');
                  const timestamp = new Date().toLocaleTimeString();
                  setState((prev) => ({
                    ...prev,
                    terminalOutput: [...prev.terminalOutput, `[${timestamp}] $ alp run ${filePath}`, `[${timestamp}] ▸ Agent execution started...`],
                  }));
                }}
                onCopyPath={(filePath) => {
                  try { navigator.clipboard.writeText(filePath); } catch { /* ignore */ }
                }}
                onMarkDirty={(filePath) => {
                  setDirtyFiles((prev) => new Set(prev).add(filePath));
                }}
              />
            </PanelSuspense>
          </div>
          {!zenMode && bottomPanel && (
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
                    <PanelSuspense>
                      <DebugPanel
                        session={state.debug.session}
                        output={state.debug.output}
                        onAppendOutput={onAppendDebugOutput}
                        onStartDebug={onStartDebug}
                        onStopDebug={onStopDebug}
                        onToggleBreakpoint={onToggleBreakpoint}
                      />
                    </PanelSuspense>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Debug console ready. Attach a debugger to start debugging.</div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {!zenMode && secondarySidebarOpen && (
          <SecondarySidebar
            state={state}
            onOpenFile={onOpenFile}
            onRunAgent={(agentId) => handleRunAgent(agentId, {})}
            onClose={() => setSecondarySidebarOpen(false)}
          />
        )}
        {!zenMode && !secondarySidebarOpen && (
          <button
            className="sidebar-edge-pill sidebar-edge-pill-right"
            onClick={() => setSecondarySidebarOpen(true)}
            title="Open Secondary Sidebar (Ctrl+Alt+B)"
            aria-label="Open Secondary Sidebar"
          >
            <Icon name="chevronLeft" size={13} />
            <span>Assistant</span>
          </button>
        )}

        {zenMode && (
          <button
            className="zen-mode-exit-pill"
            onClick={() => setZenMode(false)}
            title="Exit Zen Mode (Distraction-Free)"
            aria-label="Exit Zen Mode"
          >
            <Icon name="zenMode" size={13} />
            <span>Exit Zen Mode</span>
          </button>
        )}
      </div>

      {/* Tab Context Menu */}
      {tabContextMenu && (
        <div
          className="tab-context-menu"
          style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
          data-testid="tab-context-menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="tab-context-item" onClick={() => { onCloseFile(tabContextMenu.file); setTabContextMenu(null); }}>
            <Icon name="x" size={12} /> Close
          </button>
          <button className="tab-context-item" onClick={() => {
            state.openFiles.filter((f) => f !== tabContextMenu.file).forEach(onCloseFile);
            setTabContextMenu(null);
          }}>
            <Icon name="x" size={12} /> Close Others
          </button>
          <button className="tab-context-item" onClick={() => {
            const idx = state.openFiles.indexOf(tabContextMenu.file);
            state.openFiles.slice(idx + 1).forEach(onCloseFile);
            setTabContextMenu(null);
          }}>
            <Icon name="x" size={12} /> Close to the Right
          </button>
          <button className="tab-context-item danger" onClick={() => {
            state.openFiles.forEach(onCloseFile);
            setTabContextMenu(null);
          }}>
            <Icon name="trash" size={12} /> Close All
          </button>
          <div className="tab-context-separator" />
          <button className="tab-context-item" onClick={() => {
            setPinnedFiles((prev) =>
              prev.includes(tabContextMenu.file)
                ? prev.filter((f) => f !== tabContextMenu.file)
                : [...prev, tabContextMenu.file]
            );
            setTabContextMenu(null);
          }}>
            <Icon name="bookmark" size={12} />
            {pinnedFiles.includes(tabContextMenu.file) ? 'Unpin Tab' : 'Pin Tab'}
          </button>
          <button className="tab-context-item" onClick={() => {
            setSplitFile(tabContextMenu.file);
            setTabContextMenu(null);
          }}>
            <Icon name="columns" size={12} /> Split Right
            <span className="ctx-shortcut">Ctrl+\</span>
          </button>
          <div className="tab-context-separator" />
          <button className="tab-context-item" onClick={() => {
            try { navigator.clipboard.writeText(tabContextMenu.file); } catch { /* ignore */ }
            setTabContextMenu(null);
          }}>
            <Icon name="copy" size={12} /> Copy Path
          </button>
          <button className="tab-context-item" onClick={() => {
            setDirtyFiles((prev) => {
              const next = new Set(prev);
              next.delete(tabContextMenu.file);
              return next;
            });
            setSaveToast(tabContextMenu.file);
            setTabContextMenu(null);
          }}>
            <Icon name="save" size={12} /> Save File
            <span className="ctx-shortcut">Ctrl+S</span>
          </button>
        </div>
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="save-toast" data-testid="save-toast">
          <Icon name="check" size={14} />
          Saved: {saveToast}
        </div>
      )}

      <footer className="status-bar">
        <div className="status-bar-left">
          <span className="status-bar-item">
            <span className="status-dot idle" />
            {state.agents.find((a) => a.status === 'running') ? 'Running' : 'Ready'}
          </span>
          {state.activeFile && <span className="status-bar-item">{state.activeFile}</span>}
          {state.diagnostics.length > 0 && (
            <span
              className="status-bar-item"
              style={{ color: 'var(--accent-red)', cursor: 'pointer' }}
              onClick={() => {
                setBottomPanel('problems');
                setBottomActiveTab('problems');
              }}
              title="Click to view problems"
            >
              {state.diagnostics.length} problem{state.diagnostics.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="status-bar-right">
          <span
            className="status-bar-item status-bar-interactive"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title="Status Bar: Toggle Primary Sidebar (Ctrl+B)"
          >
            <Icon name="sidebar" size={11} />
            <span>Primary: {sidebarOpen ? 'On' : 'Off'}</span>
          </span>
          <span
            className="status-bar-item status-bar-interactive"
            onClick={() => setSecondarySidebarOpen((prev) => !prev)}
            title="Status Bar: Toggle Secondary Sidebar (Ctrl+Alt+B)"
          >
            <Icon name="panelRight" size={11} />
            <span>Secondary: {secondarySidebarOpen ? 'On' : 'Off'}</span>
          </span>
          <span
            className="status-bar-item status-bar-interactive"
            onClick={() => setShowShortcutsModal(true)}
            title="Status Bar: Shortcuts & Tips (F1)"
          >
            <Icon name="helpCircle" size={11} />
            <span>Shortcuts</span>
          </span>
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
          if (cmd === 'settings') handleSelectPanel('settings');
          else if (cmd === 'git') handleSelectPanel('git');
          else if (cmd === 'search') handleSelectPanel('search');
          else if (cmd === 'terminal.toggle') setBottomPanel((prev) => (prev === 'terminal' ? null : 'terminal'));
          else if (cmd === 'editor.new') { onOpenFile('untitled.alp'); }
          else if (cmd === 'editor.save') {
            if (state.activeFile) {
              setDirtyFiles((prev) => {
                const next = new Set(prev);
                next.delete(state.activeFile!);
                return next;
              });
              setSaveToast(state.activeFile);
            }
          }
          else if (cmd === 'editor.split') {
            setSplitFile((prev) => {
              if (prev) return null;
              const other = state.openFiles.find((f) => f !== state.activeFile);
              return other ?? state.activeFile ?? null;
            });
          }
          else if (cmd === 'editor.diff') {
            setIsDiffMode((prev) => !prev);
          }
          else if (cmd === 'editor.wrap') {
            setWordWrap((prev) => !prev);
          }
          else if (cmd === 'editor.copyPath') {
            if (state.activeFile) {
              try { navigator.clipboard.writeText(state.activeFile); } catch { /* ignore */ }
            }
          }
          else if (cmd === 'agent.create') { handleSelectPanel('agents'); }
          else if (cmd === 'workbench.focusSidebar' || cmd === 'sidebar.toggle') { setSidebarOpen((prev) => !prev); }
          else if (cmd === 'secondarySidebar.toggle' || cmd === 'workbench.secondarySidebar') { setSecondarySidebarOpen((prev) => !prev); }
          else if (cmd === 'zenMode.toggle' || cmd === 'workbench.zenMode') { setZenMode((prev) => !prev); }
          else if (cmd === 'help.shortcuts' || cmd === 'workbench.shortcuts') { setShowShortcutsModal(true); }
          else if (cmd === 'panels.drawer' || cmd === 'workbench.panels') { setShowPanelsDrawer(true); }
          else if (cmd === 'debugger.start') { handleSelectPanel('debugger'); }
          else if (cmd === 'debugger.stop') { setState((prev) => ({ ...prev, debug: { session: null, output: [] } })); }
          else if (cmd === 'tests.run') { handleSelectPanel('test-runner'); }
          else if (cmd === 'collab.start') { handleSelectPanel('collab'); }
          else if (cmd === 'collab.share') {
            if (state.collab.session) {
              navigator.clipboard.writeText(`sham://collab/join/${state.collab.session.id}`).catch(() => {});
            }
          }
          setShowCommandPalette(false);
        }} />
      )}

      <PanelsDrawer
        isOpen={showPanelsDrawer}
        onClose={() => setShowPanelsDrawer(false)}
        activePanel={activePanel}
        onSelectPanel={handleSelectPanel}
      />

      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}

export type { AppProps } from './shared.js';
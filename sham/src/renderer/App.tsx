import React, { useState, useEffect } from 'react';
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
import { theme } from './styles/theme.js';
import { fetchBlockTypes, runAgent, validateALPFile, onAppReady } from './shared/alp-client.js';
import type { SHAMState } from './shared/types.js';

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
  collab: { session: null, output: [] },
  plugins: { plugins: [], output: [] },
  profiler: { traces: [], output: [] },
  copilot: { suggestions: [], output: [] },
};

export function App(): React.JSX.Element {
  const [state, setState] = useState<SHAMState>(defaultState);
  const [activePanel, setActivePanel] = useState<'editor' | 'terminal' | 'agents' | 'mcp' | 'collab' | 'plugins' | 'profiler' | 'pro' | 'copilot'>('editor');
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    onAppReady((payload: unknown) => {
      setState((prev) => ({ ...prev }));
    });

    fetchBlockTypes().then((result) => {
      if (result.success) {
        setState((prev) => ({ ...prev, blockTypes: result.blockTypes }));
      }
    });
  }, []);

  const handleOpenFile = (filePath: string) => {
    setState((prev) => {
      const openFiles = prev.openFiles.includes(filePath) ? prev.openFiles : [...prev.openFiles, filePath];
      return { ...prev, activeFile: filePath, openFiles };
    });
    setShowWelcome(false);
  };

  const handleCloseFile = (filePath: string) => {
    setState((prev) => ({
      ...prev,
      openFiles: prev.openFiles.filter((f) => f !== filePath),
      activeFile: prev.activeFile === filePath ? null : prev.activeFile,
    }));
  };

  const handleRunAgent = async (agentId: string, config: Record<string, unknown>) => {
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
  };

  const handleUpdateCollabSession = (session: SHAMState['collab']['session']) => {
    setState((prev) => ({ ...prev, collab: { ...prev.collab, session } }));
  };

  const handleAppendCollabOutput = (lines: string[]) => {
    setState((prev) => ({ ...prev, collab: { ...prev.collab, output: [...prev.collab.output, ...lines] } }));
  };

  const handleUpdatePlugins = (plugins: SHAMState['plugins']['plugins']) => {
    setState((prev) => ({ ...prev, plugins: { ...prev.plugins, plugins } }));
  };

  const handleAppendPluginOutput = (lines: string[]) => {
    setState((prev) => ({ ...prev, plugins: { ...prev.plugins, output: [...prev.plugins.output, ...lines] } }));
  };

  const handleUpdateProfilerTraces = (traces: SHAMState['profiler']['traces']) => {
    setState((prev) => ({ ...prev, profiler: { ...prev.profiler, traces } }));
  };

  const handleAppendProfilerOutput = (lines: string[]) => {
    setState((prev) => ({ ...prev, profiler: { ...prev.profiler, output: [...prev.profiler.output, ...lines] } }));
  };

  const handleUpdateCopilotSuggestions = (suggestions: SHAMState['copilot']['suggestions']) => {
    setState((prev) => ({ ...prev, copilot: { ...prev.copilot, suggestions } }));
  };

  const handleAppendCopilotOutput = (lines: string[]) => {
    setState((prev) => ({ ...prev, copilot: { ...prev.copilot, output: [...prev.copilot.output, ...lines] } }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.bgPrimary, color: theme.textPrimary }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: 36, backgroundColor: theme.headerBackground, borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: theme.accent }}>SHAM</span>
        <span style={{ marginLeft: 8, fontSize: 12, color: theme.textMuted }}>Smart Hosted Agent Manager</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['editor', 'terminal', 'agents', 'mcp', 'collab', 'plugins', 'profiler', 'copilot', 'pro'] as const).map((panel) => (
            <button key={panel} onClick={() => setActivePanel(panel)} style={{ padding: '4px 10px', background: activePanel === panel ? theme.bgSurface : 'transparent', border: 'none', color: activePanel === panel ? theme.textPrimary : theme.textMuted, borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              {panel.charAt(0).toUpperCase() + panel.slice(1)}
            </button>
          ))}
        </div>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar state={state} onOpenFile={handleOpenFile} onCloseFile={handleCloseFile} onSelectAgent={(id) => setState((prev) => ({ ...prev, selectedAgent: id }))} activePanel={activePanel} setActivePanel={setActivePanel} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showWelcome ? (
            <WelcomeScreen onOpenFile={handleOpenFile} />
          ) : activePanel === 'editor' ? (
            <EditorPanel state={state} onValidate={async (content, filePath) => {
              const result = await validateALPFile(content, filePath);
              if (result.success) {
                setState((prev) => ({ ...prev, diagnostics: result.diagnostics }));
              }
            }} />
          ) : activePanel === 'terminal' ? (
            <TerminalPanel output={state.terminalOutput} onAppendOutput={(lines) => setState((prev) => ({ ...prev, terminalOutput: [...prev.terminalOutput, ...lines] }))} />
          ) : activePanel === 'agents' ? (
            <AgentPanel agents={state.agents} onRunAgent={handleRunAgent} />
          ) : activePanel === 'mcp' ? (
            <MCPBrowser tools={state.mcpTools} />
          ) : activePanel === 'collab' ? (
            <CollaborationPanel
              session={state.collab.session}
              output={state.collab.output}
              onUpdateSession={handleUpdateCollabSession}
              onAppendOutput={handleAppendCollabOutput}
            />
          ) : activePanel === 'plugins' ? (
            <PluginPanel
              plugins={state.plugins.plugins}
              output={state.plugins.output}
              onUpdatePlugins={handleUpdatePlugins}
              onAppendOutput={handleAppendPluginOutput}
            />
          ) : activePanel === 'profiler' ? (
            <ProfilerPanel
              traces={state.profiler.traces}
              output={state.profiler.output}
              onUpdateTraces={handleUpdateProfilerTraces}
              onAppendOutput={handleAppendProfilerOutput}
            />
          ) : activePanel === 'copilot' ? (
            <CopilotPanel
              suggestions={state.copilot.suggestions}
              output={state.copilot.output}
              diagnostics={state.diagnostics}
              onUpdateSuggestions={handleUpdateCopilotSuggestions}
              onAppendOutput={handleAppendCopilotOutput}
            />
          ) : (
            <ProPanel />
          )}
        </div>
      </div>
    </div>
  );
}
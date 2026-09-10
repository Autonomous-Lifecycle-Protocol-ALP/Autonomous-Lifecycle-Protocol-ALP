import React from 'react';
import { EditorPanel } from '../components/EditorPanel.js';
import { TerminalPanel } from '../components/TerminalPanel.js';
import { WelcomeScreen } from '../components/WelcomeScreen.js';
import { ProPanel } from '../components/ProPanel.js';
import { PanelSuspense, type PanelId } from './shared.js';

const AgentPanel = React.lazy(() => import('../components/AgentPanel.js').then((m) => ({ default: m.AgentPanel })));
const MCPBrowser = React.lazy(() => import('../components/MCPBrowser.js').then((m) => ({ default: m.MCPBrowser })));
const CollaborationPanel = React.lazy(() => import('../components/CollaborationPanel.js').then((m) => ({ default: m.CollaborationPanel })));
const PluginPanel = React.lazy(() => import('../components/PluginPanel.js').then((m) => ({ default: m.PluginPanel })));
const ProfilerPanel = React.lazy(() => import('../components/ProfilerPanel.js').then((m) => ({ default: m.ProfilerPanel })));
const CopilotPanel = React.lazy(() => import('../components/CopilotPanel.js').then((m) => ({ default: m.CopilotPanel })));
const RefactorPanel = React.lazy(() => import('../components/RefactorPanel.js').then((m) => ({ default: m.RefactorPanel })));
const SettingsPanel = React.lazy(() => import('../components/SettingsPanel.js').then((m) => ({ default: m.SettingsPanel })));
const GitPanel = React.lazy(() => import('../components/GitPanel.js').then((m) => ({ default: m.GitPanel })));
const SearchPanel = React.lazy(() => import('../components/SearchPanel.js').then((m) => ({ default: m.SearchPanel })));
const DebugPanel = React.lazy(() => import('../components/DebugPanel.js').then((m) => ({ default: m.DebugPanel })));
const TestRunnerPanel = React.lazy(() => import('../components/TestRunnerPanel.js').then((m) => ({ default: m.TestRunnerPanel })));
const SwarmMarketplacePanel = React.lazy(() => import('../components/SwarmMarketplacePanel.js').then((m) => ({ default: m.SwarmMarketplacePanel })));
const ZKProofPanel = React.lazy(() => import('../components/ZKProofPanel.js').then((m) => ({ default: m.ZKProofPanel })));
const DAGPartitionPanel = React.lazy(() => import('../components/DAGPartitionPanel.js').then((m) => ({ default: m.DAGPartitionPanel })));
const CRDTCanvasPanel = React.lazy(() => import('../components/CRDTCanvasPanel.js').then((m) => ({ default: m.CRDTCanvasPanel })));
const WasmAstPanel = React.lazy(() => import('../components/WasmAstPanel.js').then((m) => ({ default: m.WasmAstPanel })));
const EdgeDebugPanel = React.lazy(() => import('../components/EdgeDebugPanel.js').then((m) => ({ default: m.EdgeDebugPanel })));
const TelemetryInspectorPanel = React.lazy(() => import('../components/TelemetryInspectorPanel.js').then((m) => ({ default: m.TelemetryInspectorPanel })));
const ChaosEnginePanel = React.lazy(() => import('../components/ChaosEnginePanel.js').then((m) => ({ default: m.ChaosEnginePanel })));
const FeatureFlagPanel = React.lazy(() => import('../components/FeatureFlagPanel.js').then((m) => ({ default: m.FeatureFlagPanel })));
const WorkflowReplayPanel = React.lazy(() => import('../components/WorkflowReplayPanel.js').then((m) => ({ default: m.WorkflowReplayPanel })));
const LocalStoragePanel = React.lazy(() => import('../components/LocalStoragePanel.js').then((m) => ({ default: m.LocalStoragePanel })));
const SelfHealingMeshPanel = React.lazy(() => import('../components/SelfHealingMeshPanel.js').then((m) => ({ default: m.SelfHealingMeshPanel })));
const IntelligencePanel = React.lazy(() => import('../components/IntelligencePanel.js').then((m) => ({ default: m.IntelligencePanel })));
const AutonomyPanel = React.lazy(() => import('../components/AutonomyPanel.js').then((m) => ({ default: m.AutonomyPanel })));
const SynapsePanel = React.lazy(() => import('../components/SynapsePanel.js').then((m) => ({ default: m.SynapsePanel })));
const MultiModalPanel = React.lazy(() => import('../components/MultiModalPanel.js').then((m) => ({ default: m.MultiModalPanel })));

interface PanelRouterProps {
  activePanel: PanelId;
  showWelcome: boolean;
  state: ReturnType<typeof import('../shared/types.js').SHAMState>;
  onOpenFile: (filePath: string) => void;
  onValidate: (content: string, filePath: string) => Promise<void>;
  onCursorChange: (position: { line: number; column: number }) => Promise<void>;
  onRunAgent: (agentId: string, config: Record<string, unknown>) => Promise<void>;
  onUpdateCollabSession: (session: ReturnType<typeof import('../shared/types.js').SHAMState>['collab']['session']) => void;
  onAppendCollabOutput: (lines: string[]) => void;
  onUpdateCollabPresence: (presence: ReturnType<typeof import('../shared/types.js').SHAMState>['collab']['presence']) => void;
  onUpdatePlugins: (plugins: ReturnType<typeof import('../shared/types.js').SHAMState>['plugins']['plugins']) => void;
  onAppendPluginOutput: (lines: string[]) => void;
  onUpdateProfilerTraces: (traces: ReturnType<typeof import('../shared/types.js').SHAMState>['profiler']['traces']) => void;
  onAppendProfilerOutput: (lines: string[]) => void;
  onUpdateCopilotSuggestions: (suggestions: ReturnType<typeof import('../shared/types.js').SHAMState>['copilot']['suggestions']) => void;
  onAppendCopilotOutput: (lines: string[]) => void;
  onUpdateRefactorRenames: (renames: ReturnType<typeof import('../shared/types.js').SHAMState>['refactor']['renames']) => void;
  onAppendRefactorOutput: (lines: string[]) => void;
  onAppendDebugOutput: (lines: string[]) => void;
  onStartDebug: (filePath: string) => void;
  onStopDebug: () => void;
  onToggleBreakpoint: (line: number | string) => void;
  onRunTests: (suiteIds: string[]) => Promise<void>;
  onAppendTestOutput: (lines: string[]) => void;
  onUpdateIntelligenceState: (s: ReturnType<typeof import('../shared/types.js').SHAMState>['intelligence']) => void;
  onAppendIntelligenceOutput: (lines: string[]) => void;
  onUpdateAutonomyState: (s: ReturnType<typeof import('../shared/types.js').SHAMState>['autonomy']) => void;
  onAppendAutonomyOutput: (lines: string[]) => void;
}

export function PanelRouter(props: PanelRouterProps) {
  const {
    activePanel,
    showWelcome,
    state,
    onOpenFile,
    onValidate,
    onCursorChange,
    onRunAgent,
    onUpdateCollabSession,
    onAppendCollabOutput,
    onUpdateCollabPresence,
    onUpdatePlugins,
    onAppendPluginOutput,
    onUpdateProfilerTraces,
    onAppendProfilerOutput,
    onUpdateCopilotSuggestions,
    onAppendCopilotOutput,
    onUpdateRefactorRenames,
    onAppendRefactorOutput,
    onAppendDebugOutput,
    onStartDebug,
    onStopDebug,
    onToggleBreakpoint,
    onRunTests,
    onAppendTestOutput,
    onUpdateIntelligenceState,
    onAppendIntelligenceOutput,
    onUpdateAutonomyState,
    onAppendAutonomyOutput,
  } = props;

  if (showWelcome) {
    return <WelcomeScreen onOpenFile={onOpenFile} />;
  }

  switch (activePanel) {
    case 'editor':
      return (
        <EditorPanel
          state={state}
          onValidate={onValidate}
          onCursorChange={onCursorChange}
        />
      );
    case 'terminal':
      return (
        <TerminalPanel
          output={state.terminalOutput}
          onAppendOutput={(lines) => state.setState?.((prev: ReturnType<typeof import('../shared/types.js').SHAMState>) => ({ ...prev, terminalOutput: [...prev.terminalOutput, ...lines] }))}
        />
      );
    case 'agents':
      return <AgentPanel agents={state.agents} onRunAgent={onRunAgent} />;
    case 'synapse':
      return <SynapsePanel parsedObjects={state.parseResult?.objects || null} />;
    case 'multimodal':
      return <MultiModalPanel parsedObjects={state.parseResult?.objects || null} />;
    case 'mcp':
      return <MCPBrowser tools={state.mcpTools} />;
    case 'collab':
      return (
        <PanelSuspense>
          <CollaborationPanel
            session={state.collab.session}
            output={state.collab.output}
            presence={state.collab.presence}
            onUpdateSession={onUpdateCollabSession}
            onAppendOutput={onAppendCollabOutput}
            onUpdatePresence={onUpdateCollabPresence}
          />
        </PanelSuspense>
      );
    case 'plugins':
      return (
        <PanelSuspense>
          <PluginPanel
            plugins={state.plugins.plugins}
            output={state.plugins.output}
            onUpdatePlugins={onUpdatePlugins}
            onAppendOutput={onAppendPluginOutput}
          />
        </PanelSuspense>
      );
    case 'profiler':
      return (
        <PanelSuspense>
          <ProfilerPanel
            traces={state.profiler.traces}
            output={state.profiler.output}
            onUpdateTraces={onUpdateProfilerTraces}
            onAppendOutput={onAppendProfilerOutput}
          />
        </PanelSuspense>
      );
    case 'copilot':
      return (
        <PanelSuspense>
          <CopilotPanel
            suggestions={state.copilot.suggestions}
            output={state.copilot.output}
            diagnostics={state.diagnostics}
            onUpdateSuggestions={onUpdateCopilotSuggestions}
            onAppendOutput={onAppendCopilotOutput}
          />
        </PanelSuspense>
      );
    case 'refactor':
      return (
        <PanelSuspense>
          <RefactorPanel
            renames={state.refactor.renames}
            output={state.refactor.output}
            onUpdateRenames={onUpdateRefactorRenames}
            onAppendOutput={onAppendRefactorOutput}
          />
        </PanelSuspense>
      );
    case 'debugger':
      return (
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
      );
    case 'test-runner':
      return (
        <PanelSuspense>
          <TestRunnerPanel
            suites={state.testRunner.suites}
            output={state.testRunner.output}
            onRunTests={onRunTests}
            onAppendOutput={onAppendTestOutput}
          />
        </PanelSuspense>
      );
    case 'settings':
      return <PanelSuspense><SettingsPanel /></PanelSuspense>;
    case 'git':
      return <PanelSuspense><GitPanel /></PanelSuspense>;
    case 'search':
      return <PanelSuspense><SearchPanel onOpenFile={onOpenFile} /></PanelSuspense>;
    case 'marketplace':
      return <PanelSuspense><SwarmMarketplacePanel /></PanelSuspense>;
    case 'zk':
      return <PanelSuspense><ZKProofPanel /></PanelSuspense>;
    case 'partition':
      return <PanelSuspense><DAGPartitionPanel /></PanelSuspense>;
    case 'crdtCanvas':
      return <PanelSuspense><CRDTCanvasPanel /></PanelSuspense>;
    case 'wasmAst':
      return <PanelSuspense><WasmAstPanel /></PanelSuspense>;
    case 'edgeDebug':
      return <PanelSuspense><EdgeDebugPanel /></PanelSuspense>;
    case 'telemetryInspector':
      return <PanelSuspense><TelemetryInspectorPanel /></PanelSuspense>;
    case 'chaosEngine':
      return <PanelSuspense><ChaosEnginePanel /></PanelSuspense>;
    case 'featureFlags':
      return <PanelSuspense><FeatureFlagPanel /></PanelSuspense>;
    case 'workflowReplay':
      return <PanelSuspense><WorkflowReplayPanel /></PanelSuspense>;
    case 'localStorage':
      return <PanelSuspense><LocalStoragePanel /></PanelSuspense>;
    case 'selfHealingMesh':
      return <PanelSuspense><SelfHealingMeshPanel /></PanelSuspense>;
    case 'intelligence':
      return (
        <PanelSuspense>
          <IntelligencePanel
            state={state.intelligence}
            onUpdateState={onUpdateIntelligenceState}
            onAppendOutput={onAppendIntelligenceOutput}
          />
        </PanelSuspense>
      );
    case 'autonomy':
      return (
        <PanelSuspense>
          <AutonomyPanel
            state={state.autonomy}
            onUpdateState={onUpdateAutonomyState}
            onAppendOutput={onAppendAutonomyOutput}
          />
        </PanelSuspense>
      );
    default:
      return <PanelSuspense><ProPanel /></PanelSuspense>;
  }
}
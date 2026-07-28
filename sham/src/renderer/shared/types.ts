export interface AlpObject {
  _type: string;
  [key: string]: unknown;
}

export interface ALPDiagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ALPAgent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'stopped' | 'error';
  config: Record<string, unknown>;
  lastRun?: string;
}

export interface ALPMCPTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ParseResult {
  objects: AlpObject[];
  warnings: string[];
  filePath: string;
}

export interface SHAMState {
  activeFile: string | null;
  openFiles: string[];
  selectedAgent: string | null;
  terminalOutput: string[];
  diagnostics: ALPDiagnostic[];
  blockTypes: string[];
  agents: ALPAgent[];
  mcpTools: ALPMCPTool[];
  parseResult: ParseResult | null;
  collab: CollabState;
  plugins: PluginState;
  profiler: ProfilerState;
  copilot: CopilotState;
  refactor: RefactorState;
}

export interface LicenseInfo {
  key: string;
  email: string;
  plan: 'free' | 'pro' | 'team';
  activatedAt?: string;
  expiresAt?: string;
}

export interface CloudSyncState {
  enabled: boolean;
  lastSyncAt?: string;
  endpoint?: string;
}

export interface TeamMember {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface TeamState {
  workspaceId: string;
  members: TeamMember[];
}

export interface UpdateStatus {
  available: boolean;
  downloaded?: boolean;
  installing?: boolean;
}

export interface TerminalResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface CollabSession {
  id: string;
  mode: 'host' | 'peer';
  peers: string[];
  status: 'idle' | 'running' | 'error';
  lastSyncAt?: string;
}

export interface CollabPresence {
  peerId: string;
  displayName: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
  lastSeenAt: string;
}

export interface CollabState {
  session: CollabSession | null;
  output: string[];
  presence: CollabPresence[];
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];
  toolPanel?: boolean;
  lspAdapter?: string;
}

export interface Plugin {
  manifest: PluginManifest;
  enabled: boolean;
  loadedAt?: string;
  error?: string;
}

export interface PluginState {
  plugins: Plugin[];
  output: string[];
}

export interface ProfileTrace {
  id: string;
  agentId?: string;
  command?: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: 'running' | 'completed' | 'failed';
  stdout?: string;
  stderr?: string;
  error?: string;
}

export interface ProfilerState {
  traces: ProfileTrace[];
  output: string[];
}

export interface CopilotSuggestion {
  id: string;
  type: 'fix' | 'completion' | 'tip';
  severity?: 'error' | 'warning' | 'info';
  message: string;
  range?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
  insertText?: string;
  diagnostic?: ALPDiagnostic;
}

export interface CopilotState {
  suggestions: CopilotSuggestion[];
  output: string[];
}

export interface RefactorRename {
  id: string;
  oldName: string;
  newName: string;
  kind: 'agent' | 'skill' | 'macro' | 'event' | 'memory' | 'contract' | 'vault' | 'swarm' | 'workflow';
  occurrences: number;
  files: string[];
}

export interface RefactorState {
  renames: RefactorRename[];
  output: string[];
}

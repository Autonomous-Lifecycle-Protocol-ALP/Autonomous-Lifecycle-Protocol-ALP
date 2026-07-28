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

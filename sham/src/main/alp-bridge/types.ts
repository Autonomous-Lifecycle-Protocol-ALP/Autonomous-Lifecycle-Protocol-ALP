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

export interface RefactorRename {
  id: string;
  oldName: string;
  newName: string;
  kind: 'agent' | 'skill' | 'macro' | 'event' | 'memory' | 'contract' | 'vault' | 'swarm' | 'workflow';
  occurrences: number;
  files: string[];
}

export interface RunOptions {
  task?: string;
  agent?: string;
  dryRun?: boolean;
  concurrent?: number;
  provider?: string;
  model?: string;
  swarm?: string;
}

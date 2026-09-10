export interface ServeOptions {
  port?: number;
  host?: string;
  db?: boolean;
  registry?: boolean;
  registryToken?: string;
  registrySignKey?: string;
}

export interface SwarmNodeState {
  node_id: string;
  last_seen: string;
  claim: string | null;
}

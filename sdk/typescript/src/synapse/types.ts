export interface SynapseNode {
  id: string;
  type: string;
  title: string;
  status?: string;
  owner?: string;
  tags: string[];
  inLinks: string[];
  outLinks: string[];
  properties: Record<string, unknown>;
  color: string;
  degree: number;
  group: number;
}

export interface SynapseEdge {
  source: string;
  target: string;
  label: string;
  relation: 'depends_on' | 'assigned_to' | 'guards' | 'implements' | 'references';
}

export interface SynapseTopology {
  nodes: SynapseNode[];
  edges: SynapseEdge[];
  stats: SynapseStats;
}

export interface SynapseStats {
  totalNodes: number;
  totalEdges: number;
  density: number;
  centralHubs: { id: string; degree: number }[];
  orphanNodes: string[];
  brokenLinks: { source: string; target: string }[];
  byTypeCount: Record<string, number>;
  byStatusCount: Record<string, number>;
}

export interface CanvasNodeData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  type: 'text' | 'file' | 'group';
  text?: string;
  file?: string;
  label?: string;
}

export interface CanvasEdgeData {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  toSide?: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  color?: string;
}

export interface SynapseCanvas {
  nodes: CanvasNodeData[];
  edges: CanvasEdgeData[];
}

export interface SynapseVaultFile {
  relativePath: string;
  content: string;
}

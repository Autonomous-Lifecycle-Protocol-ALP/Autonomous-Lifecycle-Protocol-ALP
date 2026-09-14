import { createHash } from 'crypto';

export interface FederationSwarmNode {
  nodeId: string;
  cluster: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  workloadCapacity: number;
  activeTasks: number;
  latencyMs: number;
  lastHeartbeat: string;
}

export interface SelfHealingDiagnostic {
  anomalyId: string;
  sourceNodeId: string;
  errorSignature: string;
  rootCause: string;
  recommendedPatch: string;
  autoRemediated: boolean;
  timestamp: string;
}

export class SwarmFederationMesh {
  private nodes: Map<string, FederationSwarmNode> = new Map();

  registerNode(node: FederationSwarmNode): void {
    this.nodes.set(node.nodeId, node);
  }

  getNode(nodeId: string): FederationSwarmNode | undefined {
    return this.nodes.get(nodeId);
  }

  getActiveNodes(): FederationSwarmNode[] {
    return Array.from(this.nodes.values()).filter(n => n.status === 'ONLINE');
  }

  computeMeshDigest(): string {
    const sortedIds = Array.from(this.nodes.keys()).sort();
    const payload = sortedIds.map(id => {
      const n = this.nodes.get(id)!;
      return `${id}:${n.status}:${n.activeTasks}`;
    }).join('|');
    return createHash('sha256').update(payload).digest('hex');
  }

  electLeader(): FederationSwarmNode | undefined {
    const active = this.getActiveNodes();
    if (active.length === 0) return undefined;
    return active.sort((a, b) => (b.workloadCapacity - b.activeTasks) - (a.workloadCapacity - a.activeTasks))[0];
  }
}

export class MeshSelfHealingEngine {
  private diagnostics: SelfHealingDiagnostic[] = [];

  analyzeErrorTrace(anomalyId: string, nodeId: string, traceText: string): SelfHealingDiagnostic {
    let rootCause = 'Transient resource contention';
    let recommendedPatch = 'Auto-retry task with backoff & reallocation';

    if (traceText.includes('ENOTFOUND') || traceText.includes('ECONNREFUSED')) {
      rootCause = 'Network partition / endpoint unreachable';
      recommendedPatch = 'Reroute to fallback node in secondary cluster region';
    } else if (traceText.includes('policy') || traceText.includes('denied')) {
      rootCause = 'Strict policy security constraint enforcement';
      recommendedPatch = 'Trigger automated HITL checkpoint approval request';
    }

    const diag: SelfHealingDiagnostic = {
      anomalyId,
      sourceNodeId: nodeId,
      errorSignature: createHash('sha256').update(traceText).digest('hex').substring(0, 16),
      rootCause,
      recommendedPatch,
      autoRemediated: true,
      timestamp: new Date().toISOString(),
    };

    this.diagnostics.push(diag);
    return diag;
  }

  getDiagnostics(): SelfHealingDiagnostic[] {
    return this.diagnostics;
  }
}

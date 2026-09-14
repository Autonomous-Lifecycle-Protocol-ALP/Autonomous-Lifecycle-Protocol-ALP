/**
 * Autonomous Lifecycle Protocol (ALP) - V86.0.0
 * Swarm Neuromorphic Reasoning Mesh & Adaptive Synapse Optimizer
 */

export interface NeuromorphicNode {
  id: string;
  label: string;
  threshold: number; // Potential threshold to fire spike
  membranePotential: number;
  synapticWeights: Record<string, number>; // targetNodeId -> weight
  lastSpikeTs?: number;
}

export interface SpikeImpulse {
  sourceNodeId: string;
  targetNodeId: string;
  amplitude: number;
  timestamp: string;
}

export interface NeuromorphicMeshState {
  version: string;
  activeNodes: number;
  totalSpikesProcessed: number;
  averageSynapseWeight: number;
  nodes: NeuromorphicNode[];
}

export class NeuromorphicSpikeMesh {
  private nodes: Map<string, NeuromorphicNode> = new Map();
  private totalSpikes = 0;

  constructor() {
    this.initializeDefaultMesh();
  }

  private initializeDefaultMesh(): void {
    const defaultNodes: NeuromorphicNode[] = [
      { id: "node_sensory_0", label: "Spec Parser Sensory Node", threshold: 1.0, membranePotential: 0.2, synapticWeights: { node_cortex_1: 0.85, node_cortex_2: 0.60 } },
      { id: "node_cortex_1", label: "Merkle Trace Reasoning Core", threshold: 1.5, membranePotential: 0.5, synapticWeights: { node_motor_3: 0.90 } },
      { id: "node_cortex_2", label: "Zero-Knowledge Policy Verifier", threshold: 1.2, membranePotential: 0.3, synapticWeights: { node_motor_3: 0.75 } },
      { id: "node_motor_3", label: "Swarm Motor Execution Motor", threshold: 2.0, membranePotential: 0.8, synapticWeights: {} },
    ];

    defaultNodes.forEach((node) => this.nodes.set(node.id, node));
  }

  public getMeshState(): NeuromorphicMeshState {
    const nodeList = Array.from(this.nodes.values());
    let totalWeight = 0;
    let weightCount = 0;

    nodeList.forEach((n) => {
      Object.values(n.synapticWeights).forEach((w) => {
        totalWeight += w;
        weightCount++;
      });
    });

    return {
      version: "v86.0.0-neuromorphic",
      activeNodes: this.nodes.size,
      totalSpikesProcessed: this.totalSpikes,
      averageSynapseWeight: weightCount > 0 ? parseFloat((totalWeight / weightCount).toFixed(3)) : 0,
      nodes: nodeList,
    };
  }

  public propagateSpike(sourceId: string, amplitude: number): { firedSpikes: SpikeImpulse[]; updatedNodes: NeuromorphicNode[] } {
    const sourceNode = this.nodes.get(sourceId);
    if (!sourceNode) throw new Error(`Source node '${sourceId}' not found in neuromorphic mesh`);

    const firedSpikes: SpikeImpulse[] = [];
    sourceNode.membranePotential += amplitude;
    sourceNode.lastSpikeTs = Date.now();

    if (sourceNode.membranePotential >= sourceNode.threshold) {
      // Trigger spike cascade across synapses
      sourceNode.membranePotential = 0.0; // Reset after firing
      this.totalSpikes++;

      Object.entries(sourceNode.synapticWeights).forEach(([targetId, weight]) => {
        const targetNode = this.nodes.get(targetId);
        if (targetNode) {
          const impulseAmp = parseFloat((amplitude * weight).toFixed(2));
          targetNode.membranePotential += impulseAmp;
          firedSpikes.push({
            sourceNodeId: sourceId,
            targetNodeId: targetId,
            amplitude: impulseAmp,
            timestamp: new Date().toISOString(),
          });

          // STDP Synaptic Plasticity - strengthen active synapse
          sourceNode.synapticWeights[targetId] = Math.min(1.0, parseFloat((weight + 0.02).toFixed(3)));
        }
      });
    }

    return {
      firedSpikes,
      updatedNodes: Array.from(this.nodes.values()),
    };
  }

  public tuneSynapseWeight(sourceId: string, targetId: string, newWeight: number): NeuromorphicNode {
    const source = this.nodes.get(sourceId);
    if (!source) throw new Error(`Source node '${sourceId}' not found`);
    source.synapticWeights[targetId] = Math.max(0.0, Math.min(1.0, newWeight));
    return source;
  }
}

export class AdaptiveSynapseOptimizer {
  public static optimizeMeshTopology(meshState: NeuromorphicMeshState): { prunedSynapses: number; strengthenedSynapses: number } {
    let pruned = 0;
    let strengthened = 0;

    meshState.nodes.forEach((node) => {
      Object.entries(node.synapticWeights).forEach(([targetId, weight]) => {
        if (weight < 0.1) {
          delete node.synapticWeights[targetId];
          pruned++;
        } else if (weight >= 0.8) {
          strengthened++;
        }
      });
    });

    return { prunedSynapses: pruned, strengthenedSynapses: strengthened };
  }
}

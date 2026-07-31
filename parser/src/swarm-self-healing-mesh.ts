/**
 * SwarmSelfHealingMesh — v60.0.0 Autonomous Swarm Self-Healing Mesh
 *
 * Automated failure detection, peer node failover routing, self-healing plan
 * synthesis, and adaptive load redistribution across distributed swarm clusters.
 */

export interface SwarmNodeHealth {
  nodeId: string;
  region: string;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  activeTasks: string[];
  lastHeartbeat: string;
}

export interface TaskReroute {
  taskId: string;
  fromNode: string;
  toNode: string;
  reason: string;
}

export interface SelfHealingPlan {
  planId: string;
  failedNodes: string[];
  healthyNodes: string[];
  taskReroutes: TaskReroute[];
  healedAt: string;
}

export class SwarmSelfHealingMesh {
  private nodes: Map<string, SwarmNodeHealth> = new Map();

  /**
   * Register or update node health in the swarm roster.
   */
  public registerNode(nodeId: string, region: string, status: 'HEALTHY' | 'DEGRADED' | 'FAILED' = 'HEALTHY', activeTasks: string[] = []): SwarmNodeHealth {
    const health: SwarmNodeHealth = {
      nodeId,
      region,
      status,
      activeTasks: [...activeTasks],
      lastHeartbeat: new Date().toISOString(),
    };
    this.nodes.set(nodeId, health);
    return health;
  }

  /**
   * Detect failed or degraded nodes in the swarm.
   */
  public detectFailures(): SwarmNodeHealth[] {
    return Array.from(this.nodes.values()).filter(n => n.status === 'FAILED' || n.status === 'DEGRADED');
  }

  /**
   * Synthesize an automated self-healing failover plan.
   */
  public generateSelfHealingPlan(): SelfHealingPlan {
    const all = Array.from(this.nodes.values());
    const failedNodes = all.filter(n => n.status === 'FAILED').map(n => n.nodeId);
    const healthyNodes = all.filter(n => n.status === 'HEALTHY').map(n => n.nodeId);

    const taskReroutes: TaskReroute[] = [];

    if (healthyNodes.length > 0) {
      let targetIdx = 0;
      for (const failedId of failedNodes) {
        const node = this.nodes.get(failedId);
        if (!node) continue;

        for (const taskId of node.activeTasks) {
          const targetNode = healthyNodes[targetIdx % healthyNodes.length];
          taskReroutes.push({
            taskId,
            fromNode: failedId,
            toNode: targetNode,
            reason: 'Automated Node Failover',
          });

          // Reassign task to healthy node in memory
          const healthyObj = this.nodes.get(targetNode);
          if (healthyObj && !healthyObj.activeTasks.includes(taskId)) {
            healthyObj.activeTasks.push(taskId);
          }
          targetIdx++;
        }
        // Clear tasks from failed node
        node.activeTasks = [];
      }
    }

    return {
      planId: `heal-plan-${Date.now()}`,
      failedNodes,
      healthyNodes,
      taskReroutes,
      healedAt: new Date().toISOString(),
    };
  }

  public getNode(nodeId: string): SwarmNodeHealth | undefined {
    return this.nodes.get(nodeId);
  }
}

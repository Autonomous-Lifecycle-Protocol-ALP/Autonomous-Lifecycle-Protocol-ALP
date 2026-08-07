export interface AgentNode {
  nodeId: string;
  address: string;
  capabilities: string[];
  status: "online" | "offline" | "busy";
  lastSeen: string;
  metadata?: Record<string, unknown>;
}

export interface DistributedTask {
  taskId: string;
  assignedNode?: string;
  payload: Record<string, unknown>;
  status: "pending" | "dispatched" | "running" | "completed" | "failed";
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistributedAgentNetworkOptions {
  maxNodes?: number;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
}

export interface TaskResultCallback {
  (task: DistributedTask): Promise<void> | void;
}

export interface NodeTransport {
  send(node: AgentNode, path: string, payload: unknown): Promise<unknown>;
  ping(node: AgentNode): Promise<boolean>;
}

export class DistributedAgentNetwork {
  private readonly nodes = new Map<string, AgentNode>();
  private readonly tasks = new Map<string, DistributedTask>();
  private readonly maxNodes: number;
  private readonly heartbeatIntervalMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly transport: NodeTransport;
  private readonly taskResultCallbacks = new Map<string, TaskResultCallback[]>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: DistributedAgentNetworkOptions = {}, transport?: NodeTransport) {
    this.maxNodes = options.maxNodes ?? 50;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30000;
    this.heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? 60000;
    this.transport = transport ?? new DefaultHttpTransport();
  }

  registerNode(node: AgentNode): void {
    if (this.nodes.size >= this.maxNodes) {
      throw new Error("Maximum node count reached");
    }
    this.nodes.set(node.nodeId, {
      ...node,
      lastSeen: node.lastSeen ?? new Date().toISOString(),
    });
  }

  unregisterNode(nodeId: string): boolean {
    return this.nodes.delete(nodeId);
  }

  getNode(nodeId: string): AgentNode | undefined {
    return this.nodes.get(nodeId);
  }

  listNodes(): AgentNode[] {
    return Array.from(this.nodes.values());
  }

  listOnlineNodes(): AgentNode[] {
    return this.listNodes().filter((n) => n.status === "online");
  }

  dispatchTask(task: DistributedTask): DistributedTask | undefined {
    const candidate = this.selectNodeForTask(task);
    if (!candidate) return undefined;

    task.assignedNode = candidate.nodeId;
    task.status = "dispatched";
    task.updatedAt = new Date().toISOString();
    this.tasks.set(task.taskId, task);
    return task;
  }

  async runTask(taskId: string): Promise<DistributedTask | undefined> {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedNode) return task;

    const node = this.nodes.get(task.assignedNode);
    if (!node) {
      task.status = "failed";
      task.error = "Assigned node not found";
      task.updatedAt = new Date().toISOString();
      return task;
    }

    task.status = "running";
    task.updatedAt = new Date().toISOString();

    try {
      const result = await this.transport.send(node, "/tasks/execute", task.payload);
      task.status = "completed";
      task.result = result;
      task.updatedAt = new Date().toISOString();

      const callbacks = this.taskResultCallbacks.get(taskId) ?? [];
      for (const callback of callbacks) {
        try {
          await callback(task);
        } catch {
          // ignore callback errors
        }
      }
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : String(error);
      task.updatedAt = new Date().toISOString();
    }

    return task;
  }

  getTask(taskId: string): DistributedTask | undefined {
    return this.tasks.get(taskId);
  }

  onTaskResult(taskId: string, callback: TaskResultCallback): void {
    const callbacks = this.taskResultCallbacks.get(taskId) ?? [];
    callbacks.push(callback);
    this.taskResultCallbacks.set(taskId, callbacks);
  }

  removeTaskResultCallback(taskId: string, callback: TaskResultCallback): void {
    const callbacks = this.taskResultCallbacks.get(taskId) ?? [];
    const index = callbacks.indexOf(callback);
    if (index >= 0) {
      callbacks.splice(index, 1);
    }
    if (callbacks.length === 0) {
      this.taskResultCallbacks.delete(taskId);
    }
  }

  async heartbeat(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const alive = await this.transport.ping(node);
    if (alive) {
      node.lastSeen = new Date().toISOString();
      node.status = "online";
      return true;
    }

    node.status = "offline";
    return false;
  }

  startHeartbeatLoop(): void {
    this.stopHeartbeatLoop();
    this.heartbeatTimer = setInterval(() => {
      this.pruneStaleNodes();
    }, this.heartbeatIntervalMs);
  }

  stopHeartbeatLoop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private selectNodeForTask(task: DistributedTask): AgentNode | undefined {
    const required = (task.payload.capabilities as string[] | undefined) ?? [];
    const online = this.listOnlineNodes();
    if (online.length === 0) return undefined;

    const scored = online.map((node) => ({
      node,
      score: this.scoreNode(node, required),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].node : online[0];
  }

  private scoreNode(node: AgentNode, requiredCapabilities: string[]): number {
    if (requiredCapabilities.length === 0) return 1;
    const matched = requiredCapabilities.filter((cap) => node.capabilities.includes(cap)).length;
    return matched / requiredCapabilities.length;
  }

  private pruneStaleNodes(): void {
    const cutoff = Date.now() - this.heartbeatTimeoutMs;
    for (const [nodeId, node] of this.nodes) {
      const lastSeen = new Date(node.lastSeen).getTime();
      if (lastSeen < cutoff && node.status === "online") {
        node.status = "offline";
      }
    }
  }
}

class DefaultHttpTransport implements NodeTransport {
  async send(node: AgentNode, path: string, payload: unknown): Promise<unknown> {
    const body = JSON.stringify(payload);
    const url = new URL(path, node.address);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Node-Id": node.nodeId,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Node ${node.nodeId} responded with ${response.status}`);
    }

    return response.json();
  }

  async ping(node: AgentNode): Promise<boolean> {
    try {
      const url = new URL("/health", node.address);
      const response = await fetch(url.toString(), { method: "GET", signal: AbortSignal.timeout(5000) });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * LiveStateClient — v80.0.0 Real-Time Swarm Digital Twin
 *
 * Connects to an `alp serve` state server over HTTP/SSE and provides:
 * - Live workspace state snapshots (tasks, agents, status counts)
 * - Real-time event streaming via Server-Sent Events
 * - Agent heartbeat monitoring with stale detection
 * - Token throughput metering and cost tracking
 * - Dependency graph topology streaming
 */

export interface SwarmState {
  project: string | null;
  totalTasks: number;
  statusCount: Record<string, number>;
  agents: string[];
  activeLocks: string[];
  recentEvents: RuntimeEvent[];
  tasks: { id: string; status: string; owner: string | null }[];
}

export interface RuntimeEvent {
  timestamp: string;
  type: string;
  task_id?: string;
  agent_id?: string;
  status?: string;
  message?: string;
  tokens_used?: number;
  cost_usd?: number;
  [key: string]: unknown;
}

export interface AgentHeartbeat {
  agentId: string;
  lastSeen: number;
  currentTask: string | null;
  totalTokens: number;
  totalCostUsd: number;
  isStale: boolean;
}

export interface ThroughputMeter {
  windowMs: number;
  tokensInWindow: number;
  eventsInWindow: number;
  costInWindow: number;
  tokensPerSecond: number;
}

export type LiveStateEventType =
  | 'connected'
  | 'disconnected'
  | 'state'
  | 'event'
  | 'heartbeat'
  | 'throughput'
  | 'error';

export interface LiveStateEvent {
  type: LiveStateEventType;
  data?: unknown;
  timestamp: number;
}

type LiveStateListener = (event: LiveStateEvent) => void;

export class LiveStateClient {
  private baseUrl: string;
  private listeners: Map<LiveStateEventType | '*', Set<LiveStateListener>> = new Map();
  private connected = false;
  private eventSource: EventSource | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeats: Map<string, AgentHeartbeat> = new Map();
  private recentEvents: RuntimeEvent[] = [];
  private throughputWindowMs = 60_000;
  private staleThresholdMs = 30_000;

  constructor(serverUrl = 'http://localhost:4000') {
    this.baseUrl = serverUrl.replace(/\/$/, '');
  }

  /**
   * Connect to the state server and begin streaming events.
   * Supports both SSE (browser/Node 18+) and polling fallback.
   */
  public async connect(): Promise<void> {
    try {
      // Test connectivity
      const state = await this.fetchState();
      this.emit({ type: 'connected', data: state, timestamp: Date.now() });
      this.connected = true;

      // Try SSE if EventSource is available (browser or Node 18+)
      if (typeof EventSource !== 'undefined') {
        this.startSSE();
      } else {
        // Polling fallback for older Node environments
        this.startPolling();
      }
    } catch (err) {
      this.emit({ type: 'error', data: err, timestamp: Date.now() });
      throw err;
    }
  }

  /**
   * Disconnect from the state server.
   */
  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.connected = false;
    this.emit({ type: 'disconnected', timestamp: Date.now() });
  }

  /**
   * Fetch the current workspace state snapshot.
   */
  public async fetchState(): Promise<SwarmState> {
    const res = await fetch(`${this.baseUrl}/state`);
    if (!res.ok) throw new Error(`State fetch failed: ${res.status}`);
    return res.json();
  }

  /**
   * Fetch the dependency graph topology.
   */
  public async fetchGraph(): Promise<{ nodes: any[]; edges: any[] }> {
    const res = await fetch(`${this.baseUrl}/graph`);
    if (!res.ok) throw new Error(`Graph fetch failed: ${res.status}`);
    return res.json();
  }

  /**
   * Fetch runtime analytics (requires --db flag on serve).
   */
  public async fetchAnalytics(): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.baseUrl}/analytics`);
    if (!res.ok) throw new Error(`Analytics fetch failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get all tracked agent heartbeats.
   */
  public getHeartbeats(): AgentHeartbeat[] {
    const now = Date.now();
    for (const hb of this.heartbeats.values()) {
      hb.isStale = now - hb.lastSeen > this.staleThresholdMs;
    }
    return Array.from(this.heartbeats.values());
  }

  /**
   * Get current throughput metrics.
   */
  public getThroughput(): ThroughputMeter {
    const now = Date.now();
    const windowStart = now - this.throughputWindowMs;
    const windowEvents = this.recentEvents.filter(
      (e) => Date.parse(e.timestamp) >= windowStart
    );

    const tokensInWindow = windowEvents.reduce((sum, e) => sum + (e.tokens_used || 0), 0);
    const costInWindow = windowEvents.reduce((sum, e) => sum + (e.cost_usd || 0), 0);

    return {
      windowMs: this.throughputWindowMs,
      tokensInWindow,
      eventsInWindow: windowEvents.length,
      costInWindow,
      tokensPerSecond: tokensInWindow / (this.throughputWindowMs / 1000),
    };
  }

  /**
   * Subscribe to events.
   */
  public on(type: LiveStateEventType | '*', listener: LiveStateListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
    return () => this.listeners.get(type)?.delete(listener);
  }

  /**
   * Configure thresholds.
   */
  public configure(options: {
    staleThresholdMs?: number;
    throughputWindowMs?: number;
  }): void {
    if (options.staleThresholdMs) this.staleThresholdMs = options.staleThresholdMs;
    if (options.throughputWindowMs) this.throughputWindowMs = options.throughputWindowMs;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  // ── Private ───────────────────────────────────────────────────────────

  private startSSE(): void {
    this.eventSource = new EventSource(`${this.baseUrl}/events`);
    this.eventSource.onmessage = (msg) => {
      try {
        const event: RuntimeEvent = JSON.parse(msg.data);
        this.processEvent(event);
      } catch {
        // skip malformed
      }
    };
    this.eventSource.onerror = () => {
      this.emit({ type: 'error', data: 'SSE connection lost', timestamp: Date.now() });
    };
  }

  private startPolling(intervalMs = 2000): void {
    this.pollInterval = setInterval(async () => {
      try {
        const state = await this.fetchState();
        this.emit({ type: 'state', data: state, timestamp: Date.now() });
      } catch {
        // best-effort
      }
    }, intervalMs);
  }

  private processEvent(event: RuntimeEvent): void {
    // Track in recent events window
    this.recentEvents.push(event);
    const cutoff = Date.now() - this.throughputWindowMs * 2;
    this.recentEvents = this.recentEvents.filter(
      (e) => Date.parse(e.timestamp) >= cutoff
    );

    // Update agent heartbeat
    if (event.agent_id) {
      const existing = this.heartbeats.get(event.agent_id) || {
        agentId: event.agent_id,
        lastSeen: 0,
        currentTask: null,
        totalTokens: 0,
        totalCostUsd: 0,
        isStale: false,
      };
      existing.lastSeen = Date.now();
      existing.currentTask = event.task_id || existing.currentTask;
      existing.totalTokens += event.tokens_used || 0;
      existing.totalCostUsd += event.cost_usd || 0;
      existing.isStale = false;
      this.heartbeats.set(event.agent_id, existing);
    }

    // Emit typed events
    this.emit({ type: 'event', data: event, timestamp: Date.now() });
    this.emit({ type: 'heartbeat', data: this.getHeartbeats(), timestamp: Date.now() });
    this.emit({ type: 'throughput', data: this.getThroughput(), timestamp: Date.now() });
  }

  private emit(event: LiveStateEvent): void {
    const specific = this.listeners.get(event.type);
    if (specific) {
      for (const fn of specific) fn(event);
    }
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      for (const fn of wildcard) fn(event);
    }
  }
}

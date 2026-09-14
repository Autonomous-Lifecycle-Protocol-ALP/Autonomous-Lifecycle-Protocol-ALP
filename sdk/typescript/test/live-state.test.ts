import { describe, it, expect, vi } from 'vitest';
import { LiveStateClient, SwarmState, RuntimeEvent, AgentHeartbeat, ThroughputMeter } from '../src/live-state';

describe('LiveStateClient', () => {
  it('constructor normalizes trailing slash', () => {
    const client = new LiveStateClient('http://localhost:4000/');
    expect((client as any).baseUrl).toBe('http://localhost:4000');
  });

  it('connect emits connected and starts SSE when EventSource available', async () => {
    const mockState: SwarmState = { project: 'test', totalTasks: 1, statusCount: {}, agents: [], activeLocks: [], recentEvents: [], tasks: [] };
    (global as any).EventSource = class {
      onmessage: ((ev: any) => void) | null = null;
      onerror: (() => void) | null = null;
      close() {}
    };
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: () => Promise.resolve(mockState) } as any);

    const client = new LiveStateClient('http://localhost:4000');
    const events: any[] = [];
    client.on('connected', (e) => events.push(e));
    await client.connect();

    expect(client.isConnected()).toBe(true);
    expect(events.some(e => e.type === 'connected')).toBe(true);
  });

  it('connect emits error when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('fail'));
    const client = new LiveStateClient('http://localhost:4000');
    const events: any[] = [];
    client.on('error', (e) => events.push(e));
    await expect(client.connect()).rejects.toThrow('fail');
    expect(events.some(e => e.type === 'error')).toBe(true);
  });

  it('disconnect closes SSE and clears polling', async () => {
    const mockState: SwarmState = { project: 'test', totalTasks: 1, statusCount: {}, agents: [], activeLocks: [], recentEvents: [], tasks: [] };
    (global as any).EventSource = class {
      onmessage: ((ev: any) => void) | null = null;
      onerror: (() => void) | null = null;
      close() {}
    };
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: () => Promise.resolve(mockState) } as any);

    const client = new LiveStateClient('http://localhost:4000');
    await client.connect();
    const events: any[] = [];
    client.on('disconnected', (e) => events.push(e));
    client.disconnect();

    expect(client.isConnected()).toBe(false);
    expect(events.some(e => e.type === 'disconnected')).toBe(true);
  });

  it('fetchState throws on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as any);
    const client = new LiveStateClient('http://localhost:4000');
    await expect(client.fetchState()).rejects.toThrow('State fetch failed: 500');
  });

  it('fetchGraph throws on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as any);
    const client = new LiveStateClient('http://localhost:4000');
    await expect(client.fetchGraph()).rejects.toThrow('Graph fetch failed: 500');
  });

  it('fetchAnalytics throws on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as any);
    const client = new LiveStateClient('http://localhost:4000');
    await expect(client.fetchAnalytics()).rejects.toThrow('Analytics fetch failed: 500');
  });

  it('getHeartbeats marks stale agents', () => {
    const client = new LiveStateClient('http://localhost:4000');
    (client as any).heartbeats.set('agent-1', {
      agentId: 'agent-1',
      lastSeen: Date.now() - 60_000,
      currentTask: null,
      totalTokens: 0,
      totalCostUsd: 0,
      isStale: false,
    });
    const heartbeats = client.getHeartbeats();
    expect(heartbeats[0].isStale).toBe(true);
  });

  it('getThroughput calculates windowed metrics', () => {
    const client = new LiveStateClient('http://localhost:4000');
    // Directly set recentEvents within the throughput window
    (client as any).recentEvents = [
      { timestamp: new Date(Date.now() - 10_000).toISOString(), tokens_used: 100, cost_usd: 0.5, type: 'test' },
      { timestamp: new Date(Date.now() - 20_000).toISOString(), tokens_used: 200, cost_usd: 1.0, type: 'test' },
    ];
    const throughput = client.getThroughput();
    expect(throughput.tokensInWindow).toBe(300);
    expect(throughput.costInWindow).toBeCloseTo(1.5);
    expect(throughput.eventsInWindow).toBe(2);
    expect(throughput.tokensPerSecond).toBeCloseTo(5, 0);
  });

  it('on registers and unsubscribes listeners', () => {
    const client = new LiveStateClient('http://localhost:4000');
    const fn = vi.fn();
    const unsub = client.on('state', fn);
    expect((client as any).listeners.get('state')?.has(fn)).toBe(true);
    unsub();
    expect((client as any).listeners.get('state')?.has(fn)).toBe(false);
  });

  it('on wildcard listener receives all events', () => {
    const client = new LiveStateClient('http://localhost:4000');
    const fn = vi.fn();
    client.on('*', fn);
    (client as any).emit({ type: 'state', data: {}, timestamp: Date.now() });
    (client as any).emit({ type: 'event', data: {}, timestamp: Date.now() });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('configure updates thresholds', () => {
    const client = new LiveStateClient('http://localhost:4000');
    client.configure({ staleThresholdMs: 60_000, throughputWindowMs: 120_000 });
    expect((client as any).staleThresholdMs).toBe(60_000);
    expect((client as any).throughputWindowMs).toBe(120_000);
  });

  it('processEvent trims recent events and updates heartbeats', () => {
    const client = new LiveStateClient('http://localhost:4000');
    const emitSpy = vi.spyOn(client as any, 'emit');
    const oldEvent: RuntimeEvent = {
      timestamp: new Date(Date.now() - 200_000).toISOString(),
      type: 'test',
      agent_id: 'agent-1',
      tokens_used: 10,
      cost_usd: 0.1,
    };
    (client as any).processEvent(oldEvent);
    expect((client as any).recentEvents).toHaveLength(0); // outside 2x window
    const hb = (client as any).heartbeats.get('agent-1');
    expect(hb).toBeDefined();
    expect(hb.totalTokens).toBe(10);
    expect(hb.totalCostUsd).toBeCloseTo(0.1);
    expect(emitSpy).toHaveBeenCalled();
  });
});

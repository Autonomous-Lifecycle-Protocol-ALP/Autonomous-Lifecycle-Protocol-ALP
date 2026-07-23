import { describe, it, expect } from 'vitest';
import { AlpParser, MemoryMeshEngine } from '../src/index';

function engineFrom() {
  return new MemoryMeshEngine();
}

describe('MemoryMeshEngine (v38.0.0)', () => {
  it('stores and queries a memory node', () => {
    const engine = engineFrom();
    engine.storeMemory('mem-1', 'agent-alpha', 'key-1', 'payload-1', ['nlp']);

    const results = engine.queryMemoryMesh('payload-1');
    expect(results).toHaveLength(1);
    expect(results[0].node.id).toBe('mem-1');
    expect(results[0].node.agentId).toBe('agent-alpha');
    expect(results[0].node.tags).toEqual(['nlp']);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('returns empty results when nothing matches', () => {
    const engine = engineFrom();
    engine.storeMemory('mem-1', 'agent-alpha', 'k', 'content-a');

    expect(engine.queryMemoryMesh('no-match')).toHaveLength(0);
  });

  it('filters by agentId', () => {
    const engine = engineFrom();
    engine.storeMemory('mem-1', 'agent-a', 'k', 'content', []);
    engine.storeMemory('mem-2', 'agent-b', 'k', 'content', []);

    const results = engine.queryMemoryMesh('content', { agentId: 'agent-a' });
    expect(results).toHaveLength(1);
    expect(results[0].node.agentId).toBe('agent-a');
  });

  it('filters by tag', () => {
    const engine = engineFrom();
    engine.storeMemory('mem-1', 'agent-a', 'k', 'content', ['nlp']);
    engine.storeMemory('mem-2', 'agent-a', 'k', 'content', ['vision']);

    const results = engine.queryMemoryMesh('content', { tag: 'nlp' });
    expect(results).toHaveLength(1);
    expect(results[0].node.id).toBe('mem-1');
  });

  it('respects topK', () => {
    const engine = engineFrom();
    engine.storeMemory('m1', 'a', 'k', 'content', []);
    engine.storeMemory('m2', 'a', 'k', 'content', []);
    engine.storeMemory('m3', 'a', 'k', 'content', []);

    expect(engine.queryMemoryMesh('content', { topK: 2 })).toHaveLength(2);
  });

  it('returns results sorted by descending score', () => {
    const engine = engineFrom();
    engine.storeMemory('m1', 'a', 'k', 'a a a', []);
    engine.storeMemory('m2', 'a', 'k', 'a', []);

    const results = engine.queryMemoryMesh('a');
    expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score);
  });

  it('syncs newer nodes and skips stale ones', () => {
    const engine = engineFrom();
    engine.storeMemory('mem-1', 'agent-a', 'k', 'v1');
    // Backdate the stored node's timestamp to simulate an older entry.
    const node = (engine as any).memories.get('mem-1');
    node.timestamp = 1000;
    node.lastAccessed = 1000;

    const incoming = [
      {
        id: 'mem-1',
        agentId: 'agent-b',
        key: 'k',
        content: 'v2',
        tags: [],
        timestamp: 2000,
        accessCount: 1,
        lastAccessed: 2000,
      },
    ];

    const synced = engine.syncNodeMemories('agent-b', incoming);
    expect(synced).toBe(1);
    const updated = (engine as any).memories.get('mem-1');
    expect(updated.agentId).toBe('agent-b');
    expect(updated.content).toBe('v2');
  });

  it('skips older nodes during sync', () => {
    const engine = engineFrom();
    engine.storeMemory('mem-1', 'agent-a', 'k', 'v2');
    const node = (engine as any).memories.get('mem-1');
    node.timestamp = 2000;
    node.lastAccessed = 2000;

    const incoming = [
      {
        id: 'mem-1',
        agentId: 'agent-b',
        key: 'k',
        content: 'v1',
        tags: [],
        timestamp: 1000,
        accessCount: 1,
        lastAccessed: 1000,
      },
    ];

    const synced = engine.syncNodeMemories('agent-b', incoming);
    expect(synced).toBe(0);
    const existing = (engine as any).memories.get('mem-1');
    expect(existing.agentId).toBe('agent-a');
  });

  it('returns mesh stats', () => {
    const engine = engineFrom();
    engine.storeMemory('m1', 'a', 'k', 'c', ['nlp']);
    engine.storeMemory('m2', 'b', 'k', 'c', ['nlp', 'vision']);

    const stats = engine.getMeshStats();
    expect(stats.totalMemories).toBe(2);
    expect(stats.activeAgents).toBe(2);
    expect(stats.tagCounts['nlp']).toBe(2);
    expect(stats.tagCounts['vision']).toBe(1);
  });
});

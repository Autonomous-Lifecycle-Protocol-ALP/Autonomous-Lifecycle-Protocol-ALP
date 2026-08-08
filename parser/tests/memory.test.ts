import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore, MemoryGraph, MemoryConsolidator, RAGResult } from '../src/memory';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore('/tmp/alp-memory-test');
  });

  it('stores and retrieves entries', () => {
    const entry = store.store({
      id: 'mem-1',
      type: 'decision',
      key: 'db-choice',
      value: 'postgres',
      scope: 'project',
      importance: 'high',
    });
    expect(entry.id).toBe('mem-1');
    expect(entry.created).toBeDefined();

    const results = store.retrieve({ key: 'db-choice' });
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('postgres');
  });

  it('retrieves by type filter', () => {
    store.store({ id: 'm1', type: 'decision', key: 'k1', value: 'v1', importance: 'high' });
    store.store({ id: 'm2', type: 'error', key: 'k2', value: 'v2', importance: 'high' });

    const decisions = store.retrieve({ type: 'decision' });
    expect(decisions).toHaveLength(1);
    expect(decisions[0].id).toBe('m1');
  });

  it('retrieves by scope filter', () => {
    store.store({ id: 'm1', type: 'decision', key: 'k1', value: 'v1', scope: 'alpha', importance: 'high' });
    store.store({ id: 'm2', type: 'decision', key: 'k2', value: 'v2', scope: 'beta', importance: 'high' });

    const alpha = store.retrieve({ scope: 'alpha' });
    expect(alpha).toHaveLength(1);
  });

  it('updates an existing entry', () => {
    store.store({ id: 'm1', type: 'task', key: 'k1', value: 'old', importance: 'medium' });
    const updated = store.update('m1', 'new');
    expect(updated?.value).toBe('new');
    expect(updated?.updated).toBeDefined();
    expect(updated?.created).toBeDefined();
  });

  it('returns undefined when updating missing id', () => {
    expect(store.update('nonexistent', 'value')).toBeUndefined();
  });

  it('deletes entries', () => {
    store.store({ id: 'm1', type: 'task', key: 'k1', value: 'v1', importance: 'medium' });
    expect(store.size).toBe(1);
    expect(store.delete('m1')).toBe(true);
    expect(store.size).toBe(0);
  });

  it('expires entries past ttl', () => {
    store.store({
      id: 'm1',
      type: 'task',
      key: 'k1',
      value: 'v1',
      importance: 'low',
      ttl: -1,
      created: new Date(Date.now() - 1000).toISOString(),
    });
    expect(store.expire()).toBe(1);
    expect(store.size).toBe(0);
  });

  it('summarizes entries', () => {
    store.store({ id: 'm1', type: 'decision', key: 'k1', value: 'v1', scope: 'p', importance: 'high' });
    store.store({ id: 'm2', type: 'error', key: 'k2', value: 'v2', scope: 'p', importance: 'low' });
    const summary = store.summarize('p');
    expect(summary.total).toBe(2);
    expect(summary.byType.decision).toBe(1);
    expect(summary.byImportance.high).toBe(1);
  });

  it('returns all entries', () => {
    store.store({ id: 'm1', type: 'task', key: 'k1', value: 'v1', importance: 'medium' });
    store.store({ id: 'm2', type: 'task', key: 'k2', value: 'v2', importance: 'medium' });
    expect(store.getAll()).toHaveLength(2);
  });
});

describe('MemoryGraph', () => {
  it('adds nodes and relates them', () => {
    const graph = new MemoryGraph();
    graph.addNode({ id: 'a', type: 'decision', key: 'k1', value: 'v1', importance: 'high', created: '', updated: '' });
    graph.addNode({ id: 'b', type: 'task', key: 'k2', value: 'v2', importance: 'high', created: '', updated: '' });
    graph.relate('a', 'b', 'depends_on', 0.9);
    const neighbors = graph.neighbors('a');
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0].id).toBe('b');
  });

  it('throws when relating missing nodes', () => {
    const graph = new MemoryGraph();
    graph.addNode({ id: 'a', type: 'decision', key: 'k1', value: 'v1', importance: 'high', created: '', updated: '' });
    expect(() => graph.relate('a', 'missing', 'depends_on')).toThrow();
  });
});

describe('MemoryStore RAG', () => {
  it('retrieves relevant entries with citations', () => {
    const store = new MemoryStore('/tmp/alp-memory-rag');
    store.store({ id: 'm1', type: 'decision', key: 'database', value: 'postgres', scope: 'project', importance: 'high' });
    store.store({ id: 'm2', type: 'task', key: 'frontend', value: 'react', scope: 'project', importance: 'medium' });
    const results = store.retrieveRAG('database postgres');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].entry.id).toBe('m1');
    expect(results[0].citation).toContain('project');
  });
});

describe('MemoryConsolidator', () => {
  it('consolidates entries by scope', () => {
    const store = new MemoryStore('/tmp/alp-memory-consolidate');
    store.store({ id: 'm1', type: 'decision', key: 'k1', value: 'v1', scope: 'alpha', importance: 'high' });
    store.store({ id: 'm2', type: 'error', key: 'k2', value: 'v2', scope: 'alpha', importance: 'low' });
    const results = store.consolidate();
    expect(results.length).toBe(1);
    expect(results[0].source_ids).toEqual(['m1', 'm2']);
    expect(results[0].summary).toContain('v1');
  });
});


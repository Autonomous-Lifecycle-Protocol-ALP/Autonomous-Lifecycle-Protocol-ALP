import { describe, it, expect } from 'vitest';
import { CRDTSyncEngine } from '../src/crdt-sync';

describe('CRDTSyncEngine (v21.0.0)', () => {
  it('updates state and increments Lamport clock', () => {
    const engine = new CRDTSyncEngine();
    engine.set('doc-1', 'peer-a', 'status', '[x]', 100);

    const data = engine.readState('doc-1');
    expect(data.status).toBe('[x]');
  });

  it('deterministically merges concurrent updates using LWW semantics', () => {
    const engineA = new CRDTSyncEngine();
    const stateA = engineA.set('doc-1', 'peer-a', 'title', 'Old Title', 100);

    const engineB = new CRDTSyncEngine();
    const stateB = engineB.set('doc-1', 'peer-b', 'title', 'Newer Title', 200);

    const merged = engineA.merge(stateA, stateB);
    const result = engineA.readState('doc-1');

    expect(result.title).toBe('Newer Title');
    expect(merged.clock).toBeGreaterThan(0);
  });

  it('respects tombstones in removeSet', () => {
    const engine = new CRDTSyncEngine();
    engine.set('doc-1', 'peer-a', 'temp_key', 'val', 100);
    engine.remove('doc-1', 'temp_key', 150);

    const data = engine.readState('doc-1');
    expect(data.temp_key).toBeUndefined();
  });

  it('serializes and deserializes CRDT state', () => {
    const engine = new CRDTSyncEngine();
    engine.set('doc-1', 'peer-a', 'title', 'Hello', 100);
    engine.set('doc-1', 'peer-b', 'body', 'World', 150);
    engine.remove('doc-1', 'title', 200);

    const json = engine.toJSON();
    expect(json.states).toHaveLength(1);
    expect(json.states[0].docId).toBe('doc-1');
    expect(json.states[0].clock).toBeGreaterThan(0);

    const restored = new CRDTSyncEngine();
    restored.fromJSON(json);
    expect(restored.readState('doc-1').body).toBe('World');
    expect(restored.readState('doc-1').title).toBeUndefined();
  });
});

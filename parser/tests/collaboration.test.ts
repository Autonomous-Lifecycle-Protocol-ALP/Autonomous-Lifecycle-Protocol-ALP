import { describe, it, expect } from 'vitest';
import { AlpParser, CollaborationEngine } from '../src/index';

function engineFrom() {
  return new CollaborationEngine();
}

describe('CollaborationEngine (v37.0.0)', () => {
  it('creates a session and returns it on duplicate create', () => {
    const engine = engineFrom();
    const first = engine.createSession('doc-1', { title: 'Hello' });
    const second = engine.createSession('doc-1', { title: 'Overridden' });

    expect(first).toBe(second);
    expect(first.state.title).toBe('Hello');
  });

  it('joins and leaves a session', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    const presence = engine.joinSession('doc-1', 'agent-1');
    expect(presence).not.toBeNull();
    expect(presence!.status).toBe('active');
    expect(engine.getPresence('doc-1')).toHaveLength(1);

    expect(engine.leaveSession('doc-1', 'agent-1')).toBe(true);
    expect(engine.getPresence('doc-1')).toHaveLength(0);
  });

  it('returns null when joining a missing session', () => {
    const engine = engineFrom();
    expect(engine.joinSession('missing', 'agent-1')).toBeNull();
  });

  it('applies insert/update/delete operations', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    const ins = engine.applyOperation('doc-1', 'insert', 'title', 'agent-1', 'Hello');
    expect(ins).not.toBeNull();
    expect(ins!.type).toBe('insert');
    expect(engine.getSnapshot('doc-1').title).toBe('Hello');

    const upd = engine.applyOperation('doc-1', 'update', 'title', 'agent-1', 'World');
    expect(upd!.type).toBe('update');
    expect(engine.getSnapshot('doc-1').title).toBe('World');

    const del = engine.applyOperation('doc-1', 'delete', 'title', 'agent-1');
    expect(del!.type).toBe('delete');
    expect(engine.getSnapshot('doc-1').title).toBeUndefined();
  });

  it('returns null when applying to a missing session', () => {
    const engine = engineFrom();
    expect(engine.applyOperation('missing', 'insert', 'x', 'a', 'y')).toBeNull();
  });

  it('tracks operation log and vector clocks', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    engine.applyOperation('doc-1', 'insert', 'a', 'agent-1', '1');
    engine.applyOperation('doc-1', 'update', 'a', 'agent-2', '2');

    const log = engine.getOperationLog('doc-1');
    expect(log).toHaveLength(2);
    expect(log[0].agentId).toBe('agent-1');
    expect(log[1].agentId).toBe('agent-2');
    expect(log[1].vectorClock['agent-1']).toBe(1);
    expect(log[1].vectorClock['agent-2']).toBe(1);
  });

  it('forks a branch and merges it back when main is unchanged', () => {
    const engine = engineFrom();
    engine.createSession('doc-1', { a: '1', b: '2' });

    const branch = engine.fork('doc-1', 'branch-1');
    expect(branch).not.toBeNull();
    expect(branch!.state).toEqual({ a: '1', b: '2' });

    // No main-side edits after fork -> no conflicts, branch state is merged as-is.
    const result = engine.mergeBranch('doc-1', 'branch-1');
    expect(result).not.toBeNull();
    expect(result!.merged).toEqual({ a: '1', b: '2' });
    expect(result!.conflicts).toHaveLength(0);
  });

  it('detects conflicts and applies LWW resolution on merge', () => {
    const engine = engineFrom();
    engine.createSession('doc-1', { title: 'v1' });

    engine.fork('doc-1', 'branch-1');
    engine.applyOperation('doc-1', 'update', 'title', 'agent-1', 'v1-main');

    // Mutate branch snapshot to simulate a diverging edit.
    const branch = (engine as any).sessions.get('doc-1').branches.get('branch-1');
    branch.state.title = 'v1-branch';

    const result = engine.mergeBranch('doc-1', 'branch-1');
    expect(result).not.toBeNull();
    expect(result!.conflicts).toHaveLength(1);
    expect(result!.conflicts[0].path).toBe('title');
    // LWW: branch wins when timestamps are equal.
    expect(result!.merged.title).toBe('v1-branch');
  });

  it('returns null when merging a missing branch', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');
    expect(engine.mergeBranch('doc-1', 'missing')).toBeNull();
  });

  it('returns null when getting a missing session', () => {
    const engine = engineFrom();
    expect(engine.getSession('missing')).toBeUndefined();
  });

  it('assigns distinct colors to different agents', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    const p1 = engine.joinSession('doc-1', 'agent-1');
    const p2 = engine.joinSession('doc-1', 'agent-2');
    expect(p1!.color).not.toBe(p2!.color);
  });

  it('updates presence on applyOperation', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');
    engine.joinSession('doc-1', 'agent-1');

    engine.applyOperation('doc-1', 'insert', 'x', 'agent-1', 'y');

    const [presence] = engine.getPresence('doc-1');
    expect(presence.status).toBe('active');
    expect(presence.cursor).toBe('x');
  });
});

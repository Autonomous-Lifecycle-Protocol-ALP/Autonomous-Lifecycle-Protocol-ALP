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

describe('CollaborationEngine (v43.0.0)', () => {
  it('grants and checks permissions with default open access', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');
    engine.grantPermission('doc-1', 'agent-1', 'edit', 'admin');

    expect(engine.checkPermission('doc-1', 'agent-1', 'edit')).toBe(true);
    expect(engine.checkPermission('doc-1', 'agent-1', 'view')).toBe(true);
    expect(engine.checkPermission('doc-1', 'agent-1', 'admin')).toBe(false);
    expect(engine.checkPermission('doc-1', 'agent-2', 'edit')).toBe(false);
  });

  it('allows edit when no permissions are set (backward compatibility)', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    expect(engine.checkPermission('doc-1', 'any-agent', 'edit')).toBe(true);
    expect(engine.checkPermission('doc-1', 'any-agent', 'view')).toBe(true);
  });

  it('revokes permissions', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');
    engine.grantPermission('doc-1', 'agent-1', 'edit', 'admin');
    expect(engine.revokePermission('doc-1', 'agent-1', 'admin')).toBe(true);
    expect(engine.getPermissions('doc-1')).toHaveLength(0);
    expect(engine.revokePermission('doc-1', 'agent-1', 'admin')).toBe(false);
  });

  it('adds and resolves comments', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    const c1 = engine.addComment('doc-1', 'title', 'agent-1', 'Looks good');
    expect(c1.resolved).toBe(false);
    expect(c1.id).toBeDefined();

    expect(engine.resolveComment(c1.id, 'agent-2')).toBe(true);
    expect(engine.resolveComment(c1.id, 'agent-3')).toBe(false);

    const comments = engine.getComments('doc-1');
    expect(comments).toHaveLength(1);
    expect(comments[0].resolved).toBe(true);
    expect(comments[0].resolvedBy).toBe('agent-2');
  });

  it('creates and manages review threads', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    const thread = engine.createReviewThread('doc-1', 'body', 'agent-1', 'Please review');
    expect(thread.status).toBe('open');
    expect(thread.comments).toHaveLength(1);

    engine.replyToThread(thread.id, 'agent-2', 'Will do');
    expect(engine.getReviewThreads('doc-1')).toHaveLength(1);
    expect(engine.getReviewThreads('doc-1')[0].comments).toHaveLength(2);

    engine.resolveThread(thread.id, 'agent-1');
    expect(engine.getReviewThreads('doc-1')[0].status).toBe('resolved');
  });

  it('logs activity feed events', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');
    engine.joinSession('doc-1', 'agent-1');
    engine.applyOperation('doc-1', 'insert', 'x', 'agent-1', 'y');

    const all = engine.getActivityFeed('doc-1');
    expect(all.length).toBeGreaterThanOrEqual(2);

    const joins = engine.getActivityFeed('doc-1', 'team_edit');
    expect(joins.length).toBeGreaterThanOrEqual(1);

    const agentEdits = engine.getActivityFeed('doc-1', undefined, 'agent-1');
    expect(agentEdits.length).toBeGreaterThanOrEqual(1);
  });

  it('manages live share sessions', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    const share = engine.startLiveShare('doc-1', 'host-1');
    expect(share.status).toBe('active');
    expect(share.hostId).toBe('host-1');

    expect(engine.joinLiveShare(share.sessionId, 'guest-1')).toBe(true);
    expect(engine.joinLiveShare('missing', 'guest-1')).toBe(false);

    const shares = engine.getLiveShares('doc-1');
    expect(shares).toHaveLength(1);
    expect(shares[0].guests).toContain('guest-1');

    expect(engine.endLiveShare(share.sessionId, 'host-1')).toBe(true);
    expect(engine.getLiveShares('doc-1')).toHaveLength(0);
  });

  it('appends and queries audit log', () => {
    const engine = engineFrom();
    engine.createSession('doc-1');

    engine.grantPermission('doc-1', 'agent-1', 'edit', 'admin');
    engine.applyOperation('doc-1', 'insert', 'x', 'agent-1', 'y');

    const all = engine.queryAuditLog({ docId: 'doc-1' } as any);
    expect(all.length).toBeGreaterThanOrEqual(2);

    const grants = engine.queryAuditLog({ action: 'collab:grant_permission' } as any);
    expect(grants.length).toBeGreaterThanOrEqual(1);
    expect(grants[0].actorId).toBe('admin');

    const exported = engine.exportAuditLog();
    expect(JSON.parse(exported).length).toBeGreaterThanOrEqual(2);
  });
});


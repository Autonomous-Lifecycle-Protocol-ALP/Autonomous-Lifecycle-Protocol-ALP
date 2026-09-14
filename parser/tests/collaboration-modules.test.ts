import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityFeed } from '../src/collaboration/activity';
import { AuditLog } from '../src/collaboration/audit';
import { PermissionManager } from '../src/collaboration/permissions';
import { LiveShareManager } from '../src/collaboration/live-share';
import { CommentManager } from '../src/collaboration/comments';
import { SessionManager } from '../src/collaboration/session';

describe('ActivityFeed', () => {
  let feed: ActivityFeed;

  beforeEach(() => {
    feed = new ActivityFeed();
  });

  it('logs an activity and returns the event', () => {
    const event = feed.logActivity('doc-1', 'team_edit', 'agent-1', { path: 'title' });
    expect(event.id).toBe('activity-1');
    expect(event.docId).toBe('doc-1');
    expect(event.type).toBe('team_edit');
    expect(event.actorId).toBe('agent-1');
    expect(event.timestamp).toBeGreaterThan(0);
    expect(event.payload).toEqual({ path: 'title' });
  });

  it('increments the counter', () => {
    feed.logActivity('doc-1', 'agent_run', 'system', {});
    feed.logActivity('doc-2', 'comment', 'agent-2', {});
    expect(feed.getActivityCounter()).toBe(2);
  });

  it('returns all activities for a document', () => {
    feed.logActivity('doc-1', 'agent_run', 'system', {});
    feed.logActivity('doc-2', 'agent_run', 'system', {});
    feed.logActivity('doc-1', 'team_edit', 'agent-1', {});
    expect(feed.getActivityFeed('doc-1')).toHaveLength(2);
  });

  it('filters by type', () => {
    feed.logActivity('doc-1', 'agent_run', 'system', {});
    feed.logActivity('doc-1', 'team_edit', 'agent-1', {});
    feed.logActivity('doc-1', 'team_edit', 'agent-2', {});
    expect(feed.getActivityFeed('doc-1', 'team_edit')).toHaveLength(2);
  });

  it('filters by actor', () => {
    feed.logActivity('doc-1', 'team_edit', 'agent-1', {});
    feed.logActivity('doc-1', 'team_edit', 'agent-2', {});
    feed.logActivity('doc-1', 'team_edit', 'agent-1', {});
    expect(feed.getActivityFeed('doc-1', undefined, 'agent-1')).toHaveLength(2);
  });

  it('filters by type and actor together', () => {
    feed.logActivity('doc-1', 'team_edit', 'agent-1', {});
    feed.logActivity('doc-1', 'comment', 'agent-1', {});
    feed.logActivity('doc-1', 'team_edit', 'agent-2', {});
    expect(feed.getActivityFeed('doc-1', 'team_edit', 'agent-1')).toHaveLength(1);
  });

  it('sets and gets the counter', () => {
    feed.setActivityCounter(42);
    expect(feed.getActivityCounter()).toBe(42);
  });

  it('serializes and restores activities', () => {
    feed.logActivity('doc-1', 'agent_run', 'system', {});
    feed.logActivity('doc-1', 'team_edit', 'agent-1', {});
    const serialized = feed.serializeActivities();
    expect(serialized).toHaveLength(2);

    const newFeed = new ActivityFeed();
    newFeed.restoreActivities(serialized);
    expect(newFeed.getActivityFeed('doc-1')).toHaveLength(2);
  });

  it('restores with null array safely', () => {
    const newFeed = new ActivityFeed();
    newFeed.restoreActivities(null as any);
    expect(newFeed.getActivityFeed('doc-1')).toHaveLength(0);
  });
});

describe('AuditLog', () => {
  let audit: AuditLog;

  beforeEach(() => {
    audit = new AuditLog();
  });

  it('appends an audit event', () => {
    const event = audit.appendAudit('agent-1', 'collab:apply_operation', 'doc-1', { opId: 'op-1' });
    expect(event.id).toBe('audit-1');
    expect(event.actorId).toBe('agent-1');
    expect(event.action).toBe('collab:apply_operation');
    expect(event.target).toBe('doc-1');
    expect(event.details).toEqual({ opId: 'op-1' });
    expect(event.timestamp).toBeGreaterThan(0);
  });

  it('increments the counter', () => {
    audit.appendAudit('agent-1', 'create', 'doc-1', {});
    audit.appendAudit('agent-2', 'update', 'doc-1', {});
    expect(audit.getAuditCounter()).toBe(2);
  });

  it('queries all events when no filter is given', () => {
    audit.appendAudit('agent-1', 'create', 'doc-1', {});
    audit.appendAudit('agent-2', 'update', 'doc-2', {});
    expect(audit.queryAuditLog()).toHaveLength(2);
  });

  it('filters by actorId', () => {
    audit.appendAudit('agent-1', 'create', 'doc-1', {});
    audit.appendAudit('agent-2', 'update', 'doc-1', {});
    expect(audit.queryAuditLog({ actorId: 'agent-1' })).toHaveLength(1);
  });

  it('filters by action', () => {
    audit.appendAudit('agent-1', 'create', 'doc-1', {});
    audit.appendAudit('agent-1', 'update', 'doc-1', {});
    expect(audit.queryAuditLog({ action: 'create' })).toHaveLength(1);
  });

  it('filters by target', () => {
    audit.appendAudit('agent-1', 'create', 'doc-1', {});
    audit.appendAudit('agent-1', 'update', 'doc-2', {});
    expect(audit.queryAuditLog({ target: 'doc-1' })).toHaveLength(1);
  });

  it('filters by time range', () => {
    const now = Date.now();
    const t1 = now - 2000;
    const t2 = now - 1000;
    const t3 = now;
    audit.appendAudit('agent-1', 'create', 'doc-1', {});
    const event = audit.auditLog[0];
    expect(audit.queryAuditLog({ from: event.timestamp + 1, to: event.timestamp + 1 })).toHaveLength(0);
    expect(audit.queryAuditLog({ from: t1, to: t3 })).toHaveLength(1);
  });

  it('limits results to the last N events', () => {
    audit.appendAudit('agent-1', 'create', 'doc-1', {});
    audit.appendAudit('agent-2', 'update', 'doc-1', {});
    audit.appendAudit('agent-3', 'delete', 'doc-1', {});
    expect(audit.queryAuditLog({ limit: 2 })).toHaveLength(2);
    expect(audit.queryAuditLog({ limit: 2 })[0].id).toBe('audit-2');
    expect(audit.queryAuditLog({ limit: 2 })[1].id).toBe('audit-3');
  });

  it('exports audit log as JSON string', () => {
    audit.appendAudit('agent-1', 'create', 'doc-1', { key: 'value' });
    const exported = audit.exportAuditLog();
    expect(typeof exported).toBe('string');
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].action).toBe('create');
  });

  it('sets and gets the counter', () => {
    audit.setAuditCounter(10);
    expect(audit.getAuditCounter()).toBe(10);
  });

  it('serializes and restores audit log', () => {
    audit.appendAudit('agent-1', 'create', 'doc-1', {});
    audit.appendAudit('agent-2', 'update', 'doc-1', {});
    const serialized = audit.serializeAuditLog();
    expect(serialized).toHaveLength(2);

    const newAudit = new AuditLog();
    newAudit.restoreAuditLog(serialized);
    expect(newAudit.queryAuditLog()).toHaveLength(2);
  });

  it('restores with null array safely', () => {
    const newAudit = new AuditLog();
    newAudit.restoreAuditLog(null as any);
    expect(newAudit.queryAuditLog()).toHaveLength(0);
  });
});

describe('PermissionManager', () => {
  let activity: ActivityFeed;
  let audit: AuditLog;
  let permissions: PermissionManager;

  beforeEach(() => {
    activity = new ActivityFeed();
    audit = new AuditLog();
    permissions = new PermissionManager(activity, audit);
  });

  it('grants a permission and logs activity/audit', () => {
    const perm = permissions.grantPermission('doc-1', 'agent-1', 'edit', 'system');
    expect(perm.docId).toBe('doc-1');
    expect(perm.agentId).toBe('agent-1');
    expect(perm.permission).toBe('edit');
    expect(perm.grantedBy).toBe('system');
    expect(activity.getActivityFeed('doc-1')).toHaveLength(1);
    expect(audit.queryAuditLog()).toHaveLength(1);
  });

  it('replaces existing permission for same agent/doc', () => {
    permissions.grantPermission('doc-1', 'agent-1', 'view', 'system');
    permissions.grantPermission('doc-1', 'agent-1', 'admin', 'system');
    const perms = permissions.getPermissions('doc-1');
    expect(perms).toHaveLength(1);
    expect(perms[0].permission).toBe('admin');
  });

  it('revokes a permission', () => {
    permissions.grantPermission('doc-1', 'agent-1', 'edit', 'system');
    expect(permissions.revokePermission('doc-1', 'agent-1', 'system')).toBe(true);
    expect(permissions.getPermissions('doc-1')).toHaveLength(0);
    expect(activity.getActivityFeed('doc-1')).toHaveLength(2);
  });

  it('returns false when revoking non-existent permission', () => {
    expect(permissions.revokePermission('doc-1', 'agent-1', 'system')).toBe(false);
  });

  it('returns permissions for a document', () => {
    permissions.grantPermission('doc-1', 'agent-1', 'view', 'system');
    permissions.grantPermission('doc-1', 'agent-2', 'edit', 'system');
    expect(permissions.getPermissions('doc-1')).toHaveLength(2);
  });

  it('returns empty array for document with no permissions', () => {
    expect(permissions.getPermissions('doc-1')).toHaveLength(0);
  });

  it('allows access when no permissions are set', () => {
    expect(permissions.checkPermission('doc-1', 'agent-1', 'view')).toBe(true);
    expect(permissions.checkPermission('doc-1', 'agent-1', 'edit')).toBe(true);
    expect(permissions.checkPermission('doc-1', 'agent-1', 'admin')).toBe(true);
  });

  it('grants view but denies edit/admin', () => {
    permissions.grantPermission('doc-1', 'agent-1', 'view', 'system');
    expect(permissions.checkPermission('doc-1', 'agent-1', 'view')).toBe(true);
    expect(permissions.checkPermission('doc-1', 'agent-1', 'edit')).toBe(false);
    expect(permissions.checkPermission('doc-1', 'agent-1', 'admin')).toBe(false);
  });

  it('grants edit but denies admin', () => {
    permissions.grantPermission('doc-1', 'agent-1', 'edit', 'system');
    expect(permissions.checkPermission('doc-1', 'agent-1', 'edit')).toBe(true);
    expect(permissions.checkPermission('doc-1', 'agent-1', 'admin')).toBe(false);
  });

  it('grants admin for all levels', () => {
    permissions.grantPermission('doc-1', 'agent-1', 'admin', 'system');
    expect(permissions.checkPermission('doc-1', 'agent-1', 'view')).toBe(true);
    expect(permissions.checkPermission('doc-1', 'agent-1', 'edit')).toBe(true);
    expect(permissions.checkPermission('doc-1', 'agent-1', 'admin')).toBe(true);
  });

  it('denies access for agent without permission', () => {
    permissions.grantPermission('doc-1', 'agent-1', 'edit', 'system');
    expect(permissions.checkPermission('doc-1', 'agent-2', 'view')).toBe(false);
  });

  it('serializes and restores permissions', () => {
    permissions.grantPermission('doc-1', 'agent-1', 'view', 'system');
    permissions.grantPermission('doc-2', 'agent-2', 'edit', 'system');
    const serialized = permissions.serializePermissions();
    expect(serialized).toHaveLength(2);

    const newPerms = new PermissionManager(new ActivityFeed(), new AuditLog());
    newPerms.restorePermissions(serialized);
    expect(newPerms.getPermissions('doc-1')).toHaveLength(1);
    expect(newPerms.getPermissions('doc-2')).toHaveLength(1);
    expect(newPerms.checkPermission('doc-1', 'agent-1', 'view')).toBe(true);
  });
});

describe('LiveShareManager', () => {
  let activity: ActivityFeed;
  let audit: AuditLog;
  let liveShare: LiveShareManager;

  beforeEach(() => {
    activity = new ActivityFeed();
    audit = new AuditLog();
    liveShare = new LiveShareManager(activity, audit);
  });

  it('starts a live share session', () => {
    const session = liveShare.startLiveShare('doc-1', 'agent-1');
    expect(session.sessionId).toBe('share-1');
    expect(session.docId).toBe('doc-1');
    expect(session.hostId).toBe('agent-1');
    expect(session.guests).toEqual([]);
    expect(session.status).toBe('active');
    expect(session.startedAt).toBeGreaterThan(0);
    expect(activity.getActivityFeed('doc-1')).toHaveLength(1);
    expect(audit.queryAuditLog()).toHaveLength(1);
  });

  it('increments share counter', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    liveShare.startLiveShare('doc-1', 'agent-2');
    expect(liveShare.getShareCounter()).toBe(2);
  });

  it('joins a session as guest', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    const joined = liveShare.joinLiveShare('share-1', 'agent-2');
    expect(joined).toBe(true);
    const session = liveShare.getLiveShares('doc-1')[0];
    expect(session.guests).toContain('agent-2');
  });

  it('host joining returns true without adding to guests', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    const joined = liveShare.joinLiveShare('share-1', 'agent-1');
    expect(joined).toBe(true);
    const session = liveShare.getLiveShares('doc-1')[0];
    expect(session.guests).toHaveLength(0);
  });

  it('returns false when joining non-existent session', () => {
    expect(liveShare.joinLiveShare('share-none', 'agent-1')).toBe(false);
  });

  it('returns false when joining ended session', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    liveShare.endLiveShare('share-1', 'agent-1');
    expect(liveShare.joinLiveShare('share-1', 'agent-2')).toBe(false);
  });

  it('does not duplicate guests on repeated join', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    liveShare.joinLiveShare('share-1', 'agent-2');
    liveShare.joinLiveShare('share-1', 'agent-2');
    const session = liveShare.getLiveShares('doc-1')[0];
    expect(session.guests).toHaveLength(1);
  });

  it('ends a live share session', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    expect(liveShare.endLiveShare('share-1', 'agent-1')).toBe(true);
    expect(liveShare.getLiveShares('doc-1')).toHaveLength(0);
    const session = liveShare.liveShares.get('share-1');
    expect(session!.status).toBe('ended');
    expect(session!.endedAt).toBeGreaterThan(0);
  });

  it('returns false when ending non-existent session', () => {
    expect(liveShare.endLiveShare('share-none', 'agent-1')).toBe(false);
  });

  it('returns false when ending already ended session', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    liveShare.endLiveShare('share-1', 'agent-1');
    expect(liveShare.endLiveShare('share-1', 'agent-1')).toBe(false);
  });

  it('returns only active sessions for a document', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    liveShare.startLiveShare('doc-1', 'agent-2');
    liveShare.endLiveShare('share-1', 'agent-1');
    expect(liveShare.getLiveShares('doc-1')).toHaveLength(1);
    expect(liveShare.getLiveShares('doc-1')[0].sessionId).toBe('share-2');
  });

  it('serializes and restores live shares', () => {
    liveShare.startLiveShare('doc-1', 'agent-1');
    liveShare.startLiveShare('doc-1', 'agent-2');
    const serialized = liveShare.serializeLiveShares();
    expect(serialized).toHaveLength(2);

    const newLiveShare = new LiveShareManager(new ActivityFeed(), new AuditLog());
    newLiveShare.restoreLiveShares(serialized);
    expect(newLiveShare.getLiveShares('doc-1')).toHaveLength(2);
  });

  it('restores with null array safely', () => {
    const newLiveShare = new LiveShareManager(new ActivityFeed(), new AuditLog());
    newLiveShare.restoreLiveShares(null as any);
    expect(newLiveShare.getLiveShares('doc-1')).toHaveLength(0);
  });
});

describe('CommentManager', () => {
  let activity: ActivityFeed;
  let audit: AuditLog;
  let comments: CommentManager;

  beforeEach(() => {
    activity = new ActivityFeed();
    audit = new AuditLog();
    comments = new CommentManager(activity, audit);
  });

  it('adds a comment', () => {
    const comment = comments.addComment('doc-1', 'title', 'agent-1', 'Looks good');
    expect(comment.id).toBe('comment-1');
    expect(comment.docId).toBe('doc-1');
    expect(comment.path).toBe('title');
    expect(comment.authorId).toBe('agent-1');
    expect(comment.text).toBe('Looks good');
    expect(comment.resolved).toBe(false);
    expect(comment.timestamp).toBeGreaterThan(0);
  });

  it('increments comment counter', () => {
    comments.addComment('doc-1', 'title', 'agent-1', 'a');
    comments.addComment('doc-1', 'body', 'agent-2', 'b');
    expect(comments.getCommentCounter()).toBe(2);
  });

  it('resolves a comment', () => {
    comments.addComment('doc-1', 'title', 'agent-1', 'Looks good');
    expect(comments.resolveComment('comment-1', 'agent-2')).toBe(true);
    const comment = comments.getComments('doc-1')[0];
    expect(comment.resolved).toBe(true);
    expect(comment.resolvedBy).toBe('agent-2');
    expect(comment.resolvedAt).toBeGreaterThan(0);
    expect(activity.getActivityFeed('doc-1')).toHaveLength(2);
  });

  it('returns false when resolving already resolved comment', () => {
    comments.addComment('doc-1', 'title', 'agent-1', 'Looks good');
    comments.resolveComment('comment-1', 'agent-2');
    expect(comments.resolveComment('comment-1', 'agent-3')).toBe(false);
  });

  it('returns false when resolving non-existent comment', () => {
    expect(comments.resolveComment('comment-none', 'agent-1')).toBe(false);
  });

  it('gets comments filtered by document', () => {
    comments.addComment('doc-1', 'title', 'agent-1', 'a');
    comments.addComment('doc-2', 'title', 'agent-1', 'b');
    expect(comments.getComments('doc-1')).toHaveLength(1);
    expect(comments.getComments('doc-2')).toHaveLength(1);
  });

  it('gets comments filtered by path', () => {
    comments.addComment('doc-1', 'title', 'agent-1', 'a');
    comments.addComment('doc-1', 'body', 'agent-1', 'b');
    expect(comments.getComments('doc-1', 'title')).toHaveLength(1);
    expect(comments.getComments('doc-1', 'body')).toHaveLength(1);
  });

  it('creates a review thread', () => {
    const thread = comments.createReviewThread('doc-1', 'title', 'agent-1', 'Please review');
    expect(thread.id).toBe('thread-1');
    expect(thread.docId).toBe('doc-1');
    expect(thread.path).toBe('title');
    expect(thread.comments).toHaveLength(1);
    expect(thread.status).toBe('open');
    expect(thread.comments[0].text).toBe('Please review');
  });

  it('increments thread counter', () => {
    comments.createReviewThread('doc-1', 'title', 'agent-1', 'a');
    comments.createReviewThread('doc-1', 'body', 'agent-2', 'b');
    expect(comments.getThreadCounter()).toBe(2);
  });

  it('replies to a thread', () => {
    comments.createReviewThread('doc-1', 'title', 'agent-1', 'Please review');
    const reply = comments.replyToThread('thread-1', 'agent-2', 'Done');
    expect(reply).not.toBeNull();
    expect(reply!.text).toBe('Done');
    expect(reply!.docId).toBe('doc-1');
    const thread = comments.getReviewThreads('doc-1')[0];
    expect(thread.comments).toHaveLength(2);
    expect(thread.updatedAt).toBeGreaterThanOrEqual(thread.createdAt);
  });

  it('returns null when replying to non-existent thread', () => {
    expect(comments.replyToThread('thread-none', 'agent-1', 'Done')).toBeNull();
  });

  it('resolves a thread and all its comments', () => {
    comments.createReviewThread('doc-1', 'title', 'agent-1', 'Please review');
    comments.replyToThread('thread-1', 'agent-2', 'Done');
    expect(comments.resolveThread('thread-1', 'agent-3')).toBe(true);
    const thread = comments.getReviewThreads('doc-1')[0];
    expect(thread.status).toBe('resolved');
    expect(thread.comments.every(c => c.resolved)).toBe(true);
    expect(activity.getActivityFeed('doc-1')).toHaveLength(5);
  });

  it('returns false when resolving already resolved thread', () => {
    comments.createReviewThread('doc-1', 'title', 'agent-1', 'Please review');
    comments.resolveThread('thread-1', 'agent-2');
    expect(comments.resolveThread('thread-1', 'agent-3')).toBe(false);
  });

  it('returns false when resolving non-existent thread', () => {
    expect(comments.resolveThread('thread-none', 'agent-1')).toBe(false);
  });

  it('gets review threads filtered by document', () => {
    comments.createReviewThread('doc-1', 'title', 'agent-1', 'a');
    comments.createReviewThread('doc-2', 'title', 'agent-1', 'b');
    expect(comments.getReviewThreads('doc-1')).toHaveLength(1);
    expect(comments.getReviewThreads('doc-2')).toHaveLength(1);
  });

  it('sets and gets counters', () => {
    comments.setCommentCounter(5);
    comments.setThreadCounter(3);
    expect(comments.getCommentCounter()).toBe(5);
    expect(comments.getThreadCounter()).toBe(3);
  });

  it('serializes and restores comments', () => {
    comments.addComment('doc-1', 'title', 'agent-1', 'a');
    comments.addComment('doc-1', 'body', 'agent-2', 'b');
    const serialized = comments.serializeComments();
    expect(serialized).toHaveLength(2);

    const newComments = new CommentManager(new ActivityFeed(), new AuditLog());
    newComments.restoreComments(serialized);
    expect(newComments.getComments('doc-1')).toHaveLength(2);
  });

  it('serializes and restores threads', () => {
    comments.createReviewThread('doc-1', 'title', 'agent-1', 'Please review');
    const serialized = comments.serializeThreads();
    expect(serialized).toHaveLength(1);

    const newComments = new CommentManager(new ActivityFeed(), new AuditLog());
    newComments.restoreThreads(serialized);
    expect(newComments.getReviewThreads('doc-1')).toHaveLength(1);
  });

  it('restores comments with null array safely', () => {
    const newComments = new CommentManager(new ActivityFeed(), new AuditLog());
    newComments.restoreComments(null as any);
    expect(newComments.getComments('doc-1')).toHaveLength(0);
  });

  it('restores threads with null array safely', () => {
    const newComments = new CommentManager(new ActivityFeed(), new AuditLog());
    newComments.restoreThreads(null as any);
    expect(newComments.getReviewThreads('doc-1')).toHaveLength(0);
  });
});

describe('SessionManager', () => {
  let permissions: PermissionManager;
  let activity: ActivityFeed;
  let audit: AuditLog;
  let sessions: SessionManager;

  beforeEach(() => {
    activity = new ActivityFeed();
    audit = new AuditLog();
    permissions = new PermissionManager(activity, audit);
    sessions = new SessionManager(permissions, activity, audit);
  });

  it('creates a session with initial state', () => {
    const session = sessions.createSession('doc-1', { title: 'Hello' });
    expect(session.docId).toBe('doc-1');
    expect(session.state.title).toBe('Hello');
    expect(session.createdAt).toBeGreaterThan(0);
    expect(activity.getActivityFeed('doc-1')).toHaveLength(1);
  });

  it('returns existing session on duplicate create', () => {
    const first = sessions.createSession('doc-1', { title: 'Hello' });
    const second = sessions.createSession('doc-1', { title: 'Overridden' });
    expect(first).toBe(second);
    expect(first.state.title).toBe('Hello');
  });

  it('joins a session and assigns color', () => {
    sessions.createSession('doc-1');
    const presence = sessions.joinSession('doc-1', 'agent-1');
    expect(presence).not.toBeNull();
    expect(presence!.agentId).toBe('agent-1');
    expect(presence!.status).toBe('active');
    expect(presence!.color).toBe('#FF6B6B');
    expect(sessions.getPresence('doc-1')).toHaveLength(1);
  });

  it('assigns different colors to different agents', () => {
    sessions.createSession('doc-1');
    sessions.joinSession('doc-1', 'agent-1');
    sessions.joinSession('doc-1', 'agent-2');
    const presence = sessions.getPresence('doc-1');
    expect(presence[0].color).toBe('#FF6B6B');
    expect(presence[1].color).toBe('#4ECDC4');
  });

  it('returns null when joining a missing session', () => {
    expect(sessions.joinSession('missing', 'agent-1')).toBeNull();
  });

  it('leaves a session', () => {
    sessions.createSession('doc-1');
    sessions.joinSession('doc-1', 'agent-1');
    expect(sessions.leaveSession('doc-1', 'agent-1')).toBe(true);
    expect(sessions.getPresence('doc-1')).toHaveLength(0);
  });

  it('returns false when leaving a missing session', () => {
    expect(sessions.leaveSession('missing', 'agent-1')).toBe(false);
  });

  it('applies operations with permission check', () => {
    sessions.createSession('doc-1');
    permissions.grantPermission('doc-1', 'agent-1', 'edit', 'system');
    const op = sessions.applyOperation('doc-1', 'insert', 'title', 'agent-1', 'Hello');
    expect(op).not.toBeNull();
    expect(op!.type).toBe('insert');
    expect(op!.path).toBe('title');
    expect(op!.value).toBe('Hello');
    expect(sessions.getSnapshot('doc-1').title).toBe('Hello');
  });

  it('returns null when applying operation without edit permission', () => {
    sessions.createSession('doc-1');
    permissions.grantPermission('doc-1', 'agent-1', 'view', 'system');
    expect(sessions.applyOperation('doc-1', 'insert', 'title', 'agent-1', 'Hello')).toBeNull();
  });

  it('returns null when applying operation to a missing session', () => {
    permissions.grantPermission('missing', 'agent-1', 'edit', 'system');
    expect(sessions.applyOperation('missing', 'insert', 'x', 'agent-1', 'y')).toBeNull();
  });

  it('tracks vector clocks across multiple agents', () => {
    sessions.createSession('doc-1');
    permissions.grantPermission('doc-1', 'agent-1', 'edit', 'system');
    permissions.grantPermission('doc-1', 'agent-2', 'edit', 'system');

    sessions.applyOperation('doc-1', 'insert', 'a', 'agent-1', '1');
    sessions.applyOperation('doc-1', 'insert', 'b', 'agent-2', '2');

    const log = sessions.getOperationLog('doc-1');
    expect(log).toHaveLength(2);
    expect(log[1].vectorClock['agent-1']).toBe(1);
    expect(log[1].vectorClock['agent-2']).toBe(1);
  });

  it('updates presence cursor on operation', () => {
    sessions.createSession('doc-1');
    sessions.joinSession('doc-1', 'agent-1');
    sessions.applyOperation('doc-1', 'insert', 'title', 'agent-1', 'Hello');
    const presence = sessions.getPresence('doc-1')[0];
    expect(presence.cursor).toBe('title');
  });

  it('forks a branch', () => {
    sessions.createSession('doc-1', { a: '1', b: '2' });
    const branch = sessions.fork('doc-1', 'branch-1');
    expect(branch).not.toBeNull();
    expect(branch!.branchId).toBe('branch-1');
    expect(branch!.state).toEqual({ a: '1', b: '2' });
    expect(activity.getActivityFeed('doc-1', 'branch')).toHaveLength(1);
  });

  it('returns null when forking a missing session', () => {
    expect(sessions.fork('missing', 'branch-1')).toBeNull();
  });

  it('merges a branch when main is unchanged', () => {
    sessions.createSession('doc-1', { a: '1', b: '2' });
    sessions.fork('doc-1', 'branch-1');
    const session = sessions.getSession('doc-1')!;
    session.state['a'] = 'modified';
    const result = sessions.mergeBranch('doc-1', 'branch-1');
    expect(result).not.toBeNull();
    expect(result!.merged.a).toBe('1');
    expect(result!.operationsApplied).toBeGreaterThan(0);
  });

  it('merges a branch with LWW conflict resolution', () => {
    sessions.createSession('doc-1', { a: '1' });
    permissions.grantPermission('doc-1', 'system', 'edit', 'system');
    sessions.fork('doc-1', 'branch-1');
    sessions.applyOperation('doc-1', 'update', 'a', 'system', 'main-later');
    const session = sessions.getSession('doc-1')!;
    const branch = session.branches.get('branch-1')!;
    branch.state['a'] = 'branch-later';
    branch.forkedAt = Date.now() + 1000;
    const result = sessions.mergeBranch('doc-1', 'branch-1');
    expect(result).not.toBeNull();
    expect(result!.conflicts).toHaveLength(1);
    expect(result!.merged.a).toBe('branch-later');
  });

  it('returns null when merging a non-existent branch', () => {
    sessions.createSession('doc-1');
    expect(sessions.mergeBranch('doc-1', 'branch-none')).toBeNull();
  });

  it('returns null when merging into a missing session', () => {
    expect(sessions.mergeBranch('missing', 'branch-1')).toBeNull();
  });

  it('gets a session by document id', () => {
    sessions.createSession('doc-1');
    expect(sessions.getSession('doc-1')).toBeDefined();
    expect(sessions.getSession('missing')).toBeUndefined();
  });

  it('sets and gets op counter', () => {
    sessions.setOpCounter(10);
    expect(sessions.getOpCounter()).toBe(10);
  });

  it('serializes and restores sessions', () => {
    sessions.createSession('doc-1', { title: 'Hello' });
    sessions.joinSession('doc-1', 'agent-1');
    sessions.fork('doc-1', 'branch-1');
    const serialized = sessions.serializeSessions();
    expect(serialized).toHaveLength(1);

    const newSessions = new SessionManager(
      new PermissionManager(new ActivityFeed(), new AuditLog()),
      new ActivityFeed(),
      new AuditLog()
    );
    newSessions.restoreSessions(serialized);
    expect(newSessions.getSession('doc-1')).toBeDefined();
    expect(newSessions.getPresence('doc-1')).toHaveLength(1);
    expect(newSessions.getOpCounter()).toBe(0);
  });

  it('restores with null array safely', () => {
    const newSessions = new SessionManager(
      new PermissionManager(new ActivityFeed(), new AuditLog()),
      new ActivityFeed(),
      new AuditLog()
    );
    newSessions.restoreSessions(null as any);
    expect(newSessions.getSession('doc-1')).toBeUndefined();
  });
});

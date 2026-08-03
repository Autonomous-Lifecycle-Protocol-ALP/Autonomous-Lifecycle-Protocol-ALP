/**
 * ALP CollaborationEngine — IDE Collaboration (v43.0.0).
 *
 * Extends v37.0.0 real-time multiplayer conflict resolution with:
 * - Inline comments and code review threads
 * - Activity feed for agent runs, policy decisions, and team edits
 * - Team permission controls (view/edit/admin)
 * - Live share sessions for synchronous co-authoring
 * - Audit log for compliance and rollback
 */

export type OperationType = 'insert' | 'update' | 'delete';

export interface CollabOperation {
  id: string;
  docId: string;
  type: OperationType;
  path: string;
  value?: any;
  previousValue?: any;
  agentId: string;
  timestamp: number;
  vectorClock: Record<string, number>;
}

export interface PresenceInfo {
  agentId: string;
  cursor?: string;
  lastSeen: number;
  color: string;
  status: 'active' | 'idle' | 'disconnected';
}

export interface CollabSession {
  docId: string;
  createdAt: number;
  agents: Map<string, PresenceInfo>;
  operations: CollabOperation[];
  state: Record<string, any>;
  branches: Map<string, CollabBranch>;
}

export interface CollabBranch {
  branchId: string;
  sourceDocId: string;
  forkedAt: number;
  forkedFromOp: number;
  state: Record<string, any>;
  operations: CollabOperation[];
}

export interface MergeResult {
  merged: Record<string, any>;
  conflicts: ConflictMarker[];
  operationsApplied: number;
}

export interface ConflictMarker {
  path: string;
  localValue: any;
  remoteValue: any;
  resolution: 'local_wins' | 'remote_wins' | 'unresolved';
}

export type PermissionLevel = 'view' | 'edit' | 'admin';

export interface TeamPermission {
  docId: string;
  agentId: string;
  permission: PermissionLevel;
  grantedAt: number;
  grantedBy: string;
}

export interface Comment {
  id: string;
  docId: string;
  path: string;
  authorId: string;
  text: string;
  timestamp: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

export interface ReviewThread {
  id: string;
  docId: string;
  path: string;
  comments: Comment[];
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: number;
  updatedAt: number;
}

export type ActivityType = 'agent_run' | 'policy_decision' | 'team_edit' | 'comment' | 'merge' | 'branch' | 'permission_change';

export interface ActivityEvent {
  id: string;
  docId: string;
  type: ActivityType;
  actorId: string;
  timestamp: number;
  payload: Record<string, any>;
}

export interface LiveShareSession {
  sessionId: string;
  docId: string;
  hostId: string;
  guests: string[];
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'ended';
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  actorId: string;
  action: string;
  target: string;
  details: Record<string, any>;
}

const AGENT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
];

let opCounter = 0;
let commentCounter = 0;
let threadCounter = 0;
let activityCounter = 0;
let auditCounter = 0;
let shareCounter = 0;

export class CollaborationEngine {
  private sessions: Map<string, CollabSession> = new Map();
  private permissions: Map<string, TeamPermission[]> = new Map();
  private comments: Comment[] = [];
  private threads: ReviewThread[] = [];
  private activities: ActivityEvent[] = [];
  private liveShares: Map<string, LiveShareSession> = new Map();
  private auditLog: AuditEvent[] = [];

  /**
   * Create a new collaboration session for a document.
   */
  createSession(docId: string, initialState?: Record<string, any>): CollabSession {
    if (this.sessions.has(docId)) {
      return this.sessions.get(docId)!;
    }
    const session: CollabSession = {
      docId,
      createdAt: Date.now(),
      agents: new Map(),
      operations: [],
      state: initialState ? { ...initialState } : {},
      branches: new Map(),
    };
    this.sessions.set(docId, session);
    this.logActivity(docId, 'agent_run', 'system', { action: 'session_created' });
    return session;
  }

  /**
   * Join an existing session.
   */
  joinSession(docId: string, agentId: string): PresenceInfo | null {
    const session = this.sessions.get(docId);
    if (!session) return null;

    const colorIdx = session.agents.size % AGENT_COLORS.length;
    const presence: PresenceInfo = {
      agentId,
      lastSeen: Date.now(),
      color: AGENT_COLORS[colorIdx],
      status: 'active',
    };
    session.agents.set(agentId, presence);
    this.logActivity(docId, 'team_edit', agentId, { action: 'joined_session' });
    return presence;
  }

  /**
   * Leave a session.
   */
  leaveSession(docId: string, agentId: string): boolean {
    const session = this.sessions.get(docId);
    if (!session) return false;
    const presence = session.agents.get(agentId);
    if (presence) {
      presence.status = 'disconnected';
      presence.lastSeen = Date.now();
    }
    return session.agents.delete(agentId);
  }

  /**
   * Get all agents present in a session.
   */
  getPresence(docId: string): PresenceInfo[] {
    const session = this.sessions.get(docId);
    if (!session) return [];
    return Array.from(session.agents.values());
  }

  /**
   * Apply an operation to a document with LWW conflict resolution.
   */
  applyOperation(
    docId: string,
    type: OperationType,
    path: string,
    agentId: string,
    value?: any
  ): CollabOperation | null {
    const session = this.sessions.get(docId);
    if (!session) return null;

    if (!this.checkPermission(docId, agentId, 'edit')) {
      return null;
    }

    const clock: Record<string, number> = {};
    for (const op of session.operations) {
      for (const [agent, tick] of Object.entries(op.vectorClock)) {
        clock[agent] = Math.max(clock[agent] || 0, tick);
      }
    }
    clock[agentId] = (clock[agentId] || 0) + 1;

    const previousValue = session.state[path];

    const op: CollabOperation = {
      id: `op-${++opCounter}`,
      docId,
      type,
      path,
      value,
      previousValue,
      agentId,
      timestamp: Date.now(),
      vectorClock: { ...clock },
    };

    switch (type) {
      case 'insert':
      case 'update':
        session.state[path] = value;
        break;
      case 'delete':
        delete session.state[path];
        break;
    }

    session.operations.push(op);

    const presence = session.agents.get(agentId);
    if (presence) {
      presence.lastSeen = Date.now();
      presence.cursor = path;
      presence.status = 'active';
    }

    this.logActivity(docId, 'team_edit', agentId, { action: type, path });
    this.appendAudit(agentId, 'collab:apply_operation', docId, { opId: op.id, path, type });

    return op;
  }

  /**
   * Get the operation log for a session.
   */
  getOperationLog(docId: string): CollabOperation[] {
    const session = this.sessions.get(docId);
    return session ? [...session.operations] : [];
  }

  /**
   * Get the current converged document snapshot.
   */
  getSnapshot(docId: string): Record<string, any> {
    const session = this.sessions.get(docId);
    return session ? { ...session.state } : {};
  }

  /**
   * Fork a branch from the current document state.
   */
  fork(docId: string, branchId: string): CollabBranch | null {
    const session = this.sessions.get(docId);
    if (!session) return null;

    const branch: CollabBranch = {
      branchId,
      sourceDocId: docId,
      forkedAt: Date.now(),
      forkedFromOp: session.operations.length,
      state: { ...session.state },
      operations: [],
    };
    session.branches.set(branchId, branch);
    this.logActivity(docId, 'branch', 'system', { action: 'fork', branchId });
    this.appendAudit('system', 'collab:fork', docId, { branchId });
    return branch;
  }

  /**
   * Three-way merge a branch back into the main document.
   * Uses LWW for conflicting scalar edits.
   */
  mergeBranch(docId: string, branchId: string): MergeResult | null {
    const session = this.sessions.get(docId);
    if (!session) return null;

    const branch = session.branches.get(branchId);
    if (!branch) return null;

    const conflicts: ConflictMarker[] = [];
    const merged = { ...session.state };
    let opsApplied = 0;

    const mainOpsAfterFork = session.operations.slice(branch.forkedFromOp);
    const mainModifiedPaths = new Set(mainOpsAfterFork.map(op => op.path));

    for (const [path, branchValue] of Object.entries(branch.state)) {
      if (mainModifiedPaths.has(path) && merged[path] !== branchValue) {
        const mainValue = merged[path];
        const branchOp = branch.operations.filter(o => o.path === path).pop();
        const mainOp = mainOpsAfterFork.filter(o => o.path === path).pop();

        const branchTs = branchOp?.timestamp ?? branch.forkedAt;
        const mainTs = mainOp?.timestamp ?? 0;

        if (branchTs >= mainTs) {
          merged[path] = branchValue;
          conflicts.push({ path, localValue: mainValue, remoteValue: branchValue, resolution: 'remote_wins' });
        } else {
          conflicts.push({ path, localValue: mainValue, remoteValue: branchValue, resolution: 'local_wins' });
        }
      } else {
        merged[path] = branchValue;
      }
      opsApplied++;
    }

    for (const key of Object.keys(session.state)) {
      if (!(key in branch.state) && !mainModifiedPaths.has(key)) {
        delete merged[key];
        opsApplied++;
      }
    }

    session.state = merged;
    session.branches.delete(branchId);

    this.logActivity(docId, 'merge', 'system', { action: 'merge', branchId, conflicts: conflicts.length });
    this.appendAudit('system', 'collab:merge', docId, { branchId, opsApplied, conflicts: conflicts.length });

    return { merged: { ...merged }, conflicts, operationsApplied: opsApplied };
  }

  /**
   * Get a session by document ID.
   */
  getSession(docId: string): CollabSession | undefined {
    return this.sessions.get(docId);
  }

  /**
   * Grant a team permission on a document.
   */
  grantPermission(docId: string, agentId: string, permission: PermissionLevel, grantedBy: string): TeamPermission {
    const existing = this.getPermissions(docId);
    const filtered = existing.filter(p => !(p.agentId === agentId && p.docId === docId));
    const perm: TeamPermission = { docId, agentId, permission, grantedAt: Date.now(), grantedBy };
    filtered.push(perm);
    this.permissions.set(docId, filtered);
    this.logActivity(docId, 'permission_change', grantedBy, { action: 'grant', targetAgent: agentId, permission });
    this.appendAudit(grantedBy, 'collab:grant_permission', docId, { agentId, permission });
    return perm;
  }

  /**
   * Revoke a team permission on a document.
   */
  revokePermission(docId: string, agentId: string, revokedBy: string): boolean {
    const existing = this.getPermissions(docId);
    const filtered = existing.filter(p => !(p.agentId === agentId && p.docId === docId));
    if (filtered.length === existing.length) return false;
    this.permissions.set(docId, filtered);
    this.logActivity(docId, 'permission_change', revokedBy, { action: 'revoke', targetAgent: agentId });
    this.appendAudit(revokedBy, 'collab:revoke_permission', docId, { agentId });
    return true;
  }

  /**
   * Get all permissions for a document.
   */
  getPermissions(docId: string): TeamPermission[] {
    return this.permissions.get(docId) || [];
  }

  /**
   * Check whether an agent has the required permission level on a document.
   */
  checkPermission(docId: string, agentId: string, required: PermissionLevel): boolean {
    const perms = this.getPermissions(docId);
    if (perms.length === 0) return true;
    const perm = perms.find(p => p.agentId === agentId);
    if (!perm) return false;
    const order: Record<PermissionLevel, number> = { view: 1, edit: 2, admin: 3 };
    return order[perm.permission] >= order[required];
  }

  /**
   * Add an inline comment to a specific path in a document.
   */
  addComment(docId: string, path: string, authorId: string, text: string): Comment {
    const comment: Comment = {
      id: `comment-${++commentCounter}`,
      docId,
      path,
      authorId,
      text,
      timestamp: Date.now(),
      resolved: false,
    };
    this.comments.push(comment);
    this.logActivity(docId, 'comment', authorId, { action: 'add_comment', path, commentId: comment.id });
    this.appendAudit(authorId, 'collab:add_comment', docId, { commentId: comment.id, path });
    return comment;
  }

  /**
   * Resolve a comment by id.
   */
  resolveComment(commentId: string, resolvedBy: string): boolean {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment || comment.resolved) return false;
    comment.resolved = true;
    comment.resolvedBy = resolvedBy;
    comment.resolvedAt = Date.now();
    this.logActivity(comment.docId, 'comment', resolvedBy, { action: 'resolve_comment', commentId });
    this.appendAudit(resolvedBy, 'collab:resolve_comment', comment.docId, { commentId });
    return true;
  }

  /**
   * Get comments for a document, optionally filtered by path.
   */
  getComments(docId: string, path?: string): Comment[] {
    return this.comments.filter(c => c.docId === docId && (path ? c.path === path : true));
  }

  /**
   * Create a review thread on a path.
   */
  createReviewThread(docId: string, path: string, authorId: string, text: string): ReviewThread {
    const comment = this.addComment(docId, path, authorId, text);
    const thread: ReviewThread = {
      id: `thread-${++threadCounter}`,
      docId,
      path,
      comments: [comment],
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.threads.push(thread);
    return thread;
  }

  /**
   * Add a reply to an existing review thread.
   */
  replyToThread(threadId: string, authorId: string, text: string): Comment | null {
    const thread = this.threads.find(t => t.id === threadId);
    if (!thread) return null;
    const comment = this.addComment(thread.docId, thread.path, authorId, text);
    thread.comments.push(comment);
    thread.updatedAt = Date.now();
    return comment;
  }

  /**
   * Resolve a review thread.
   */
  resolveThread(threadId: string, resolvedBy: string): boolean {
    const thread = this.threads.find(t => t.id === threadId);
    if (!thread || thread.status === 'resolved') return false;
    thread.status = 'resolved';
    thread.updatedAt = Date.now();
    for (const c of thread.comments) {
      if (!c.resolved) {
        this.resolveComment(c.id, resolvedBy);
      }
    }
    this.logActivity(thread.docId, 'comment', resolvedBy, { action: 'resolve_thread', threadId });
    return true;
  }

  /**
   * Get review threads for a document.
   */
  getReviewThreads(docId: string): ReviewThread[] {
    return this.threads.filter(t => t.docId === docId);
  }

  /**
   * Log an activity event to the feed.
   */
  logActivity(docId: string, type: ActivityType, actorId: string, payload: Record<string, any>): ActivityEvent {
    const event: ActivityEvent = {
      id: `activity-${++activityCounter}`,
      docId,
      type,
      actorId,
      timestamp: Date.now(),
      payload,
    };
    this.activities.push(event);
    return event;
  }

  /**
   * Get activity feed for a document, optionally filtered by type and actor.
   */
  getActivityFeed(docId: string, type?: ActivityType, actorId?: string): ActivityEvent[] {
    return this.activities.filter(a => {
      if (a.docId !== docId) return false;
      if (type && a.type !== type) return false;
      if (actorId && a.actorId !== actorId) return false;
      return true;
    });
  }

  /**
   * Start a live share session for synchronous co-authoring.
   */
  startLiveShare(docId: string, hostId: string): LiveShareSession {
    const sessionId = `share-${++shareCounter}`;
    const session: LiveShareSession = {
      sessionId,
      docId,
      hostId,
      guests: [],
      startedAt: Date.now(),
      status: 'active',
    };
    this.liveShares.set(sessionId, session);
    this.logActivity(docId, 'team_edit', hostId, { action: 'start_live_share', sessionId });
    this.appendAudit(hostId, 'collab:start_live_share', docId, { sessionId });
    return session;
  }

  /**
   * Join a live share session as a guest.
   */
  joinLiveShare(sessionId: string, guestId: string): boolean {
    const session = this.liveShares.get(sessionId);
    if (!session || session.status !== 'active') return false;
    if (session.hostId === guestId) return true;
    if (!session.guests.includes(guestId)) {
      session.guests.push(guestId);
    }
    this.logActivity(session.docId, 'team_edit', guestId, { action: 'join_live_share', sessionId });
    return true;
  }

  /**
   * End a live share session.
   */
  endLiveShare(sessionId: string, endedBy: string): boolean {
    const session = this.liveShares.get(sessionId);
    if (!session || session.status !== 'active') return false;
    session.status = 'ended';
    session.endedAt = Date.now();
    this.logActivity(session.docId, 'team_edit', endedBy, { action: 'end_live_share', sessionId });
    this.appendAudit(endedBy, 'collab:end_live_share', session.docId, { sessionId });
    return true;
  }

  /**
   * Get active live share sessions for a document.
   */
  getLiveShares(docId: string): LiveShareSession[] {
    return Array.from(this.liveShares.values()).filter(s => s.docId === docId && s.status === 'active');
  }

  /**
   * Append an audit event for compliance and rollback.
   */
  appendAudit(actorId: string, action: string, target: string, details: Record<string, any>): AuditEvent {
    const event: AuditEvent = {
      id: `audit-${++auditCounter}`,
      timestamp: Date.now(),
      actorId,
      action,
      target,
      details,
    };
    this.auditLog.push(event);
    return event;
  }

  /**
   * Query audit log events, optionally filtered by actor, action, target, and time range.
   */
  queryAuditLog(options: {
    actorId?: string;
    action?: string;
    target?: string;
    from?: number;
    to?: number;
    limit?: number;
  } = {}): AuditEvent[] {
    let results = this.auditLog;
    if (options.actorId) results = results.filter(e => e.actorId === options.actorId);
    if (options.action) results = results.filter(e => e.action === options.action);
    if (options.target) results = results.filter(e => e.target === options.target);
    if (options.from) results = results.filter(e => e.timestamp >= options.from!);
    if (options.to) results = results.filter(e => e.timestamp <= options.to!);
    const limit = options.limit ?? results.length;
    return results.slice(-limit);
  }

  /**
   * Export audit log as JSON string for compliance.
   */
  exportAuditLog(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }

  toJSON(): Record<string, any> {
    return {
      sessions: Array.from(this.sessions.entries()).map(([docId, session]) => ({
        docId,
        createdAt: session.createdAt,
        agents: Array.from(session.agents.entries()).map(([agentId, presence]) => ({ ...presence, agentId })),
        operations: session.operations,
        state: session.state,
        branches: Array.from(session.branches.entries()).map(([branchId, branch]) => ({ ...branch, branchId })),
      })),
      permissions: Array.from(this.permissions.entries()).map(([docId, perms]) => ({ docId, permissions: perms })),
      comments: this.comments,
      threads: this.threads,
      activities: this.activities,
      liveShares: Array.from(this.liveShares.entries()).map(([sessionId, share]) => ({ ...share, sessionId })),
      auditLog: this.auditLog,
      counters: {
        op: opCounter,
        comment: commentCounter,
        thread: threadCounter,
        activity: activityCounter,
        audit: auditCounter,
        share: shareCounter,
      },
    };
  }

  fromJSON(data: Record<string, any>): void {
    this.sessions = new Map(
      (data.sessions || []).map((s: any) => [
        s.docId,
        {
          docId: s.docId,
          createdAt: s.createdAt,
          agents: new Map((s.agents || []).map((a: any) => [a.agentId, a])),
          operations: s.operations || [],
          state: s.state || {},
          branches: new Map((s.branches || []).map((b: any) => [b.branchId, b])),
        },
      ])
    );
    this.permissions = new Map((data.permissions || []).map((p: any) => [p.docId, p.permissions || []]));
    this.comments = data.comments || [];
    this.threads = data.threads || [];
    this.activities = data.activities || [];
    this.liveShares = new Map((data.liveShares || []).map((s: any) => [s.sessionId, s]));
    this.auditLog = data.auditLog || [];
    if (data.counters) {
      opCounter = data.counters.op ?? opCounter;
      commentCounter = data.counters.comment ?? commentCounter;
      threadCounter = data.counters.thread ?? threadCounter;
      activityCounter = data.counters.activity ?? activityCounter;
      auditCounter = data.counters.audit ?? auditCounter;
      shareCounter = data.counters.share ?? shareCounter;
    }
  }
}

/**
 * ALP CollaborationEngine — IDE Collaboration (v43.0.0).
 *
 * Facade that composes the focused collaboration managers:
 *   - SessionManager   (sessions, operations, branching, presence)
 *   - PermissionManager (team permission controls)
 *   - CommentManager    (inline comments and review threads)
 *   - ActivityFeed      (agent runs, policy decisions, team edits)
 *   - LiveShareManager  (synchronous co-authoring)
 *   - AuditLog          (compliance and rollback)
 *
 * Cross-domain coordination (permission checks, activity logging, audit
 * appends) is handled inside the managers, which are wired together here.
 */

import { SessionManager } from './session';
import { PermissionManager } from './permissions';
import { CommentManager } from './comments';
import { ActivityFeed } from './activity';
import { LiveShareManager } from './live-share';
import { AuditLog } from './audit';
import {
  AuditEvent,
  CollabBranch,
  CollabOperation,
  CollabSession,
  Comment,
  LiveShareSession,
  MergeResult,
  OperationType,
  PermissionLevel,
  PresenceInfo,
  ReviewThread,
  ActivityEvent,
  ActivityType,
  TeamPermission,
} from './types';

export class CollaborationEngine {
  private activity: ActivityFeed;
  private audit: AuditLog;
  private permissionManager: PermissionManager;
  private commentManager: CommentManager;
  private liveShareManager: LiveShareManager;
  private sessionManager: SessionManager;

  constructor() {
    this.activity = new ActivityFeed();
    this.audit = new AuditLog();
    this.permissionManager = new PermissionManager(this.activity, this.audit);
    this.commentManager = new CommentManager(this.activity, this.audit);
    this.liveShareManager = new LiveShareManager(this.activity, this.audit);
    this.sessionManager = new SessionManager(this.permissionManager, this.activity, this.audit);
  }

  /**
   * Internal session map, exposed for low-level access.
   */
  get sessions(): Map<string, CollabSession> {
    return this.sessionManager.sessions;
  }

  // ---- Session / operations / branching / presence ----

  createSession(docId: string, initialState?: Record<string, any>): CollabSession {
    return this.sessionManager.createSession(docId, initialState);
  }

  joinSession(docId: string, agentId: string): PresenceInfo | null {
    return this.sessionManager.joinSession(docId, agentId);
  }

  leaveSession(docId: string, agentId: string): boolean {
    return this.sessionManager.leaveSession(docId, agentId);
  }

  getPresence(docId: string): PresenceInfo[] {
    return this.sessionManager.getPresence(docId);
  }

  applyOperation(
    docId: string,
    type: OperationType,
    path: string,
    agentId: string,
    value?: any
  ): CollabOperation | null {
    return this.sessionManager.applyOperation(docId, type, path, agentId, value);
  }

  getOperationLog(docId: string): CollabOperation[] {
    return this.sessionManager.getOperationLog(docId);
  }

  getSnapshot(docId: string): Record<string, any> {
    return this.sessionManager.getSnapshot(docId);
  }

  fork(docId: string, branchId: string): CollabBranch | null {
    return this.sessionManager.fork(docId, branchId);
  }

  mergeBranch(docId: string, branchId: string): MergeResult | null {
    return this.sessionManager.mergeBranch(docId, branchId);
  }

  getSession(docId: string): CollabSession | undefined {
    return this.sessionManager.getSession(docId);
  }

  // ---- Permissions ----

  grantPermission(docId: string, agentId: string, permission: PermissionLevel, grantedBy: string): TeamPermission {
    return this.permissionManager.grantPermission(docId, agentId, permission, grantedBy);
  }

  revokePermission(docId: string, agentId: string, revokedBy: string): boolean {
    return this.permissionManager.revokePermission(docId, agentId, revokedBy);
  }

  getPermissions(docId: string): TeamPermission[] {
    return this.permissionManager.getPermissions(docId);
  }

  checkPermission(docId: string, agentId: string, required: PermissionLevel): boolean {
    return this.permissionManager.checkPermission(docId, agentId, required);
  }

  // ---- Comments / review threads ----

  addComment(docId: string, path: string, authorId: string, text: string): Comment {
    return this.commentManager.addComment(docId, path, authorId, text);
  }

  resolveComment(commentId: string, resolvedBy: string): boolean {
    return this.commentManager.resolveComment(commentId, resolvedBy);
  }

  getComments(docId: string, path?: string): Comment[] {
    return this.commentManager.getComments(docId, path);
  }

  createReviewThread(docId: string, path: string, authorId: string, text: string): ReviewThread {
    return this.commentManager.createReviewThread(docId, path, authorId, text);
  }

  replyToThread(threadId: string, authorId: string, text: string): Comment | null {
    return this.commentManager.replyToThread(threadId, authorId, text);
  }

  resolveThread(threadId: string, resolvedBy: string): boolean {
    return this.commentManager.resolveThread(threadId, resolvedBy);
  }

  getReviewThreads(docId: string): ReviewThread[] {
    return this.commentManager.getReviewThreads(docId);
  }

  // ---- Activity feed ----

  logActivity(docId: string, type: ActivityType, actorId: string, payload: Record<string, any>): ActivityEvent {
    return this.activity.logActivity(docId, type, actorId, payload);
  }

  getActivityFeed(docId: string, type?: ActivityType, actorId?: string): ActivityEvent[] {
    return this.activity.getActivityFeed(docId, type, actorId);
  }

  // ---- Live share ----

  startLiveShare(docId: string, hostId: string): LiveShareSession {
    return this.liveShareManager.startLiveShare(docId, hostId);
  }

  joinLiveShare(sessionId: string, guestId: string): boolean {
    return this.liveShareManager.joinLiveShare(sessionId, guestId);
  }

  endLiveShare(sessionId: string, endedBy: string): boolean {
    return this.liveShareManager.endLiveShare(sessionId, endedBy);
  }

  getLiveShares(docId: string): LiveShareSession[] {
    return this.liveShareManager.getLiveShares(docId);
  }

  // ---- Audit log ----

  appendAudit(actorId: string, action: string, target: string, details: Record<string, any>): AuditEvent {
    return this.audit.appendAudit(actorId, action, target, details);
  }

  queryAuditLog(options: {
    actorId?: string;
    action?: string;
    target?: string;
    from?: number;
    to?: number;
    limit?: number;
  } = {}): AuditEvent[] {
    return this.audit.queryAuditLog(options);
  }

  exportAuditLog(): string {
    return this.audit.exportAuditLog();
  }

  toJSON(): Record<string, any> {
    return {
      sessions: this.sessionManager.serializeSessions(),
      permissions: this.permissionManager.serializePermissions(),
      comments: this.commentManager.serializeComments(),
      threads: this.commentManager.serializeThreads(),
      activities: this.activity.serializeActivities(),
      liveShares: this.liveShareManager.serializeLiveShares(),
      auditLog: this.audit.serializeAuditLog(),
      counters: {
        op: this.sessionManager.getOpCounter(),
        comment: this.commentManager.getCommentCounter(),
        thread: this.commentManager.getThreadCounter(),
        activity: this.activity.getActivityCounter(),
        audit: this.audit.getAuditCounter(),
        share: this.liveShareManager.getShareCounter(),
      },
    };
  }

  fromJSON(data: Record<string, any>): void {
    this.sessionManager.restoreSessions(data.sessions);
    this.permissionManager.restorePermissions(data.permissions);
    this.commentManager.restoreComments(data.comments);
    this.commentManager.restoreThreads(data.threads);
    this.activity.restoreActivities(data.activities);
    this.liveShareManager.restoreLiveShares(data.liveShares);
    this.audit.restoreAuditLog(data.auditLog);
    if (data.counters) {
      this.sessionManager.setOpCounter(data.counters.op ?? this.sessionManager.getOpCounter());
      this.commentManager.setCommentCounter(data.counters.comment ?? this.commentManager.getCommentCounter());
      this.commentManager.setThreadCounter(data.counters.thread ?? this.commentManager.getThreadCounter());
      this.activity.setActivityCounter(data.counters.activity ?? this.activity.getActivityCounter());
      this.audit.setAuditCounter(data.counters.audit ?? this.audit.getAuditCounter());
      this.liveShareManager.setShareCounter(data.counters.share ?? this.liveShareManager.getShareCounter());
    }
  }
}

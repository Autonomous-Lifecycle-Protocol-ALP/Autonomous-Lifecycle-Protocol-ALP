/**
 * ALP Collaboration — inline comments and code review threads.
 */

import { Comment, ReviewThread } from './types';
import { ActivityFeed } from './activity';
import { AuditLog } from './audit';

export class CommentManager {
  comments: Comment[] = [];
  threads: ReviewThread[] = [];
  private commentCounter = 0;
  private threadCounter = 0;

  constructor(
    private activity: ActivityFeed,
    private audit: AuditLog,
  ) {}

  /**
   * Add an inline comment to a specific path in a document.
   */
  addComment(docId: string, path: string, authorId: string, text: string): Comment {
    const comment: Comment = {
      id: `comment-${++this.commentCounter}`,
      docId,
      path,
      authorId,
      text,
      timestamp: Date.now(),
      resolved: false,
    };
    this.comments.push(comment);
    this.activity.logActivity(docId, 'comment', authorId, { action: 'add_comment', path, commentId: comment.id });
    this.audit.appendAudit(authorId, 'collab:add_comment', docId, { commentId: comment.id, path });
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
    this.activity.logActivity(comment.docId, 'comment', resolvedBy, { action: 'resolve_comment', commentId });
    this.audit.appendAudit(resolvedBy, 'collab:resolve_comment', comment.docId, { commentId });
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
      id: `thread-${++this.threadCounter}`,
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
    this.activity.logActivity(thread.docId, 'comment', resolvedBy, { action: 'resolve_thread', threadId });
    return true;
  }

  /**
   * Get review threads for a document.
   */
  getReviewThreads(docId: string): ReviewThread[] {
    return this.threads.filter(t => t.docId === docId);
  }

  getCommentCounter(): number {
    return this.commentCounter;
  }

  getThreadCounter(): number {
    return this.threadCounter;
  }

  setCommentCounter(n: number): void {
    this.commentCounter = n;
  }

  setThreadCounter(n: number): void {
    this.threadCounter = n;
  }

  serializeComments(): Comment[] {
    return this.comments;
  }

  serializeThreads(): ReviewThread[] {
    return this.threads;
  }

  restoreComments(comments: Comment[]): void {
    this.comments = comments || [];
  }

  restoreThreads(threads: ReviewThread[]): void {
    this.threads = threads || [];
  }
}

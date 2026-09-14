import { CollaborationEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';
import { audit } from '../audit';

export const toolDefinitions = [
  {
    name: 'alp_collab_start',
    description: 'Start a collaboration session on a document (v43.0.0 IDE Collaboration).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_collab_join',
    description: 'Join a collaboration session (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' },
        agentId: { type: 'string', description: 'Agent identifier' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_collab_presence',
    description: 'Get presence info for a collaboration session (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_collab_comment',
    description: 'Add an inline comment to a document path (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' },
        path: { type: 'string', description: 'Path within the document' },
        text: { type: 'string', description: 'Comment text' },
        authorId: { type: 'string', description: 'Author agent ID' }
      },
      required: ['docId', 'path', 'text']
    }
  },
  {
    name: 'alp_collab_comments',
    description: 'List comments for a document (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' },
        path: { type: 'string', description: 'Optional path filter' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_collab_thread',
    description: 'Create a review thread on a document path (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' },
        path: { type: 'string', description: 'Path to thread' },
        text: { type: 'string', description: 'Initial comment text' },
        authorId: { type: 'string', description: 'Author agent ID' }
      },
      required: ['docId', 'path', 'text']
    }
  },
  {
    name: 'alp_collab_threads',
    description: 'List review threads for a document (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_collab_activity',
    description: 'Get activity feed for a document (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' },
        type: { type: 'string', description: 'Filter by activity type' },
        actorId: { type: 'string', description: 'Filter by actor' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_collab_permissions',
    description: 'List or manage team permissions for a document (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' },
        action: { type: 'string', description: 'Action: list | grant | revoke' },
        agentId: { type: 'string', description: 'Agent ID for grant/revoke' },
        permission: { type: 'string', description: 'Permission level: view | edit | admin' },
        grantedBy: { type: 'string', description: 'Agent granting permission' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_collab_share',
    description: 'Start a live share session for synchronous co-authoring (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' },
        hostId: { type: 'string', description: 'Host agent ID' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_collab_shares',
    description: 'List active live share sessions for a document (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' }
      },
      required: ['docId']
    }
  },
  {
    name: 'alp_audit_log',
    description: 'Query or export the audit log for compliance and rollback (v43.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        docId: { type: 'string', description: 'Document identifier' },
        action: { type: 'string', description: 'Filter by action' },
        actorId: { type: 'string', description: 'Filter by actor' },
        from: { type: 'string', description: 'Filter from ISO timestamp' },
        to: { type: 'string', description: 'Filter to ISO timestamp' },
        limit: { type: 'number', description: 'Max events to return' },
        export: { type: 'boolean', description: 'Export full audit log as JSON' }
      },
      required: ['docId']
    }
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_collab_start': {
      const docId = args?.docId as string;
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      const session = engine.createSession(docId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            docId: session.docId,
            createdAt: session.createdAt,
            agents: session.agents.size,
            operations: session.operations.length,
          }, null, 2),
        }],
      };
    }

    case 'alp_collab_join': {
      const docId = args?.docId as string;
      const agentId = (args?.agentId as string) || 'agent-default';
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const presence = engine.joinSession(docId, agentId);
      if (!presence) {
        return { content: [{ type: 'text', text: `Session ${docId} not found.` }], isError: true };
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            agentId: presence.agentId,
            color: presence.color,
            status: presence.status,
            lastSeen: presence.lastSeen,
          }, null, 2),
        }],
      };
    }

    case 'alp_collab_presence': {
      const docId = args?.docId as string;
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      const presence = engine.getPresence(docId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(presence.map(p => ({
            agentId: p.agentId,
            color: p.color,
            status: p.status,
            cursor: p.cursor,
            lastSeen: p.lastSeen,
          })), null, 2),
        }],
      };
    }

    case 'alp_collab_comment': {
      const docId = args?.docId as string;
      const docPath = args?.path as string;
      const text = args?.text as string;
      const authorId = (args?.authorId as string) || 'agent-default';
      if (!docId || !docPath || !text) {
        return { content: [{ type: 'text', text: 'Error: docId, path, and text are required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const comment = engine.addComment(docId, docPath, authorId, text);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            id: comment.id,
            docId: comment.docId,
            path: comment.path,
            authorId: comment.authorId,
            text: comment.text,
            resolved: comment.resolved,
            timestamp: comment.timestamp,
          }, null, 2),
        }],
      };
    }

    case 'alp_collab_comments': {
      const docId = args?.docId as string;
      const docPath = args?.path as string | undefined;
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      const comments = engine.getComments(docId, docPath);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(comments.map(c => ({
            id: c.id,
            path: c.path,
            authorId: c.authorId,
            text: c.text,
            resolved: c.resolved,
            timestamp: c.timestamp,
          })), null, 2),
        }],
      };
    }

    case 'alp_collab_thread': {
      const docId = args?.docId as string;
      const docPath = args?.path as string;
      const text = args?.text as string;
      const authorId = (args?.authorId as string) || 'agent-default';
      if (!docId || !docPath || !text) {
        return { content: [{ type: 'text', text: 'Error: docId, path, and text are required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const thread = engine.createReviewThread(docId, docPath, authorId, text);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            id: thread.id,
            docId: thread.docId,
            path: thread.path,
            status: thread.status,
            comments: thread.comments.length,
          }, null, 2),
        }],
      };
    }

    case 'alp_collab_threads': {
      const docId = args?.docId as string;
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      const threads = engine.getReviewThreads(docId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(threads.map(t => ({
            id: t.id,
            path: t.path,
            status: t.status,
            comments: t.comments.length,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })), null, 2),
        }],
      };
    }

    case 'alp_collab_activity': {
      const docId = args?.docId as string;
      const type = args?.type as string | undefined;
      const actorId = args?.actorId as string | undefined;
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      const feed = engine.getActivityFeed(docId, type as any, actorId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(feed.map(e => ({
            id: e.id,
            type: e.type,
            actorId: e.actorId,
            timestamp: e.timestamp,
            payload: e.payload,
          })), null, 2),
        }],
      };
    }

    case 'alp_collab_permissions': {
      const docId = args?.docId as string;
      const action = (args?.action as string) || 'list';
      const agentId = args?.agentId as string | undefined;
      const permission = args?.permission as string | undefined;
      const grantedBy = (args?.grantedBy as string) || 'agent-default';
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      engine.createSession(docId);

      if (action === 'grant' && agentId && permission) {
        const perm = engine.grantPermission(docId, agentId, permission as any, grantedBy);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              docId: perm.docId,
              agentId: perm.agentId,
              permission: perm.permission,
              grantedBy: perm.grantedBy,
              grantedAt: perm.grantedAt,
            }, null, 2),
          }],
        };
      }

      if (action === 'revoke' && agentId) {
        const ok = engine.revokePermission(docId, agentId, grantedBy);
        return {
          content: [{ type: 'text', text: ok ? `Permission revoked for ${agentId}.` : `No permission found for ${agentId}.` }],
          isError: !ok,
        };
      }

      const perms = engine.getPermissions(docId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(perms.map(p => ({
            agentId: p.agentId,
            permission: p.permission,
            grantedBy: p.grantedBy,
            grantedAt: p.grantedAt,
          })), null, 2),
        }],
      };
    }

    case 'alp_collab_share': {
      const docId = args?.docId as string;
      const hostId = (args?.hostId as string) || 'agent-default';
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const session = engine.startLiveShare(docId, hostId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            sessionId: session.sessionId,
            docId: session.docId,
            hostId: session.hostId,
            guests: session.guests,
            status: session.status,
            startedAt: session.startedAt,
          }, null, 2),
        }],
      };
    }

    case 'alp_collab_shares': {
      const docId = args?.docId as string;
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      const shares = engine.getLiveShares(docId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(shares.map(s => ({
            sessionId: s.sessionId,
            docId: s.docId,
            hostId: s.hostId,
            guests: s.guests,
            status: s.status,
            startedAt: s.startedAt,
          })), null, 2),
        }],
      };
    }

    case 'alp_audit_log': {
      const docId = args?.docId as string;
      const action = args?.action as string | undefined;
      const actorId = args?.actorId as string | undefined;
      const from = args?.from as string | undefined;
      const to = args?.to as string | undefined;
      const limit = (args?.limit as number) || 50;
      const exportLog = args?.export as boolean | undefined;
      if (!docId) {
        return { content: [{ type: 'text', text: 'Error: docId is required.' }], isError: true };
      }
      const engine = new CollaborationEngine();
      engine.createSession(docId);

      if (exportLog) {
        return {
          content: [{ type: 'text', text: engine.exportAuditLog() }],
        };
      }

      const opts: any = { limit };
      if (action) opts.action = action;
      if (actorId) opts.actorId = actorId;
      if (from) opts.from = new Date(from).getTime();
      if (to) opts.to = new Date(to).getTime();

      const events = engine.queryAuditLog(opts);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(events.map(e => ({
            id: e.id,
            timestamp: e.timestamp,
            actorId: e.actorId,
            action: e.action,
            target: e.target,
            details: e.details,
          })), null, 2),
        }],
      };
    }

    default:
      return null;
  }
}

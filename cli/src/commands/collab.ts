import { Command } from 'commander';
import { CollaborationEngine } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerCollabCommand(program: Command) {
  const collabCmd = program
    .command('collab')
    .description('IDE Collaboration: comments, threads, permissions, live share, audit (v43.0.0)');

  collabCmd
    .command('start')
    .description('Start a collaboration session on a document')
    .argument('<docId>', 'Document/file identifier')
    .action((docId) => {
      const engine = new CollaborationEngine();
      const session = engine.createSession(docId);

      console.log('\n🤝 Collaboration Session Started (v43.0.0)');
      console.log('===========================================');
      console.log(`  Document:   ${session.docId}`);
      console.log(`  Created:    ${new Date(session.createdAt).toISOString()}`);
      console.log(`  Agents:     ${session.agents.size}`);
      console.log(`  Operations: ${session.operations.length}\n`);
    });

  collabCmd
    .command('join')
    .description('Join an active collaboration session')
    .argument('<docId>', 'Document/file identifier')
    .option('--agent <id>', 'Agent identifier', 'agent-default')
    .action((docId, options) => {
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const presence = engine.joinSession(docId, options.agent);

      if (presence) {
        console.log(`\n✅ Agent '${presence.agentId}' joined session '${docId}'`);
        console.log(`   Color:  ${presence.color}`);
        console.log(`   Status: ${presence.status}\n`);
      } else {
        console.error(`❌ Session '${docId}' not found`);
      }
    });

  collabCmd
    .command('status')
    .description('Show session presence and operation count')
    .argument('<docId>', 'Document/file identifier')
    .action((docId) => {
      const engine = new CollaborationEngine();
      const session = engine.getSession(docId);

      if (!session) {
        console.log(`\n⚠️  No active session for '${docId}'\n`);
        return;
      }

      console.log(`\n📊 Session Status: ${docId}`);
      console.log(`   Agents:     ${session.agents.size}`);
      console.log(`   Operations: ${session.operations.length}`);
      console.log(`   Branches:   ${session.branches.size}\n`);
    });

  collabCmd
    .command('merge')
    .description('Merge a branch back into the main document')
    .argument('<docId>', 'Main document ID')
    .argument('<branchId>', 'Branch to merge')
    .action((docId, branchId) => {
      const engine = new CollaborationEngine();
      const result = engine.mergeBranch(docId, branchId);

      if (!result) {
        console.error(`❌ Could not merge: session or branch not found`);
        return;
      }

      console.log(`\n🔀 Merge Complete`);
      console.log(`   Operations applied: ${result.operationsApplied}`);
      console.log(`   Conflicts:          ${result.conflicts.length}`);
      if (result.conflicts.length > 0) {
        result.conflicts.forEach((c) => {
          console.log(`     ⚠️  ${c.path}: ${c.resolution} (local=${c.localValue}, remote=${c.remoteValue})`);
        });
      }
      console.log('');
    });

  collabCmd
    .command('comment')
    .description('Add an inline comment to a path in a document')
    .argument('<docId>', 'Document identifier')
    .argument('<path>', 'Path within the document to comment on')
    .argument('<text>', 'Comment text')
    .option('--agent <id>', 'Agent identifier', 'agent-default')
    .action((docId, path, text, options) => {
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const comment = engine.addComment(docId, path, options.agent, text);

      console.log(`\n💬 Comment Added`);
      console.log(`   ID:       ${comment.id}`);
      console.log(`   Path:     ${comment.path}`);
      console.log(`   Author:   ${comment.authorId}`);
      console.log(`   Resolved: ${comment.resolved}\n`);
    });

  collabCmd
    .command('comments')
    .description('List comments for a document')
    .argument('<docId>', 'Document identifier')
    .option('--path <path>', 'Filter by path')
    .action((docId, options) => {
      const engine = new CollaborationEngine();
      const comments = engine.getComments(docId, options.path);

      console.log(`\n💬 Comments for ${docId}: ${comments.length}`);
      comments.forEach((c) => {
        console.log(`   [${c.id}] ${c.path} by ${c.authorId}: ${c.text} (resolved=${c.resolved})`);
      });
      console.log('');
    });

  collabCmd
    .command('resolve-comment')
    .description('Resolve a comment by ID')
    .argument('<commentId>', 'Comment identifier')
    .option('--agent <id>', 'Agent resolving the comment', 'agent-default')
    .action((commentId, options) => {
      const engine = new CollaborationEngine();
      const ok = engine.resolveComment(commentId, options.agent);

      if (ok) {
        console.log(`\n✅ Comment ${commentId} resolved by ${options.agent}\n`);
      } else {
        console.error(`\n❌ Could not resolve comment ${commentId}\n`);
      }
    });

  collabCmd
    .command('thread')
    .description('Create a review thread on a path')
    .argument('<docId>', 'Document identifier')
    .argument('<path>', 'Path to thread')
    .argument('<text>', 'Initial comment text')
    .option('--agent <id>', 'Agent identifier', 'agent-default')
    .action((docId, path, text, options) => {
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const thread = engine.createReviewThread(docId, path, options.agent, text);

      console.log(`\n🧵 Review Thread Created`);
      console.log(`   Thread ID: ${thread.id}`);
      console.log(`   Path:      ${thread.path}`);
      console.log(`   Status:    ${thread.status}`);
      console.log(`   Comments: ${thread.comments.length}\n`);
    });

  collabCmd
    .command('threads')
    .description('List review threads for a document')
    .argument('<docId>', 'Document identifier')
    .action((docId) => {
      const engine = new CollaborationEngine();
      const threads = engine.getReviewThreads(docId);

      console.log(`\n🧵 Review Threads for ${docId}: ${threads.length}`);
      threads.forEach((t) => {
        console.log(`   [${t.id}] ${t.path} — ${t.status} (${t.comments.length} comments)`);
      });
      console.log('');
    });

  collabCmd
    .command('reply')
    .description('Reply to a review thread')
    .argument('<threadId>', 'Thread identifier')
    .argument('<text>', 'Reply text')
    .option('--agent <id>', 'Agent identifier', 'agent-default')
    .action((threadId, text, options) => {
      const engine = new CollaborationEngine();
      const comment = engine.replyToThread(threadId, options.agent, text);

      if (comment) {
        console.log(`\n💬 Reply Added`);
        console.log(`   Comment ID: ${comment.id}`);
        console.log(`   Author:     ${comment.authorId}\n`);
      } else {
        console.error(`\n❌ Thread ${threadId} not found\n`);
      }
    });

  collabCmd
    .command('resolve-thread')
    .description('Resolve a review thread')
    .argument('<threadId>', 'Thread identifier')
    .option('--agent <id>', 'Agent resolving the thread', 'agent-default')
    .action((threadId, options) => {
      const engine = new CollaborationEngine();
      const ok = engine.resolveThread(threadId, options.agent);

      if (ok) {
        console.log(`\n✅ Thread ${threadId} resolved by ${options.agent}\n`);
      } else {
        console.error(`\n❌ Could not resolve thread ${threadId}\n`);
      }
    });

  collabCmd
    .command('activity')
    .description('Show activity feed for a document')
    .argument('<docId>', 'Document identifier')
    .option('--type <type>', 'Filter by activity type (agent_run, policy_decision, team_edit, comment, merge, branch, permission_change)')
    .option('--agent <id>', 'Filter by agent')
    .action((docId, options) => {
      const engine = new CollaborationEngine();
      const feed = engine.getActivityFeed(docId, options.type, options.agent);

      console.log(`\n📰 Activity Feed for ${docId}: ${feed.length} events`);
      feed.forEach((e) => {
        console.log(`   [${e.id}] ${e.type} by ${e.actorId}: ${JSON.stringify(e.payload)}`);
      });
      console.log('');
    });

  collabCmd
    .command('grant')
    .description('Grant a team permission on a document')
    .argument('<docId>', 'Document identifier')
    .argument('<agentId>', 'Agent to grant permission to')
    .argument('<permission>', 'Permission level: view, edit, admin')
    .option('--by <agent>', 'Agent granting the permission', 'agent-default')
    .action((docId, agentId, permission, options) => {
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const perm = engine.grantPermission(docId, agentId, permission, options.by);

      console.log(`\n🔑 Permission Granted`);
      console.log(`   Document: ${perm.docId}`);
      console.log(`   Agent:    ${perm.agentId}`);
      console.log(`   Level:    ${perm.permission}`);
      console.log(`   By:       ${perm.grantedBy}\n`);
    });

  collabCmd
    .command('revoke')
    .description('Revoke a team permission on a document')
    .argument('<docId>', 'Document identifier')
    .argument('<agentId>', 'Agent to revoke permission from')
    .option('--by <agent>', 'Agent revoking the permission', 'agent-default')
    .action((docId, agentId, options) => {
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const ok = engine.revokePermission(docId, agentId, options.by);

      if (ok) {
        console.log(`\n❌ Permission revoked for ${agentId} on ${docId}\n`);
      } else {
        console.error(`\n⚠️  No permission found for ${agentId} on ${docId}\n`);
      }
    });

  collabCmd
    .command('permissions')
    .description('List permissions for a document')
    .argument('<docId>', 'Document identifier')
    .action((docId) => {
      const engine = new CollaborationEngine();
      const perms = engine.getPermissions(docId);

      console.log(`\n🔐 Permissions for ${docId}:`);
      perms.forEach((p) => {
        console.log(`   ${p.agentId}: ${p.permission} (granted by ${p.grantedBy})`);
      });
      console.log('');
    });

  collabCmd
    .command('share')
    .description('Start a live share session for synchronous co-authoring')
    .argument('<docId>', 'Document identifier')
    .option('--host <id>', 'Host agent identifier', 'agent-default')
    .action((docId, options) => {
      const engine = new CollaborationEngine();
      engine.createSession(docId);
      const session = engine.startLiveShare(docId, options.host);

      console.log(`\n🔗 Live Share Started`);
      console.log(`   Session ID: ${session.sessionId}`);
      console.log(`   Document:   ${session.docId}`);
      console.log(`   Host:       ${session.hostId}`);
      console.log(`   Status:     ${session.status}\n`);
    });

  collabCmd
    .command('join-share')
    .description('Join a live share session')
    .argument('<sessionId>', 'Live share session ID')
    .option('--guest <id>', 'Guest agent identifier', 'agent-default')
    .action((sessionId, options) => {
      const engine = new CollaborationEngine();
      const ok = engine.joinLiveShare(sessionId, options.guest);

      if (ok) {
        console.log(`\n✅ Agent '${options.guest}' joined live share '${sessionId}'\n`);
      } else {
        console.error(`\n❌ Live share session '${sessionId}' not found or ended\n`);
      }
    });

  collabCmd
    .command('end-share')
    .description('End a live share session')
    .argument('<sessionId>', 'Live share session ID')
    .option('--by <agent>', 'Agent ending the session', 'agent-default')
    .action((sessionId, options) => {
      const engine = new CollaborationEngine();
      const ok = engine.endLiveShare(sessionId, options.by);

      if (ok) {
        console.log(`\n🛑 Live share '${sessionId}' ended by ${options.by}\n`);
      } else {
        console.error(`\n❌ Could not end live share '${sessionId}'\n`);
      }
    });

  collabCmd
    .command('shares')
    .description('List active live share sessions for a document')
    .argument('<docId>', 'Document identifier')
    .action((docId) => {
      const engine = new CollaborationEngine();
      const shares = engine.getLiveShares(docId);

      console.log(`\n🔗 Live Shares for ${docId}: ${shares.length}`);
      shares.forEach((s) => {
        console.log(`   [${s.sessionId}] host=${s.hostId} guests=${s.guests.join(',')} status=${s.status}`);
      });
      console.log('');
    });

  collabCmd
    .command('audit')
    .description('Query or export the audit log for compliance')
    .argument('<docId>', 'Document identifier')
    .option('--action <action>', 'Filter by action')
    .option('--actor <id>', 'Filter by actor')
    .option('--from <iso>', 'Filter from ISO timestamp')
    .option('--to <iso>', 'Filter to ISO timestamp')
    .option('--limit <n>', 'Max events to show', '50')
    .option('--export', 'Export full audit log as JSON')
    .action((docId, options) => {
      const engine = new CollaborationEngine();
      engine.createSession(docId);

      const opts: any = { limit: parseInt(options.limit, 10) };
      if (options.action) opts.action = options.action;
      if (options.actor) opts.actorId = options.actor;
      if (options.from) opts.from = new Date(options.from).getTime();
      if (options.to) opts.to = new Date(options.to).getTime();

      if (options.export) {
        console.log(engine.exportAuditLog());
      } else {
        const events = engine.queryAuditLog(opts);
        console.log(`\n📋 Audit Log for ${docId}: ${events.length} events`);
        events.forEach((e) => {
          console.log(`   [${e.id}] ${new Date(e.timestamp).toISOString()} ${e.actorId} -> ${e.action} on ${e.target}`);
        });
        console.log('');
      }
    });
}

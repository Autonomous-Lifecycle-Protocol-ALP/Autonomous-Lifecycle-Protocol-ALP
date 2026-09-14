/**
 * ALP Collaboration — team permission controls.
 */

import { PermissionLevel, TeamPermission } from './types';
import { ActivityFeed } from './activity';
import { AuditLog } from './audit';

export class PermissionManager {
  permissions = new Map<string, TeamPermission[]>();

  constructor(
    private activity: ActivityFeed,
    private audit: AuditLog,
  ) {}

  /**
   * Grant a team permission on a document.
   */
  grantPermission(docId: string, agentId: string, permission: PermissionLevel, grantedBy: string): TeamPermission {
    const existing = this.getPermissions(docId);
    const filtered = existing.filter(p => !(p.agentId === agentId && p.docId === docId));
    const perm: TeamPermission = { docId, agentId, permission, grantedAt: Date.now(), grantedBy };
    filtered.push(perm);
    this.permissions.set(docId, filtered);
    this.activity.logActivity(docId, 'permission_change', grantedBy, { action: 'grant', targetAgent: agentId, permission });
    this.audit.appendAudit(grantedBy, 'collab:grant_permission', docId, { agentId, permission });
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
    this.activity.logActivity(docId, 'permission_change', revokedBy, { action: 'revoke', targetAgent: agentId });
    this.audit.appendAudit(revokedBy, 'collab:revoke_permission', docId, { agentId });
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

  serializePermissions(): any[] {
    return Array.from(this.permissions.entries()).map(([docId, perms]) => ({ docId, permissions: perms }));
  }

  restorePermissions(entries: any[]): void {
    this.permissions = new Map((entries || []).map((p: any) => [p.docId, p.permissions || []]));
  }
}

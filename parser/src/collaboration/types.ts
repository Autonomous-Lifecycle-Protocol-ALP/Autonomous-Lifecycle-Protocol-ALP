/**
 * ALP Collaboration — shared type definitions.
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

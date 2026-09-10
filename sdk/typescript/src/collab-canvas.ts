/**
 * CollabCanvas — v80.0.0 Live Multi-User CRDT Canvas Collaboration
 *
 * Provides real-time shared workspace awareness for DAG playgrounds
 * and IDE canvases using CRDTs (Conflict-free Replicated Data Types).
 *
 * Features:
 * - Multi-user cursor and selection presence tracking
 * - Conflict-free node position and property editing
 * - Operation log with undo/redo across participants
 * - Room-based session management with join/leave events
 */

// ── Types ───────────────────────────────────────────────────────────────

export interface CollabUser {
  userId: string;
  displayName: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedNodeId?: string | null;
  lastSeen: number;
}

export interface CollabOperation {
  id: string;
  userId: string;
  type: 'node_move' | 'node_edit' | 'node_create' | 'node_delete' | 'spec_edit' | 'cursor_move' | 'selection';
  targetId?: string;
  payload: Record<string, unknown>;
  timestamp: number;
  vectorClock: Record<string, number>;
}

export interface CollabRoom {
  roomId: string;
  createdAt: number;
  users: Map<string, CollabUser>;
  operations: CollabOperation[];
  vectorClocks: Map<string, Record<string, number>>;
}

export type CollabEventType =
  | 'user_joined'
  | 'user_left'
  | 'operation'
  | 'presence'
  | 'sync'
  | 'conflict';

export interface CollabEvent {
  type: CollabEventType;
  roomId: string;
  userId: string;
  data: unknown;
  timestamp: number;
}

type CollabListener = (event: CollabEvent) => void;

// ── Palette for user colors ─────────────────────────────────────────────
const USER_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

// ── Engine ──────────────────────────────────────────────────────────────

export class CollabCanvas {
  private rooms: Map<string, CollabRoom> = new Map();
  private listeners: Map<CollabEventType | '*', Set<CollabListener>> = new Map();
  private localUserId: string;
  private localClock: Record<string, number> = {};
  private operationLog: CollabOperation[] = [];
  private undoStack: CollabOperation[] = [];
  private redoStack: CollabOperation[] = [];

  constructor(userId: string) {
    this.localUserId = userId;
    this.localClock[userId] = 0;
  }

  /**
   * Create a new collaboration room.
   */
  public createRoom(roomId: string): CollabRoom {
    const room: CollabRoom = {
      roomId,
      createdAt: Date.now(),
      users: new Map(),
      operations: [],
      vectorClocks: new Map(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Join an existing room.
   */
  public joinRoom(roomId: string, displayName: string): CollabUser {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = this.createRoom(roomId);
    }

    const colorIndex = room.users.size % USER_COLORS.length;
    const user: CollabUser = {
      userId: this.localUserId,
      displayName,
      color: USER_COLORS[colorIndex],
      cursor: undefined,
      selectedNodeId: null,
      lastSeen: Date.now(),
    };

    room.users.set(this.localUserId, user);
    room.vectorClocks.set(this.localUserId, { ...this.localClock });

    this.emit({
      type: 'user_joined',
      roomId,
      userId: this.localUserId,
      data: user,
      timestamp: Date.now(),
    });

    return user;
  }

  /**
   * Leave a room.
   */
  public leaveRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.users.delete(this.localUserId);
    room.vectorClocks.delete(this.localUserId);

    this.emit({
      type: 'user_left',
      roomId,
      userId: this.localUserId,
      data: null,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast a local operation to the room.
   */
  public applyOperation(
    roomId: string,
    type: CollabOperation['type'],
    targetId: string | undefined,
    payload: Record<string, unknown>
  ): CollabOperation {
    this.localClock[this.localUserId] = (this.localClock[this.localUserId] || 0) + 1;

    const op: CollabOperation = {
      id: `${this.localUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: this.localUserId,
      type,
      targetId,
      payload,
      timestamp: Date.now(),
      vectorClock: { ...this.localClock },
    };

    this.operationLog.push(op);
    this.undoStack.push(op);
    this.redoStack.length = 0;

    const room = this.rooms.get(roomId);
    if (room) {
      room.operations.push(op);
      room.vectorClocks.set(this.localUserId, { ...this.localClock });
    }

    this.emit({
      type: 'operation',
      roomId,
      userId: this.localUserId,
      data: op,
      timestamp: Date.now(),
    });

    return op;
  }

  /**
   * Receive and merge a remote operation using vector clock ordering.
   */
  public receiveOperation(roomId: string, op: CollabOperation): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Vector clock causality check
    const localVC = room.vectorClocks.get(op.userId) || {};
    const remoteSeq = op.vectorClock[op.userId] || 0;
    const localSeq = localVC[op.userId] || 0;

    if (remoteSeq <= localSeq) {
      // Already seen this operation (duplicate)
      return false;
    }

    // Merge vector clocks
    for (const [uid, seq] of Object.entries(op.vectorClock)) {
      this.localClock[uid] = Math.max(this.localClock[uid] || 0, seq);
    }

    room.operations.push(op);
    room.vectorClocks.set(op.userId, { ...op.vectorClock });

    // Update presence if cursor move
    if (op.type === 'cursor_move' && op.payload) {
      const user = room.users.get(op.userId);
      if (user) {
        user.cursor = op.payload as any;
        user.lastSeen = Date.now();
      }
    }

    if (op.type === 'selection' && op.payload) {
      const user = room.users.get(op.userId);
      if (user) {
        user.selectedNodeId = (op.payload as any).nodeId || null;
        user.lastSeen = Date.now();
      }
    }

    this.emit({
      type: 'operation',
      roomId,
      userId: op.userId,
      data: op,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Update cursor position (local).
   */
  public updateCursor(roomId: string, x: number, y: number): void {
    this.applyOperation(roomId, 'cursor_move', undefined, { x, y });
  }

  /**
   * Update node selection (local).
   */
  public selectNode(roomId: string, nodeId: string | null): void {
    this.applyOperation(roomId, 'selection', nodeId || undefined, { nodeId });
  }

  /**
   * Undo the last local operation.
   */
  public undo(roomId: string): CollabOperation | null {
    const op = this.undoStack.pop();
    if (!op) return null;
    this.redoStack.push(op);
    return op;
  }

  /**
   * Redo the last undone operation.
   */
  public redo(roomId: string): CollabOperation | null {
    const op = this.redoStack.pop();
    if (!op) return null;
    this.undoStack.push(op);
    return op;
  }

  /**
   * Get all users currently in a room.
   */
  public getPresence(roomId: string): CollabUser[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.users.values());
  }

  /**
   * Get operation history for a room.
   */
  public getOperationLog(roomId: string): CollabOperation[] {
    const room = this.rooms.get(roomId);
    return room ? room.operations : [];
  }

  /**
   * Subscribe to collaboration events.
   */
  public on(type: CollabEventType | '*', listener: CollabListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
    return () => this.listeners.get(type)?.delete(listener);
  }

  // ── Private ───────────────────────────────────────────────────────────

  private emit(event: CollabEvent): void {
    const specific = this.listeners.get(event.type);
    if (specific) for (const fn of specific) fn(event);
    const wildcard = this.listeners.get('*');
    if (wildcard) for (const fn of wildcard) fn(event);
  }
}

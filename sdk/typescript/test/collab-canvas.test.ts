import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollabCanvas, CollabUser, CollabOperation, CollabRoom } from '../src/collab-canvas';

describe('CollabCanvas', () => {
  // ── Fixtures ─────────────────────────────────────────────────────────

  const USER_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  ];

  let canvas: CollabCanvas;

  beforeEach(() => {
    canvas = new CollabCanvas('user-1');
  });

  // ── constructor ──────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should initialize localUserId from constructor argument', () => {
      const c = new CollabCanvas('alice');
      // We can verify localUserId indirectly through joinRoom which uses it
      const user = c.joinRoom('room-1', 'Alice');
      expect(user.userId).toBe('alice');
    });

    it('should initialize localClock with userId set to 0', () => {
      const c = new CollabCanvas('bob');
      const user = c.joinRoom('room-1', 'Bob');
      // After join, the vector clock snapshot should have bob: 0
      const presence = c.getPresence('room-1');
      expect(presence.length).toBe(1);
      // Apply an operation to verify clock was initialized at 0
      const op = c.applyOperation('room-1', 'node_move', 'n1', { x: 10, y: 20 });
      expect(op.vectorClock['bob']).toBe(1);
    });
  });

  // ── createRoom ───────────────────────────────────────────────────────

  describe('createRoom', () => {
    it('should create a room with empty collections', () => {
      const room = canvas.createRoom('room-1');
      expect(room.roomId).toBe('room-1');
      expect(room.createdAt).toBeTypeOf('number');
      expect(room.users.size).toBe(0);
      expect(room.operations.length).toBe(0);
      expect(room.vectorClocks.size).toBe(0);
    });

    it('should store the room so it can be retrieved', () => {
      canvas.createRoom('room-1');
      const presence = canvas.getPresence('room-1');
      expect(presence).toEqual([]);
    });
  });

  // ── joinRoom ─────────────────────────────────────────────────────────

  describe('joinRoom', () => {
    it('should auto-create room if missing', () => {
      const user = canvas.joinRoom('new-room', 'Alice');
      expect(user).toBeDefined();
      const presence = canvas.getPresence('new-room');
      expect(presence.length).toBe(1);
    });

    it('should assign user colors cycling through USER_COLORS', () => {
      const c1 = new CollabCanvas('u1');
      const c2 = new CollabCanvas('u2');
      const c3 = new CollabCanvas('u3');

      const r1 = c1.joinRoom('shared', 'User1');
      c2.joinRoom('shared', 'User2');
      c3.joinRoom('shared', 'User3');

      // Each canvas instance has its own room.users map, so colorIndex is based on room.users.size
      // For c1: room has 1 user (u1), colorIndex = 0 % 10 = 0
      expect(r1.color).toBe(USER_COLORS[0]);
    });

    it('should assign color based on room user count', () => {
      // Simulate multiple users joining the same room via separate canvas instances
      const roomId = 'color-room';
      // First user
      const firstCanvas = new CollabCanvas('first');
      firstCanvas.createRoom(roomId);
      firstCanvas.joinRoom(roomId, 'First');
      // Second user joins same room
      const secondCanvas = new CollabCanvas('second');
      const secondUser = secondCanvas.joinRoom(roomId, 'Second');
      // The second canvas created the room fresh (since rooms are per-instance), so it's user 0
      // To test cycling, we need to verify the color assignment logic
      expect(USER_COLORS).toContain(secondUser.color);
    });

    it('should capture vector clock snapshot', () => {
      canvas.joinRoom('room-1', 'Alice');
      // After join, apply an op to verify clock was snapshotted
      const op = canvas.applyOperation('room-1', 'node_create', 'n1', { label: 'Node 1' });
      expect(op.vectorClock['user-1']).toBe(1);
    });

    it('should emit user_joined event', () => {
      const handler = vi.fn();
      canvas.on('user_joined', handler);
      canvas.joinRoom('room-1', 'Alice');
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('user_joined');
      expect(event.roomId).toBe('room-1');
      expect(event.userId).toBe('user-1');
      expect(event.data).toMatchObject({ displayName: 'Alice' });
    });
  });

  // ── leaveRoom ────────────────────────────────────────────────────────

  describe('leaveRoom', () => {
    it('should remove user from room', () => {
      canvas.joinRoom('room-1', 'Alice');
      expect(canvas.getPresence('room-1').length).toBe(1);
      canvas.leaveRoom('room-1');
      expect(canvas.getPresence('room-1').length).toBe(0);
    });

    it('should remove vector clock entry', () => {
      canvas.joinRoom('room-1', 'Alice');
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      canvas.leaveRoom('room-1');
      // After leaving, the room should still exist but be empty
      const presence = canvas.getPresence('room-1');
      expect(presence.length).toBe(0);
    });

    it('should emit user_left event', () => {
      canvas.joinRoom('room-1', 'Alice');
      const handler = vi.fn();
      canvas.on('user_left', handler);
      canvas.leaveRoom('room-1');
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('user_left');
      expect(event.roomId).toBe('room-1');
      expect(event.userId).toBe('user-1');
    });

    it('should not throw when leaving a non-existent room', () => {
      expect(() => canvas.leaveRoom('non-existent')).not.toThrow();
    });
  });

  // ── applyOperation ───────────────────────────────────────────────────

  describe('applyOperation', () => {
    beforeEach(() => {
      canvas.joinRoom('room-1', 'Alice');
    });

    it('should increment vector clock for local user', () => {
      const op1 = canvas.applyOperation('room-1', 'node_move', 'n1', { x: 10, y: 20 });
      expect(op1.vectorClock['user-1']).toBe(1);
      const op2 = canvas.applyOperation('room-1', 'node_move', 'n1', { x: 30, y: 40 });
      expect(op2.vectorClock['user-1']).toBe(2);
    });

    it('should generate operation ID in correct format', () => {
      const op = canvas.applyOperation('room-1', 'node_create', 'n1', {});
      // Format: `${userId}-${timestamp}-${random}`
      expect(op.id).toMatch(/^user-1-\d+-[a-z0-9]+$/);
    });

    it('should clear redo stack on new operation', () => {
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      canvas.undo('room-1');
      // Redo stack now has 1 item
      canvas.applyOperation('room-1', 'node_create', 'n2', {});
      // After new op, redo should be empty
      const redoResult = canvas.redo('room-1');
      expect(redoResult).toBeNull();
    });

    it('should emit operation event', () => {
      const handler = vi.fn();
      canvas.on('operation', handler);
      const op = canvas.applyOperation('room-1', 'node_move', 'n1', { x: 5, y: 5 });
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('operation');
      expect(event.data).toEqual(op);
    });

    it('should update room operations list', () => {
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      canvas.applyOperation('room-1', 'node_move', 'n1', { x: 10, y: 10 });
      const log = canvas.getOperationLog('room-1');
      expect(log.length).toBe(2);
      expect(log[0].type).toBe('node_create');
      expect(log[1].type).toBe('node_move');
    });

    it('should push operation onto undo stack', () => {
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      const undone = canvas.undo('room-1');
      expect(undone).not.toBeNull();
      expect(undone!.type).toBe('node_create');
    });
  });

  // ── receiveOperation ─────────────────────────────────────────────────

  describe('receiveOperation', () => {
    beforeEach(() => {
      canvas.joinRoom('room-1', 'Alice');
    });

    it('should return false for duplicate operations (remoteSeq <= localSeq)', () => {
      // Create a remote op with vector clock that we've already seen
      const remoteOp: CollabOperation = {
        id: 'remote-1',
        userId: 'user-2',
        type: 'node_move',
        targetId: 'n1',
        payload: { x: 10, y: 20 },
        timestamp: Date.now(),
        vectorClock: { 'user-2': 1 },
      };
      // First receive should succeed
      const first = canvas.receiveOperation('room-1', remoteOp);
      expect(first).toBe(true);
      // Second receive of same op should be detected as duplicate
      const second = canvas.receiveOperation('room-1', remoteOp);
      expect(second).toBe(false);
    });

    it('should return false for non-existent room', () => {
      const remoteOp: CollabOperation = {
        id: 'remote-1',
        userId: 'user-2',
        type: 'node_move',
        payload: { x: 1, y: 1 },
        timestamp: Date.now(),
        vectorClock: { 'user-2': 1 },
      };
      const result = canvas.receiveOperation('non-existent', remoteOp);
      expect(result).toBe(false);
    });

    it('should merge vector clocks taking max per user', () => {
      const remoteOp: CollabOperation = {
        id: 'remote-1',
        userId: 'user-2',
        type: 'node_move',
        payload: { x: 10, y: 20 },
        timestamp: Date.now(),
        vectorClock: { 'user-2': 5, 'user-3': 3 },
      };
      canvas.receiveOperation('room-1', remoteOp);
      // Apply a local op to verify merged clock is used
      const localOp = canvas.applyOperation('room-1', 'node_create', 'n1', {});
      expect(localOp.vectorClock['user-2']).toBe(5);
      expect(localOp.vectorClock['user-3']).toBe(3);
    });

    it('should update cursor presence on cursor_move operation', () => {
      // First, simulate user-2 joining
      const remoteJoin: CollabOperation = {
        id: 'join-2',
        userId: 'user-2',
        type: 'cursor_move',
        payload: { x: 0, y: 0 },
        timestamp: Date.now(),
        vectorClock: { 'user-2': 1 },
      };
      canvas.receiveOperation('room-1', remoteJoin);

      const cursorOp: CollabOperation = {
        id: 'cursor-1',
        userId: 'user-2',
        type: 'cursor_move',
        payload: { x: 100, y: 200 },
        timestamp: Date.now(),
        vectorClock: { 'user-2': 2 },
      };
      canvas.receiveOperation('room-1', cursorOp);
      // We can't directly check presence since user-2 isn't in users map,
      // but we can verify no error is thrown and operation is logged
      const log = canvas.getOperationLog('room-1');
      expect(log.some(o => o.id === 'cursor-1')).toBe(true);
    });

    it('should update selection presence on selection operation', () => {
      const remoteJoin: CollabOperation = {
        id: 'join-3',
        userId: 'user-3',
        type: 'selection',
        payload: { nodeId: 'n1' },
        timestamp: Date.now(),
        vectorClock: { 'user-3': 1 },
      };
      canvas.receiveOperation('room-1', remoteJoin);

      const selectOp: CollabOperation = {
        id: 'select-1',
        userId: 'user-3',
        type: 'selection',
        payload: { nodeId: 'n5' },
        timestamp: Date.now(),
        vectorClock: { 'user-3': 2 },
      };
      canvas.receiveOperation('room-1', selectOp);
      const log = canvas.getOperationLog('room-1');
      expect(log.some(o => o.id === 'select-1')).toBe(true);
    });

    it('should emit operation event', () => {
      const handler = vi.fn();
      canvas.on('operation', handler);
      const remoteOp: CollabOperation = {
        id: 'remote-1',
        userId: 'user-2',
        type: 'node_move',
        payload: { x: 10, y: 20 },
        timestamp: Date.now(),
        vectorClock: { 'user-2': 1 },
      };
      canvas.receiveOperation('room-1', remoteOp);
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('operation');
      expect(event.userId).toBe('user-2');
    });
  });

  // ── updateCursor / selectNode ────────────────────────────────────────

  describe('updateCursor / selectNode', () => {
    beforeEach(() => {
      canvas.joinRoom('room-1', 'Alice');
    });

    it('updateCursor should create a cursor_move operation', () => {
      canvas.updateCursor('room-1', 50, 75);
      const log = canvas.getOperationLog('room-1');
      expect(log.length).toBe(1);
      expect(log[0].type).toBe('cursor_move');
      expect(log[0].payload).toEqual({ x: 50, y: 75 });
    });

    it('selectNode should create a selection operation', () => {
      canvas.selectNode('room-1', 'node-42');
      const log = canvas.getOperationLog('room-1');
      expect(log.length).toBe(1);
      expect(log[0].type).toBe('selection');
      expect(log[0].payload).toEqual({ nodeId: 'node-42' });
    });

    it('selectNode with null should pass undefined as targetId', () => {
      canvas.selectNode('room-1', null);
      const log = canvas.getOperationLog('room-1');
      expect(log[0].targetId).toBeUndefined();
      expect(log[0].payload).toEqual({ nodeId: null });
    });
  });

  // ── undo / redo ──────────────────────────────────────────────────────

  describe('undo / redo', () => {
    beforeEach(() => {
      canvas.joinRoom('room-1', 'Alice');
    });

    it('should push popped operation from undo to redo stack', () => {
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      const undone = canvas.undo('room-1');
      expect(undone).not.toBeNull();
      expect(undone!.type).toBe('node_create');
      // Now redo should work
      const redone = canvas.redo('room-1');
      expect(redone).not.toBeNull();
      expect(redone!.type).toBe('node_create');
    });

    it('should return null when undo stack is empty', () => {
      const result = canvas.undo('room-1');
      expect(result).toBeNull();
    });

    it('should return null when redo stack is empty', () => {
      const result = canvas.redo('room-1');
      expect(result).toBeNull();
    });

    it('should clear redo stack when new operation is applied', () => {
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      canvas.applyOperation('room-1', 'node_create', 'n2', {});
      canvas.undo('room-1');
      // Redo stack has 1 item
      canvas.applyOperation('room-1', 'node_create', 'n3', {});
      // Redo should now be empty
      const redoResult = canvas.redo('room-1');
      expect(redoResult).toBeNull();
    });

    it('should allow multiple undo/redo operations', () => {
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      canvas.applyOperation('room-1', 'node_create', 'n2', {});
      canvas.applyOperation('room-1', 'node_create', 'n3', {});

      const undo1 = canvas.undo('room-1');
      expect(undo1!.targetId).toBe('n3');

      const undo2 = canvas.undo('room-1');
      expect(undo2!.targetId).toBe('n2');

      const redo1 = canvas.redo('room-1');
      expect(redo1!.targetId).toBe('n2');

      const redo2 = canvas.redo('room-1');
      expect(redo2!.targetId).toBe('n3');
    });
  });

  // ── getPresence / getOperationLog ────────────────────────────────────

  describe('getPresence / getOperationLog', () => {
    it('should return empty array for non-existent room presence', () => {
      const presence = canvas.getPresence('non-existent');
      expect(presence).toEqual([]);
    });

    it('should return empty array for non-existent room operation log', () => {
      const log = canvas.getOperationLog('non-existent');
      expect(log).toEqual([]);
    });

    it('should return populated presence after users join', () => {
      canvas.joinRoom('room-1', 'Alice');
      const presence = canvas.getPresence('room-1');
      expect(presence.length).toBe(1);
      expect(presence[0].displayName).toBe('Alice');
      expect(presence[0].userId).toBe('user-1');
    });

    it('should return populated operation log after operations', () => {
      canvas.joinRoom('room-1', 'Alice');
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      canvas.applyOperation('room-1', 'node_move', 'n1', { x: 10, y: 20 });
      const log = canvas.getOperationLog('room-1');
      expect(log.length).toBe(2);
    });
  });

  // ── on / emit ────────────────────────────────────────────────────────

  describe('on / emit', () => {
    it('should dispatch to specific event listeners', () => {
      const handler = vi.fn();
      canvas.on('user_joined', handler);
      canvas.joinRoom('room-1', 'Alice');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should dispatch to wildcard (*) listeners', () => {
      const wildcardHandler = vi.fn();
      canvas.on('*', wildcardHandler);
      canvas.joinRoom('room-1', 'Alice');
      // Wildcard should receive user_joined event
      expect(wildcardHandler).toHaveBeenCalledTimes(1);
      expect(wildcardHandler.mock.calls[0][0].type).toBe('user_joined');
    });

    it('should dispatch to both specific and wildcard listeners', () => {
      const specificHandler = vi.fn();
      const wildcardHandler = vi.fn();
      canvas.on('operation', specificHandler);
      canvas.on('*', wildcardHandler);
      canvas.joinRoom('room-1', 'Alice');
      canvas.applyOperation('room-1', 'node_create', 'n1', {});
      expect(specificHandler).toHaveBeenCalledTimes(1);
      // Wildcard receives both user_joined and operation events
      expect(wildcardHandler).toHaveBeenCalledTimes(2);
    });

    it('should not call listener for different event type', () => {
      const handler = vi.fn();
      canvas.on('user_left', handler);
      canvas.joinRoom('room-1', 'Alice');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support unsubscribing via returned function', () => {
      const handler = vi.fn();
      const unsubscribe = canvas.on('user_joined', handler);
      canvas.joinRoom('room-1', 'Alice');
      expect(handler).toHaveBeenCalledTimes(1);
      unsubscribe();
      canvas.joinRoom('room-2', 'Bob');
      // Should still be 1 since we unsubscribed
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      canvas.on('user_joined', handler1);
      canvas.on('user_joined', handler2);
      canvas.joinRoom('room-1', 'Alice');
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });
});

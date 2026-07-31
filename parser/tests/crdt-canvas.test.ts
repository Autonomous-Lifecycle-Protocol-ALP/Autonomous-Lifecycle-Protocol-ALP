import { describe, it, expect } from 'vitest';
import { CRDTCanvasEngine } from '../src/crdt-canvas';

describe('v64.0.0 CRDTCanvasEngine — Real-Time Multiplayer CRDT Canvas & Presence Engine', () => {
  it('registers peer presence and updates cursor coordinates', () => {
    const engine = new CRDTCanvasEngine('canvas-test');
    const peer = engine.registerPeer('peer-1', 'Alice', '#ff4081');

    expect(peer.username).toBe('Alice');
    expect(peer.color).toBe('#ff4081');

    const updated = engine.updateCursor('peer-1', 120, 340, 'node-101');
    expect(updated?.cursor.x).toBe(120);
    expect(updated?.cursor.y).toBe(340);
    expect(updated?.activeNodeId).toBe('node-101');
  });

  it('applies CRDT node edits with incrementing versions', () => {
    const engine = new CRDTCanvasEngine();
    const node1 = engine.applyNodeEdit('node-1', 'Task A', 'TASK', { x: 50, y: 100 }, 'Initial Task');
    expect(node1.version).toBe(1);

    const node2 = engine.applyNodeEdit('node-1', 'Task A (Updated)', 'TASK', { x: 60, y: 110 }, 'Updated Task Content');
    expect(node2.version).toBe(2);
    expect(node2.title).toBe('Task A (Updated)');
  });

  it('exports a complete canvas snapshot with nodes and peers', () => {
    const engine = new CRDTCanvasEngine('canvas-snapshot');
    engine.registerPeer('peer-1', 'Alice');
    engine.registerPeer('peer-2', 'Bob');
    engine.applyNodeEdit('n1', 'Node 1', 'NOTE', { x: 10, y: 20 }, 'Note content');

    const snapshot = engine.exportCanvas();
    expect(snapshot.canvasId).toBe('canvas-snapshot');
    expect(snapshot.peers.length).toBe(2);
    expect(snapshot.nodes.length).toBe(1);
  });
});

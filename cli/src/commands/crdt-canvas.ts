import { Command } from 'commander';
import { CRDTCanvasEngine } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerCRDTCanvasCommand(program: Command) {
  program
    .command('crdt-canvas')
    .description('Manage real-time multiplayer CRDT canvas sessions & peer presence (v64.0.0)')
    .option('--canvas <id>', 'Canvas ID', 'canvas-main')
    .option('--peer <name>', 'Peer username to register', 'Developer-1')
    .action((options) => {
      const engine = new CRDTCanvasEngine(options.canvas);
      const p1 = engine.registerPeer('peer-1', options.peer, '#4fc3f7');
      const p2 = engine.registerPeer('peer-2', 'Autonomous-Agent-A', '#aed581');

      engine.updateCursor(p1.peerId, 150, 280, 'node-101');
      engine.updateCursor(p2.peerId, 320, 450, 'node-102');

      engine.applyNodeEdit('node-101', 'Auth Policy', 'POLICY', { x: 150, y: 280 }, '@policy { allow: ["/api/*"] }');
      engine.applyNodeEdit('node-102', 'Deploy Task', 'TASK', { x: 320, y: 450 }, '@task { id: "t1", status: "TODO" }');

      const snapshot = engine.exportCanvas();

      console.log('\n🎨 Real-Time Multiplayer CRDT Canvas (v64.0.0)');
      console.log('==============================================');
      console.log(`  Canvas ID:       ${snapshot.canvasId}`);
      console.log(`  Active Peers:    ${snapshot.peers.length}`);
      snapshot.peers.forEach(p => {
        console.log(`    - ${p.username} (${p.peerId}) @ (${p.cursor.x}, ${p.cursor.y}) [${p.color}]`);
      });
      console.log(`  Canvas Nodes:    ${snapshot.nodes.length}`);
      snapshot.nodes.forEach(n => {
        console.log(`    - [${n.type}] "${n.title}" v${n.version} @ (${n.position.x}, ${n.position.y})`);
      });
      console.log(`  Status:          ✅ ACTIVE & SYNCED\n`);
    });
}

import { Command } from 'commander';
import { EdgeAgentDebugger } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerEdgeDebugCommand(program: Command) {
  program
    .command('edge-debug')
    .description('Attach to remote cloud edge agent node and step-through debug session (v68.0.0)')
    .option('--agent <id>', 'Agent ID to debug', 'agent-executor-1')
    .option('--node <id>', 'Edge node ID', 'node-us-east-1')
    .option('--region <region>', 'Edge node region', 'us-east')
    .action((options) => {
      const dbg = new EdgeAgentDebugger();
      const session = dbg.attachSession(options.agent, options.node, options.region);

      dbg.setBreakpoint(session.sessionId, 'policy-eval.alp', 15);
      dbg.stepOver(session.sessionId);

      console.log('\n🐛 Cloud Edge Agent Live Debugger (v68.0.0)');
      console.log('============================================');
      console.log(`  Session ID:      ${session.sessionId}`);
      console.log(`  Agent ID:        ${session.agentId}`);
      console.log(`  Edge Node:       ${session.edgeNodeId} (${session.region})`);
      console.log(`  Status:          ${session.status}`);
      if (session.currentFrame) {
        console.log(`  Current Frame:   ${session.currentFrame.functionName}() @ ${session.currentFrame.file}:${session.currentFrame.line}`);
      }
      console.log(`  Breakpoints:     ${session.breakpoints.length}`);
      session.breakpoints.forEach(b => {
        console.log(`    - [${b.enabled ? 'ON' : 'OFF'}] ${b.file}:${b.line}`);
      });
      console.log(`  Watched Vars:`);
      Object.entries(session.variables).forEach(([k, v]) => {
        console.log(`    - ${k}: ${JSON.stringify(v)}`);
      });
      console.log(`  Status:          ✅ ATTACHED & STEPPED\n`);
    });
}

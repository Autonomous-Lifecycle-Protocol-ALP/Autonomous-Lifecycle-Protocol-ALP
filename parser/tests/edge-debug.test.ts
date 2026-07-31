import { describe, it, expect } from 'vitest';
import { EdgeAgentDebugger } from '../src/edge-debug';

describe('v68.0.0 EdgeAgentDebugger — Cloud Edge Agent Live Debugging & Breakpoint Engine', () => {
  it('attaches to a remote edge agent session and inspects frame & variables', () => {
    const dbg = new EdgeAgentDebugger();
    const session = dbg.attachSession('agent-executor-1', 'node-us-east-1', 'us-east');

    expect(session.status).toBe('PAUSED');
    expect(session.currentFrame?.functionName).toBe('executePolicy');
    expect(dbg.evaluateVariable(session.sessionId, 'tokenBalance')).toBe(45.0);
  });

  it('sets distributed breakpoints and steps over execution lines', () => {
    const dbg = new EdgeAgentDebugger();
    const session = dbg.attachSession('agent-tester', 'node-eu-west-1');

    const bp = dbg.setBreakpoint(session.sessionId, 'main.alp', 24);
    expect(bp?.line).toBe(24);

    const initialLine = session.currentFrame?.line || 0;
    const stepped = dbg.stepOver(session.sessionId);
    expect(stepped?.currentFrame?.line).toBe(initialLine + 1);
  });

  it('resumes execution status', () => {
    const dbg = new EdgeAgentDebugger();
    const session = dbg.attachSession('agent-runner', 'node-1');

    const resumed = dbg.resume(session.sessionId);
    expect(resumed?.status).toBe('RUNNING');
  });
});

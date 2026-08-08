import { describe, it, expect } from 'vitest';
import { CRDTCanvasEngine, WasmAstEvaluator, AgentCopilot } from '../src/index.js';

describe('CRDTCanvasEngine Enhancements', () => {
  it('manages canvas nodes and connection edges', () => {
    const engine = new CRDTCanvasEngine('canvas-test');
    engine.registerPeer('p1', 'Alice', '#ff4081');

    const n1 = engine.applyNodeEdit('node-1', '@policy security', 'POLICY', { x: 100, y: 100 }, 'Policy content');
    const n2 = engine.applyNodeEdit('node-2', '@task build', 'TASK', { x: 300, y: 100 }, 'Task content');

    expect(n1.version).toBe(1);
    expect(n2.version).toBe(1);

    const edge = engine.addEdge('node-1', 'node-2', 'GOVERNED_BY', 'governs');
    expect(edge.edgeId).toBe('edge-node-1-node-2');
    expect(engine.getEdges().length).toBe(1);

    const snapshot = engine.exportCanvas();
    expect(snapshot.canvasId).toBe('canvas-test');
    expect(snapshot.nodes.length).toBe(2);
    expect(snapshot.edges.length).toBe(1);
    expect(snapshot.peers.length).toBe(1);
  });

  it('removes connection edges', () => {
    const engine = new CRDTCanvasEngine('canvas-test-2');
    engine.addEdge('n1', 'n2', 'DEPENDS_ON');
    expect(engine.getEdges().length).toBe(1);

    const removed = engine.removeEdge('edge-n1-n2');
    expect(removed).toBe(true);
    expect(engine.getEdges().length).toBe(0);
  });
});

describe('WasmAstEvaluator Full Block & Directive Scanning', () => {
  it('parses all block types and extracts directives', () => {
    const evaluator = new WasmAstEvaluator();
    const content = `@policy name: "auth-gate"
!deprecated: "Use auth-gate-v2"
@task id: "deploy-service"
  depends_on: -> auth-gate
@contract name: "api-boundary"
@vault name: "secret-store"
`;
    const result = evaluator.parseAST(content);
    expect(result.ast.length).toBe(4);
    expect(result.ast.map(n => n.kind)).toEqual(['POLICY', 'TASK', 'CONTRACT', 'VAULT']);
    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].ruleId).toBe('wasm-deprecated-directive');
    expect(result.parseLatencyMs).toBeGreaterThan(0);
  });

  it('queries AST nodes by kind', () => {
    const evaluator = new WasmAstEvaluator();
    const content = `@task id: "t1"\n@task id: "t2"\n@agent name: "a1"`;
    const result = evaluator.parseAST(content);
    const tasks = evaluator.queryASTNodes(result.ast, 'TASK');
    expect(tasks.length).toBe(2);
    expect(tasks.map(t => t.name)).toEqual(['t1', 't2']);
  });
});

describe('AgentCopilot Natural Language Queries & Policy Generation', () => {
  it('queries workspace objects using natural language filters', () => {
    const copilot = new AgentCopilot();
    const workspace = [
      { _type: 'task', id: 't1', status: '[x]' },
      { _type: 'task', id: 't2', status: '[!]' },
      { _type: 'policy', id: 'p1' },
      { _type: 'agent', id: 'a1' },
    ];

    const blocked = copilot.queryWorkspace('show blocked tasks', workspace);
    expect(blocked.length).toBe(1);
    expect(blocked[0].id).toBe('t2');

    const policies = copilot.queryWorkspace('find policies', workspace);
    expect(policies.length).toBe(1);
    expect(policies[0].id).toBe('p1');
  });

  it('generates governance policies from usage patterns', () => {
    const copilot = new AgentCopilot();
    const spec = copilot.generatePolicyFromUsage('policy-sandbox-restrict', ['raw_sql', 'untrusted_exec']);
    expect(spec).toContain('@policy');
    expect(spec).toContain('id: policy-sandbox-restrict');
    expect(spec).toContain('"raw_sql"');
    expect(spec).toContain('"untrusted_exec"');
  });
});

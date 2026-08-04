import { describe, it, expect } from 'vitest';
import { WasmAstEvaluator } from '../src/wasm-ast';

describe('WasmAstEvaluator (v66.0.0)', () => {
  const evaluator = new WasmAstEvaluator();

  it('parses @policy, @task, and @agent blocks', () => {
    const content = `
@policy name: default-policy
@task name: task-1
@agent name: agent-1
`;
    const result = evaluator.parseAST(content);
    expect(result.ast).toHaveLength(3);
    const kinds = result.ast.map(n => n.kind);
    expect(kinds).toContain('POLICY');
    expect(kinds).toContain('TASK');
    expect(kinds).toContain('AGENT');
  });

  it('detects missing task name as diagnostic error', () => {
    const content = '@task\n';
    const result = evaluator.parseAST(content);
    const errors = result.diagnostics.filter(d => d.severity === 'ERROR');
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(result.ast[0].name).toBe('unnamed-task');
  });

  it('reports offlineValid=true when no errors', () => {
    const content = `
@policy name: safe
@task name: ok
`;
    const result = evaluator.parseAST(content);
    expect(result.offlineValid).toBe(true);
  });

  it('reports offlineValid=false when errors exist', () => {
    const content = '@task\n';
    const result = evaluator.parseAST(content);
    expect(result.offlineValid).toBe(false);
  });

  it('queries AST nodes by kind', () => {
    const content = `
@task name: t1
@task name: t2
@agent name: a1
`;
    const result = evaluator.parseAST(content);
    const tasks = evaluator.queryASTNodes(result.ast, 'TASK');
    expect(tasks).toHaveLength(2);
    const agents = evaluator.queryASTNodes(result.ast, 'AGENT');
    expect(agents).toHaveLength(1);
  });

  it('reports positive parse latency', () => {
    const content = '@policy name: p1\n';
    const result = evaluator.parseAST(content);
    expect(result.parseLatencyMs).toBeGreaterThan(0);
  });
});

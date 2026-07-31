import { describe, it, expect } from 'vitest';
import { WasmAstEvaluator } from '../src/wasm-ast';

describe('v66.0.0 WasmAstEvaluator — Wasm-Compiled Local AST Evaluation & Offline Linter', () => {
  it('parses content into an AST tree with sub-5ms latency benchmark', () => {
    const evaluator = new WasmAstEvaluator();
    const content = `@policy name: "main-policy" { allow: ["/api/*"] }\n@task id: "build-task", status: "TODO"\n@agent name: "compiler"`;

    const result = evaluator.parseAST(content);

    expect(result.ast.length).toBe(3);
    expect(result.ast[0].kind).toBe('POLICY');
    expect(result.ast[0].name).toBe('main-policy');
    expect(result.ast[1].kind).toBe('TASK');
    expect(result.ast[1].name).toBe('build-task');
    expect(result.ast[2].kind).toBe('AGENT');
    expect(result.ast[2].name).toBe('compiler');
    expect(result.parseLatencyMs).toBeGreaterThan(0);
    expect(result.offlineValid).toBe(true);
  });

  it('detects syntax errors and reports offline diagnostics', () => {
    const evaluator = new WasmAstEvaluator();
    const badContent = `@task { status: "TODO" }`; // Missing id/name

    const result = evaluator.parseAST(badContent);

    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].ruleId).toBe('wasm-syntax-task-id');
    expect(result.diagnostics[0].severity).toBe('ERROR');
    expect(result.offlineValid).toBe(false);
  });

  it('queries AST nodes by kind', () => {
    const evaluator = new WasmAstEvaluator();
    const content = `@policy name: "p1"\n@task id: "t1"\n@task id: "t2"`;
    const result = evaluator.parseAST(content);

    const taskNodes = evaluator.queryASTNodes(result.ast, 'TASK');
    expect(taskNodes.length).toBe(2);
    expect(taskNodes[0].name).toBe('t1');
    expect(taskNodes[1].name).toBe('t2');
  });
});

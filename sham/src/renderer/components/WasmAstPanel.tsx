import React, { useState } from 'react';
import { Icon } from './Icon.js';
import { WasmAstEvaluator, ASTNode, ASTDiagnostic } from '@autonomous-lifecycle-protocol-alp/parser';

const KIND_COLORS: Record<string, string> = {
  POLICY: '#aed581',
  TASK: '#4fc3f7',
  AGENT: '#ff8a65',
  CONTRACT: '#ce93d8',
  VAULT: '#ffd54f',
  MACRO: '#80deea',
  WORKFLOW: '#b388ff',
};

export function WasmAstPanel(): React.JSX.Element {
  const [evaluator] = useState(() => new WasmAstEvaluator());
  const [content, setContent] = useState<string>(
    `@policy name: "security-gate" { allow: ["/api/*"] }\n!deprecated: "Use security-gate-v2 instead"\n@task id: "build-workspace", status: "TODO"\n  depends_on: -> security-gate\n@agent name: "validator-1"`
  );

  const [astNodes, setAstNodes] = useState<ASTNode[]>([
    { id: 'ast-policy-1', kind: 'POLICY', name: 'security-gate', line: 1, column: 1, attributes: {}, children: [] },
    { id: 'ast-task-3', kind: 'TASK', name: 'build-workspace', line: 3, column: 1, attributes: { references: ['security-gate'] }, children: [] },
    { id: 'ast-agent-5', kind: 'AGENT', name: 'validator-1', line: 5, column: 1, attributes: {}, children: [] },
  ]);

  const [diagnostics, setDiagnostics] = useState<ASTDiagnostic[]>([
    { ruleId: 'wasm-deprecated-directive', severity: 'WARNING', message: 'Deprecated directive: Use security-gate-v2 instead', line: 2 },
  ]);
  const [parseLatencyMs, setParseLatencyMs] = useState<number>(0.42);
  const [offlineValid, setOfflineValid] = useState<boolean>(true);

  const handleEvaluate = () => {
    const res = evaluator.parseAST(content);
    setParseLatencyMs(res.parseLatencyMs);
    setAstNodes(res.ast);
    setDiagnostics(res.diagnostics);
    setOfflineValid(res.offlineValid);
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const },
    header: { padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' },
    body: { flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' },
    editorPane: { flex: 1, padding: 'var(--spacing-sm)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' as const, gap: 'clamp(6px, 1.5vw, 12px)', boxSizing: 'border-box' },
    astPane: { flex: 1, padding: 'var(--spacing-sm)', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 'clamp(6px, 1.5vw, 12px)', boxSizing: 'border-box' },
    textarea: { width: '100%', flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: 'clamp(6px, 1.5vw, 12px)', fontSize: 'var(--font-size-sm)', fontFamily: 'monospace', resize: 'none' as const, boxSizing: 'border-box' },
    btn: { background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--bg-primary)', padding: 'clamp(4px, 1vw, 8px) clamp(10px, 2vw, 16px)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600 },
  };

  return (
    <div style={styles.container}>
      <div className="panel-header" style={styles.header}>
        <div className="flex-wrap-gap">
          <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}><Icon name="zap" size={18} /></span>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--accent)' }}>Wasm-Compiled AST Evaluator</span>
          <span className="badge badge-responsive" style={{ background: 'var(--accent)22', color: 'var(--accent)', border: '1px solid var(--accent)44' }}>v66.0.0</span>
        </div>
        <div className="flex-wrap-gap">
          <span className="badge badge-responsive" style={{ background: 'var(--accent-blue)22', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)44' }}>Parse: {parseLatencyMs}ms (Sub-5ms Target)</span>
          <span className="badge badge-responsive" style={{ background: offlineValid ? 'var(--accent-green)22' : 'var(--accent-orange)22', color: offlineValid ? 'var(--accent-green)' : 'var(--accent-orange)', border: '1px solid ' + (offlineValid ? 'var(--accent-green)44' : 'var(--accent-orange)44') }}>{offlineValid ? <><Icon name="check" size={12} /> Offline Valid</> : <><Icon name="xCircle" size={12} /> Syntax Error</>}</span>
        </div>
      </div>

      <div className="panel-split" style={{ ...styles.body, flexDirection: 'row' }}>
        <div className="panel-split-sidebar" style={{ ...styles.editorPane, width: 'clamp(180px, 30vw, 400px)', maxWidth: '500px', minWidth: '200px' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>ALP Spec Source Input:</div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="input-field input-fluid"
            style={styles.textarea}
          />
          <button onClick={handleEvaluate} style={styles.btn} className="btn btn-sm btn-responsive">
            <Icon name="zap" size={16} /> Run Local Wasm AST Evaluation
          </button>
        </div>

        <div className="panel-split-main" style={{ ...styles.astPane, overflowY: 'auto' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Parsed AST Nodes ({astNodes.length}):</div>
          {astNodes.map(node => (
            <div key={node.id} className="card">
              <div className="flex-between">
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: KIND_COLORS[node.kind] || 'var(--accent-blue)' }}>{node.kind}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Line {node.line}</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{node.name}</div>
              {Array.isArray(node.attributes?.references) && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: '#ce93d8', marginTop: 4 }}>
                  References: {(node.attributes.references as string[]).join(', ')}
                </div>
              )}
            </div>
          ))}

          {diagnostics.length > 0 && (
            <div style={{ marginTop: 'clamp(6px, 1.5vw, 12px)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-orange)', fontWeight: 600, marginBottom: 8 }}>Offline Diagnostics ({diagnostics.length}):</div>
              {diagnostics.map((diag, i) => (
                <div key={i} className="card" style={{ border: `1px solid ${diag.severity === 'ERROR' ? 'var(--accent-red)' : 'var(--accent-orange)'}`, boxSizing: 'border-box' }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: diag.severity === 'ERROR' ? 'var(--accent-red)' : 'var(--accent-orange)', fontWeight: 600 }}>[Line {diag.line}] {diag.message}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>Rule: {diag.ruleId}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

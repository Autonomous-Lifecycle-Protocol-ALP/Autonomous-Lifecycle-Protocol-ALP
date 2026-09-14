import React, { useState } from 'react';
import { HubModel, ModelInvocationResult } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface PlaygroundTabProps {
  models: HubModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onInvokeModel: (modelId: string, input: string) => ModelInvocationResult;
}

export function PlaygroundTab({
  models,
  selectedModelId,
  onSelectModel,
  onInvokeModel,
}: PlaygroundTabProps): React.JSX.Element {
  const [prompt, setPrompt] = useState('Implement a rate limiter in TypeScript using token bucket algorithm.');
  const [result, setResult] = useState<ModelInvocationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const presets = [
    'Refactor auth middleware to use JWT and argon2',
    'Generate unit tests for DAG cycle detection algorithm',
    'Identify OWASP Top 10 vulnerabilities in this express route handler',
    'Synthesize an ALP state machine for swarm coordination',
  ];

  const handleRun = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const res = onInvokeModel(selectedModelId, prompt.trim());
      setResult(res);
      setLoading(false);
    }, 250);
  };

  const currentModel = models.find(m => m.modelId === selectedModelId) || models[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px', overflowY: 'auto' }}>
      {/* Top Model Selection Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Model:</span>
        <select
          value={selectedModelId}
          onChange={(e) => onSelectModel(e.target.value)}
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
          data-testid="playground-model-select"
        >
          {models.map(m => (
            <option key={m.modelId} value={m.modelId}>
              {m.name} ({m.provider} · {m.task})
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Context: <strong>{(currentModel.contextWindow / 1000).toFixed(0)}k</strong> · Cost: <strong>${currentModel.costPer1kTokens}/1k</strong>
        </span>
      </div>

      {/* Preset Prompt Chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {presets.map(p => (
          <button
            key={p}
            onClick={() => setPrompt(p)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              maxWidth: '300px',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Prompt Text Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Prompt Input:</label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prompt.length} chars</span>
        </div>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            resize: 'vertical',
          }}
          placeholder="Enter prompt to evaluate model performance..."
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={loading || !prompt.trim()}
            data-testid="playground-run-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 18px' }}
          >
            <Icon name={loading ? 'activity' : 'play'} size={14} />
            {loading ? 'Processing...' : 'Execute Prompt'}
          </button>
        </div>
      </div>

      {/* Response Box & Telemetry */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          {/* Telemetry KPIs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '100px', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LATENCY</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{result.latencyMs}ms</div>
            </div>
            <div style={{ flex: 1, minWidth: '100px', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOKENS USED</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                {typeof result.tokensUsed === 'number' ? result.tokensUsed : (result.tokensUsed as any).total}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '100px', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>COMPUTE COST</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>${result.cost}</div>
            </div>
          </div>

          {/* Output Content */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>MODEL RESPONSE ({result.modelId})</span>
              <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Fira Code, monospace', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {result.output || result.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

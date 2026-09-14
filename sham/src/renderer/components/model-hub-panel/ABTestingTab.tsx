import React, { useState } from 'react';
import { HubModel, ABTestResult } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface ABTestingTabProps {
  models: HubModel[];
  onRunABTest: (modelA: string, modelB: string, prompt: string) => ABTestResult;
}

export function ABTestingTab({ models, onRunABTest }: ABTestingTabProps): React.JSX.Element {
  const [modelAId, setModelAId] = useState(models[0]?.modelId || 'alp-coder-v3');
  const [modelBId, setModelBId] = useState(models[4]?.modelId || 'openai/gpt-4o');
  const [prompt, setPrompt] = useState('Write an optimized binary search tree in TypeScript with insert and delete operations.');
  const [testResult, setTestResult] = useState<ABTestResult | null>(null);

  const handleRunTest = () => {
    if (!prompt.trim() || modelAId === modelBId) return;
    const res = onRunABTest(modelAId, modelBId, prompt.trim());
    setTestResult(res);
  };

  const modelA = models.find(m => m.modelId === modelAId);
  const modelB = models.find(m => m.modelId === modelBId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', overflowY: 'auto' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Head-to-Head Model A/B Testing
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Evaluate two AI models simultaneously on identical inputs to compare accuracy, latency, and economics.
        </p>
      </div>

      {/* Model Selection Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>MODEL A:</label>
          <select
            value={modelAId}
            onChange={(e) => setModelAId(e.target.value)}
            style={{ width: '100%', marginTop: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', fontWeight: 600 }}
            data-testid="ab-model-a-select"
          >
            {models.map(m => (
              <option key={m.modelId} value={m.modelId}>{m.name} ({m.provider})</option>
            ))}
          </select>
        </div>

        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent)' }}>VS</span>

        <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>MODEL B:</label>
          <select
            value={modelBId}
            onChange={(e) => setModelBId(e.target.value)}
            style={{ width: '100%', marginTop: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', fontWeight: 600 }}
            data-testid="ab-model-b-select"
          >
            {models.map(m => (
              <option key={m.modelId} value={m.modelId}>{m.name} ({m.provider})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Prompt Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Benchmark Prompt:</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px',
            fontSize: '0.85rem',
            resize: 'vertical',
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleRunTest}
          disabled={!prompt.trim() || modelAId === modelBId}
          data-testid="run-ab-test-btn"
          style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px' }}
        >
          <Icon name="gitCompare" size={14} /> Run A/B Comparison
        </button>
      </div>

      {/* Side-by-Side Results Display */}
      {testResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
          {/* Winner Banner */}
          <div
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.15), rgba(245, 158, 11, 0.15))',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🏆</span>
              <div>
                <span style={{ fontWeight: 700, color: '#facc15' }}>Winner: {testResult.winner}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  (+{testResult.marginPercent}% composite margin)
                </span>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Latency Diff: <strong style={{ color: 'var(--text-primary)' }}>{testResult.metricsComparison.latencyDiffMs}ms</strong>
            </div>
          </div>

          {/* Comparison Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Model A Card */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: `1.5px solid ${testResult.winner === testResult.modelA.modelId ? '#facc15' : 'var(--border)'}`,
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{modelA?.name || testResult.modelA.modelId}</span>
                {testResult.winner === testResult.modelA.modelId && (
                  <span className="badge" style={{ background: '#facc1522', color: '#facc15', border: '1px solid #facc15' }}>WINNER</span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div>Latency: <strong style={{ color: 'var(--accent-blue)' }}>{testResult.resultA.latencyMs}ms</strong></div>
                <div>Cost: <strong>${testResult.resultA.cost}</strong></div>
                <div>Tokens: <strong>{testResult.resultA.tokensUsed}</strong></div>
                <div>Speed: <strong>{modelA?.latencyP50Ms}ms p50</strong></div>
              </div>
              <pre style={{ margin: 0, padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                {testResult.resultA.output}
              </pre>
            </div>

            {/* Model B Card */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: `1.5px solid ${testResult.winner === testResult.modelB.modelId ? '#facc15' : 'var(--border)'}`,
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{modelB?.name || testResult.modelB.modelId}</span>
                {testResult.winner === testResult.modelB.modelId && (
                  <span className="badge" style={{ background: '#facc1522', color: '#facc15', border: '1px solid #facc15' }}>WINNER</span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div>Latency: <strong style={{ color: 'var(--accent-blue)' }}>{testResult.resultB.latencyMs}ms</strong></div>
                <div>Cost: <strong>${testResult.resultB.cost}</strong></div>
                <div>Tokens: <strong>{testResult.resultB.tokensUsed}</strong></div>
                <div>Speed: <strong>{modelB?.latencyP50Ms}ms p50</strong></div>
              </div>
              <pre style={{ margin: 0, padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                {testResult.resultB.output}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

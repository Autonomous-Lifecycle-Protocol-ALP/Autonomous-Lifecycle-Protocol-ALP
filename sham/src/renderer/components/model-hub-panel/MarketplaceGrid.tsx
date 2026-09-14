import React, { useState } from 'react';
import { HubModel, ModelBenchmark } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface MarketplaceGridProps {
  models: HubModel[];
  onSelectModel: (modelId: string) => void;
  onBenchmarkModel: (modelId: string) => ModelBenchmark;
  onNavigateTab: (tab: 'playground' | 'abTest', modelId?: string) => void;
}

export function MarketplaceGrid({
  models,
  onSelectModel,
  onBenchmarkModel,
  onNavigateTab,
}: MarketplaceGridProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [benchmarks, setBenchmarks] = useState<Record<string, ModelBenchmark>>({});

  const tasks = ['all', 'code-gen', 'code-review', 'test-gen', 'security-scan', 'general'];
  const providers = ['all', 'alp-native', 'openai', 'anthropic', 'google'];

  const filtered = models.filter(m => {
    const matchesTask = selectedTask === 'all' || m.task === selectedTask;
    const matchesProvider = selectedProvider === 'all' || m.provider === selectedProvider || (selectedProvider === 'alp-native' && m.provider === 'alp');
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.modelId.toLowerCase().includes(search.toLowerCase());
    return matchesTask && matchesProvider && matchesSearch;
  });

  const handleRunBenchmark = (modelId: string) => {
    const bench = onBenchmarkModel(modelId);
    setBenchmarks(prev => ({ ...prev, [modelId]: bench }));
  };

  const providerColor = (p: string) => {
    switch (p) {
      case 'alp-native':
      case 'alp':
        return '#3b82f6';
      case 'openai':
        return '#10b981';
      case 'anthropic':
        return '#d97706';
      case 'google':
        return '#8b5cf6';
      default:
        return 'var(--accent)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '4px' }}>
      {/* Search and Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search models by name or id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            padding: '8px 14px',
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
            minWidth: '260px',
            flex: 1,
          }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {providers.map(p => (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              style={{
                background: selectedProvider === p ? providerColor(p) : 'var(--bg-secondary)',
                color: selectedProvider === p ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${selectedProvider === p ? providerColor(p) : 'var(--border)'}`,
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tasks.map(t => (
          <button
            key={t}
            onClick={() => setSelectedTask(t)}
            style={{
              background: selectedTask === t ? 'var(--accent)' : 'transparent',
              color: selectedTask === t ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${selectedTask === t ? 'var(--accent)' : 'var(--border)'}`,
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Models Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
        {filtered.map(model => {
          const bench = benchmarks[model.modelId];
          const pColor = providerColor(model.provider);

          return (
            <div
              key={model.modelId}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              data-testid={`model-card-${model.modelId}`}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {model.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {model.modelId}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: `${pColor}22`,
                      color: pColor,
                      border: `1px solid ${pColor}44`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {model.provider}
                  </span>
                </div>

                <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {model.description}
                </p>

                {/* Telemetry Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <div>Accuracy: <strong style={{ color: 'var(--accent-green)' }}>{(model.accuracy * 100).toFixed(1)}%</strong></div>
                  <div>Latency: <strong style={{ color: 'var(--accent-blue)' }}>{model.latencyP50Ms}ms p50</strong></div>
                  <div>Cost: <strong>${model.costPer1kTokens}/1k</strong></div>
                  <div>Context: <strong>{(model.contextWindow / 1000).toFixed(0)}k tokens</strong></div>
                </div>

                {/* Benchmark Display if run */}
                {bench && (
                  <div style={{ marginTop: '8px', padding: '6px 8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Benchmark Score: <strong style={{ color: '#60a5fa' }}>{bench.score}/100</strong></span>
                    <span>Throughput: <strong>{bench.throughputRps} req/s</strong></span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onNavigateTab('playground', model.modelId)}
                  style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Icon name="play" size={12} /> Test Run
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleRunBenchmark(model.modelId)}
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  title="Run standardized benchmark"
                >
                  Benchmark
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onNavigateTab('abTest', model.modelId)}
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  title="A/B test against another model"
                >
                  A/B
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

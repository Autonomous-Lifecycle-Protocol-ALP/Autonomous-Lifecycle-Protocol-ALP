import React, { useState, useMemo } from 'react';
import { ModelHubEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';
import { HubTab } from './shared.js';
import { MarketplaceGrid } from './MarketplaceGrid.js';
import { PlaygroundTab } from './PlaygroundTab.js';
import { ABTestingTab } from './ABTestingTab.js';
import { UsageTab } from './UsageTab.js';

export function ModelHubPanel(): React.JSX.Element {
  const engine = useMemo(() => {
    const eng = new ModelHubEngine();
    // Seed initial session invocations
    eng.invokeModel('alp/code-review-v2', 'Initial review check');
    eng.invokeModel('openai/gpt-4o', 'Sample reasoning query');
    return eng;
  }, []);

  const [activeTab, setActiveTab] = useState<HubTab>('marketplace');
  const [selectedModelId, setSelectedModelId] = useState<string>('alp-coder-v3');
  const [usageTick, setUsageTick] = useState(0);

  const models = useMemo(() => engine.searchModels(), [engine]);
  const usageReport = useMemo(() => engine.getUsageReport(), [engine, usageTick]);

  const handleBenchmark = (modelId: string) => {
    return engine.benchmarkModel(modelId);
  };

  const handleInvoke = (modelId: string, input: string) => {
    const res = engine.invokeModel(modelId, input);
    setUsageTick(t => t + 1);
    return res;
  };

  const handleABTest = (modelA: string, modelB: string, prompt: string) => {
    const res = engine.abTest(modelA, modelB, prompt);
    setUsageTick(t => t + 1);
    return res;
  };

  const handleNavigateTab = (tab: 'playground' | 'abTest', modelId?: string) => {
    if (modelId) setSelectedModelId(modelId);
    setActiveTab(tab);
  };

  const s = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
    },
    header: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box' as const,
      background: 'var(--bg-secondary)',
    },
    tabNav: {
      display: 'flex',
      gap: '4px',
      borderBottom: '1px solid var(--border)',
      padding: '0 var(--spacing-md)',
      background: 'var(--bg-secondary)',
    },
    tabBtn: (active: boolean) => ({
      padding: '8px 16px',
      background: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }),
    body: {
      flex: 1,
      overflow: 'hidden',
      padding: 'var(--spacing-md)',
      display: 'flex',
      flexDirection: 'column' as const,
    },
  };

  return (
    <div style={s.container} data-testid="model-hub-panel">
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--accent-blue)' }}><Icon name="cpu" size={20} /></span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>ALP AI Model Hub</span>
              <span className="badge" style={{ background: 'var(--accent-blue)22', color: 'var(--accent-blue)' }}>Curated Marketplace</span>
              <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>v82.0.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {models.length} Models Indexed across ALP, OpenAI, Anthropic & Google
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setActiveTab('playground')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.8rem' }}
          >
            <Icon name="play" size={14} /> Open Playground
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={s.tabNav}>
        <button style={s.tabBtn(activeTab === 'marketplace')} onClick={() => setActiveTab('marketplace')}>
          <Icon name="shoppingBag" size={14} /> Model Marketplace ({models.length})
        </button>
        <button style={s.tabBtn(activeTab === 'playground')} onClick={() => setActiveTab('playground')}>
          <Icon name="play" size={14} /> Prompt Playground
        </button>
        <button style={s.tabBtn(activeTab === 'abTest')} onClick={() => setActiveTab('abTest')}>
          <Icon name="gitCompare" size={14} /> A/B Testing
        </button>
        <button style={s.tabBtn(activeTab === 'usage')} onClick={() => setActiveTab('usage')}>
          <Icon name="activity" size={14} /> Usage & Telemetry
        </button>
      </div>

      {/* Main View Area */}
      <div style={s.body}>
        {activeTab === 'marketplace' && (
          <MarketplaceGrid
            models={models}
            onSelectModel={setSelectedModelId}
            onBenchmarkModel={handleBenchmark}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'playground' && (
          <PlaygroundTab
            models={models}
            selectedModelId={selectedModelId}
            onSelectModel={setSelectedModelId}
            onInvokeModel={handleInvoke}
          />
        )}

        {activeTab === 'abTest' && (
          <ABTestingTab
            models={models}
            onRunABTest={handleABTest}
          />
        )}

        {activeTab === 'usage' && (
          <UsageTab
            report={usageReport}
          />
        )}
      </div>
    </div>
  );
}

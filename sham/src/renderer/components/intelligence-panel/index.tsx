import React, { useState, useCallback } from 'react';
import { Icon } from '../Icon.js';
import type { IntelligenceSuggestion } from '../shared/types.js';
import { SuggestTab } from './SuggestTab.js';
import { DiagnoseTab } from './DiagnoseTab.js';

export interface IntelligencePanelProps {
  state: {
    suggestions: IntelligenceSuggestion[];
    output: string[];
  };
  onUpdateState: (state: { suggestions: IntelligenceSuggestion[]; output: string[] }) => void;
  onAppendOutput: (lines: string[]) => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ state, onUpdateState, onAppendOutput }) => {
  const [activeTab, setActiveTab] = useState<'suggest' | 'diagnose' | 'predict' | 'review'>('suggest');
  const [diagnoseInput, setDiagnoseInput] = useState('');
  const [predictInput, setPredictInput] = useState('');

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: 'var(--accent-blue)', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="cpu" size={18} /> IDE Intelligence (v80.0.0)</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          AI-powered suggestions, diagnostics, predictions, and automated code review
        </div>
      </div>

      <div className="tab-nav">
        {(['suggest', 'diagnose', 'predict', 'review'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="tab-nav-item"
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'suggest' ? (
        <SuggestTab
          suggestions={state.suggestions}
          output={state.output}
          onAppendOutput={onAppendOutput}
          onUpdateState={onUpdateState}
        />
      ) : (
        <DiagnoseTab
          diagnoseInput={diagnoseInput}
          predictInput={predictInput}
          onDiagnoseInputChange={setDiagnoseInput}
          onPredictInputChange={setPredictInput}
          onAppendOutput={onAppendOutput}
        />
      )}

      <div className="panel-header" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', maxHeight: 'clamp(100px, 20vh, 150px)', overflow: 'auto', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}>
        {state.output.map((line, i) => (
          <div key={i} style={{ color: line.includes('Error') ? 'var(--accent-red)' : line.includes('Outcome') || line.includes('Causes') || line.includes('Fixes') ? 'var(--accent-green)' : 'var(--text-muted)' }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

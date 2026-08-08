import React, { useState, useCallback } from 'react';
import { Icon } from './Icon.js';
import type { IntelligenceSuggestion } from '../shared/types.js';
import {
  intelligenceSuggest,
  intelligenceDiagnose,
  intelligencePredict,
  intelligenceReview,
} from '../shared/alp-client.js';

interface IntelligencePanelProps {
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

  const handleSuggest = useCallback(async () => {
    onAppendOutput(['[Intelligence] Analyzing workspace for gaps...']);
    const result = await intelligenceSuggest();
    if (result.success) {
      onUpdateState({ suggestions: result.suggestions, output: [...state.output, `[Intelligence] Found ${result.suggestions.length} suggestion(s)`] });
    } else {
      onAppendOutput([`[Intelligence] Error: ${result.error || 'unknown'}`]);
    }
  }, [onAppendOutput, onUpdateState, state.output]);

  const handleDiagnose = useCallback(async () => {
    if (!diagnoseInput.trim()) return;
    onAppendOutput([`[Intelligence] Diagnosing: ${diagnoseInput}`]);
    const result = await intelligenceDiagnose(diagnoseInput);
    if (result.success) {
      onAppendOutput([
        `[Intelligence] Causes: ${result.causes.join(', ')}`,
        `[Intelligence] Fixes: ${result.fixes.join(', ')}`,
      ]);
    } else {
      onAppendOutput([`[Intelligence] Error: ${result.error || 'unknown'}`]);
    }
  }, [diagnoseInput, onAppendOutput]);

  const handlePredict = useCallback(async () => {
    if (!predictInput.trim()) return;
    onAppendOutput([`[Intelligence] Predicting outcome for: ${predictInput}`]);
    const result = await intelligencePredict(predictInput);
    if (result.success) {
      onAppendOutput([`[Intelligence] Outcome: ${result.outcome} (confidence: ${Math.round(result.confidence * 100)}%)`]);
    } else {
      onAppendOutput([`[Intelligence] Error: ${result.error || 'unknown'}`]);
    }
  }, [predictInput, onAppendOutput]);

  const handleReview = useCallback(async () => {
    onAppendOutput(['[Intelligence] Running automated code review...']);
    const result = await intelligenceReview();
    if (result.success) {
      onAppendOutput([`[Intelligence] Found ${result.findings.length} finding(s)`]);
    } else {
      onAppendOutput([`[Intelligence] Error: ${result.error || 'unknown'}`]);
    }
  }, [onAppendOutput]);

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

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'suggest' && (
          <div className="card-container">
            <button onClick={handleSuggest} className="btn btn-lg" style={{
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
              color: 'var(--bg-primary)',
              fontWeight: 700,
            }}>
              Get Suggestions
            </button>
            {state.suggestions.length > 0 ? (
              <div className="card-container">
                {state.suggestions.map((s) => (
                  <div key={s.id} className="card">
                    <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{s.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>{s.description}</div>
                    <div style={{ color: 'var(--accent-yellow)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
                      Type: {s.type} | Confidence: {Math.round(s.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Icon name="zap" size={32} color="var(--text-muted)" /></div>
                <div className="empty-state-title">No suggestions yet</div>
                <div className="empty-state-desc">Click "Get Suggestions" to analyze your workspace.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnose' && (
          <div className="card-container">
            <div className="flex-wrap-gap">
              <input
                type="text"
                placeholder='e.g. "dependency cycle detected"'
                value={diagnoseInput}
                onChange={(e) => setDiagnoseInput(e.target.value)}
                className="input-field input-fluid"
                style={{ flex: 1 }}
              />
              <button onClick={handleDiagnose} disabled={!diagnoseInput.trim()} className="btn btn-sm btn-primary" style={{ background: 'var(--accent-purple)', color: 'var(--text-primary)', fontWeight: 600 }}>
                Diagnose
              </button>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Enter an error message to get likely causes and fix suggestions.</div>
          </div>
        )}

        {activeTab === 'predict' && (
          <div className="card-container">
            <div className="flex-wrap-gap">
              <input
                type="text"
                placeholder='e.g. task-login-ui'
                value={predictInput}
                onChange={(e) => setPredictInput(e.target.value)}
                className="input-field input-fluid"
                style={{ flex: 1 }}
              />
              <button onClick={handlePredict} disabled={!predictInput.trim()} className="btn btn-sm btn-primary" style={{ background: 'var(--accent-purple)', color: 'var(--text-primary)', fontWeight: 600 }}>
                Predict
              </button>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Predict task outcome based on dependency state and risk factors.</div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="card-container">
            <button onClick={handleReview} className="btn btn-lg" style={{
              background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
              color: 'var(--text-primary)',
              fontWeight: 700,
            }}>
              Run Code Review
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Automated review findings for `.alp` specs will appear in the output panel.</div>
          </div>
        )}
      </div>

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

import React, { useCallback } from 'react';
import { Icon } from '../Icon.js';
import type { IntelligenceSuggestion } from './shared.js';

interface SuggestTabProps {
  suggestions: IntelligenceSuggestion[];
  onAppendOutput: (lines: string[]) => void;
  onUpdateState: (state: { suggestions: IntelligenceSuggestion[]; output: string[] }) => void;
  output: string[];
}

export const SuggestTab: React.FC<SuggestTabProps> = ({ suggestions, onAppendOutput, onUpdateState, output }) => {
  const handleSuggest = useCallback(async () => {
    onAppendOutput(['[Intelligence] Analyzing workspace for gaps...']);
    const response = await fetch('/api/intelligence/suggest');
    const result = await response.json();
    if (result.success) {
      onUpdateState({ suggestions: result.suggestions, output: [...output, `[Intelligence] Found ${result.suggestions.length} suggestion(s)`] });
    } else {
      onAppendOutput([`[Intelligence] Error: ${result.error || 'unknown'}`]);
    }
  }, [onAppendOutput, onUpdateState, output]);

  return (
    <div className="card-container">
      <button onClick={handleSuggest} className="btn btn-lg" style={{
        background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
        color: 'var(--bg-primary)',
        fontWeight: 700,
      }}>
        Get Suggestions
      </button>
      {suggestions.length > 0 ? (
        <div className="card-container">
          {suggestions.map((s) => (
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
  );
};

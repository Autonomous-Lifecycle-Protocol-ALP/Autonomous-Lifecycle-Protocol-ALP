import React, { useCallback } from 'react';
import type { IntelligenceSuggestion } from '../shared/types.js';

interface DiagnoseTabProps {
  diagnoseInput: string;
  predictInput: string;
  onDiagnoseInputChange: (value: string) => void;
  onPredictInputChange: (value: string) => void;
  onAppendOutput: (lines: string[]) => void;
}

export const DiagnoseTab: React.FC<DiagnoseTabProps> = ({
  diagnoseInput,
  predictInput,
  onDiagnoseInputChange,
  onPredictInputChange,
  onAppendOutput,
}) => {
  const handleDiagnose = useCallback(async () => {
    if (!diagnoseInput.trim()) return;
    onAppendOutput([`[Intelligence] Diagnosing: ${diagnoseInput}`]);
    const response = await fetch('/api/intelligence/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: diagnoseInput }),
    });
    const result = await response.json();
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
    const response = await fetch('/api/intelligence/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: predictInput }),
    });
    const result = await response.json();
    if (result.success) {
      onAppendOutput([`[Intelligence] Outcome: ${result.outcome} (confidence: ${Math.round(result.confidence * 100)}%)`]);
    } else {
      onAppendOutput([`[Intelligence] Error: ${result.error || 'unknown'}`]);
    }
  }, [predictInput, onAppendOutput]);

  const handleReview = useCallback(async () => {
    onAppendOutput(['[Intelligence] Running automated code review...']);
    const response = await fetch('/api/intelligence/review');
    const result = await response.json();
    if (result.success) {
      onAppendOutput([`[Intelligence] Found ${result.findings.length} finding(s)`]);
    } else {
      onAppendOutput([`[Intelligence] Error: ${result.error || 'unknown'}`]);
    }
  }, [onAppendOutput]);

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div className="card-container">
        <div className="flex-wrap-gap">
          <input
            type="text"
            placeholder='e.g. "dependency cycle detected"'
            value={diagnoseInput}
            onChange={(e) => onDiagnoseInputChange(e.target.value)}
            className="input-field input-fluid"
            style={{ flex: 1 }}
          />
          <button onClick={handleDiagnose} disabled={!diagnoseInput.trim()} className="btn btn-sm btn-primary" style={{ background: 'var(--accent-purple)', color: 'var(--text-primary)', fontWeight: 600 }}>
            Diagnose
          </button>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Enter an error message to get likely causes and fix suggestions.</div>
      </div>

      <div className="card-container">
        <div className="flex-wrap-gap">
          <input
            type="text"
            placeholder='e.g. task-login-ui'
            value={predictInput}
            onChange={(e) => onPredictInputChange(e.target.value)}
            className="input-field input-fluid"
            style={{ flex: 1 }}
          />
          <button onClick={handlePredict} disabled={!predictInput.trim()} className="btn btn-sm btn-primary" style={{ background: 'var(--accent-purple)', color: 'var(--text-primary)', fontWeight: 600 }}>
            Predict
          </button>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Predict task outcome based on dependency state and risk factors.</div>
      </div>

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
    </div>
  );
};

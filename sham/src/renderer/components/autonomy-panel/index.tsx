import React, { useState, useCallback } from 'react';
import { Icon } from '../Icon.js';
import type { AutonomyDecision } from '../shared/types.js';
import { RunForm } from './RunForm.js';
import { ResultsView } from './ResultsView.js';

export interface AutonomyPanelProps {
  state: {
    decisions: AutonomyDecision[];
    output: string[];
  };
  onUpdateState: (state: { decisions: AutonomyDecision[]; output: string[] }) => void;
  onAppendOutput: (lines: string[]) => void;
}

export const AutonomyPanel: React.FC<AutonomyPanelProps> = ({ state, onUpdateState, onAppendOutput }) => {
  const [activeTab, setActiveTab] = useState<'run' | 'heal' | 'predict' | 'observe' | 'mutate' | 'decisions'>('run');
  const [workflowInput, setWorkflowInput] = useState('');
  const [observeInput, setObserveInput] = useState('latency');

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: 'var(--accent-pink)', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="refreshCw" size={18} /> Autonomous Orchestration (v80.0.0)</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          Self-healing DAGs, predictive governance, edge-native execution
        </div>
      </div>

      <div className="flex-wrap-gap" style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder='Workflow ID (e.g. wf-standard)'
          value={workflowInput}
          onChange={(e) => setWorkflowInput(e.target.value)}
          className="input-field input-fluid"
          style={{ flex: '1 1 clamp(150px, 40vw, 200px)' }}
        />
      </div>

      <div className="tab-nav">
        {(['run', 'heal', 'predict', 'observe', 'mutate', 'decisions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="tab-nav-item"
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? 'var(--accent-pink)' : 'transparent',
              color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'decisions' ? (
        <ResultsView
          decisions={state.decisions}
          output={state.output}
          onUpdateState={onUpdateState}
          onAppendOutput={onAppendOutput}
        />
      ) : (
        <RunForm
          workflowInput={workflowInput}
          observeInput={observeInput}
          onWorkflowInputChange={setWorkflowInput}
          onObserveInputChange={setObserveInput}
          onAppendOutput={onAppendOutput}
        />
      )}

      <div className="panel-header" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', maxHeight: 'clamp(100px, 20vh, 150px)', overflow: 'auto', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}>
        {state.output.map((line, i) => (
          <div key={i} style={{ color: line.includes('Error') ? 'var(--accent-red)' : line.includes('Outcome') ? 'var(--accent-green)' : 'var(--text-muted)' }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

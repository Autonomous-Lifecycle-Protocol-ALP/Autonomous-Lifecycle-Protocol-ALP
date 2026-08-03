import React, { useState, useCallback } from 'react';
import type { AutonomyDecision } from '../shared/types.js';
import {
  autonomyRun,
  autonomyHeal,
  autonomyPredict,
  autonomyObserve,
  autonomyMutate,
  autonomyDecisions,
} from '../shared/alp-client.js';

interface AutonomyPanelProps {
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

  const append = useCallback((...lines: string[]) => {
    onAppendOutput(lines);
  }, [onAppendOutput]);

  const handleRun = useCallback(async () => {
    append('[Autonomy] Starting autonomous swarm run...');
    const result = await autonomyRun(workflowInput || undefined);
    if (result.success) {
      append('[Autonomy] Swarm run started successfully');
    } else {
      append(`[Autonomy] Error: ${result.error || 'unknown'}`);
    }
  }, [workflowInput, append]);

  const handleHeal = useCallback(async () => {
    append('[Autonomy] Running self-healing diagnostics...');
    const result = await autonomyHeal();
    if (result.success) {
      append('[Autonomy] Healing diagnostics complete. Check workspace for auto-patches.');
    } else {
      append(`[Autonomy] Error: ${result.error || 'unknown'}`);
    }
  }, [append]);

  const handlePredict = useCallback(async () => {
    if (!workflowInput.trim()) return;
    append(`[Autonomy] Predicting outcome for workflow: ${workflowInput}`);
    const result = await autonomyPredict(workflowInput);
    if (result.success) {
      append(`[Autonomy] Outcome: ${result.outcome} (confidence: ${Math.round(result.confidence * 100)}%)`);
    } else {
      append(`[Autonomy] Error: ${result.error || 'unknown'}`);
    }
  }, [workflowInput, append]);

  const handleObserve = useCallback(async () => {
    append(`[Autonomy] Observing signal: ${observeInput}`);
    const result = await autonomyObserve(observeInput);
    if (result.success) {
      append('[Autonomy] Signal observed, runtime tuned.');
    } else {
      append(`[Autonomy] Error: ${result.error || 'unknown'}`);
    }
  }, [observeInput, append]);

  const handleMutate = useCallback(async () => {
    if (!workflowInput.trim()) return;
    append(`[Autonomy] Proposing mutation for workflow: ${workflowInput}`);
    const result = await autonomyMutate(workflowInput);
    if (result.success) {
      append('[Autonomy] Mutation proposed. Review before applying.');
    } else {
      append(`[Autonomy] Error: ${result.error || 'unknown'}`);
    }
  }, [workflowInput, append]);

  const handleDecisions = useCallback(async () => {
    append('[Autonomy] Fetching decisions...');
    const result = await autonomyDecisions();
    if (result.success) {
      onUpdateState({ decisions: result.decisions, output: [...state.output, `[Autonomy] ${result.decisions.length} decision(s) found`] });
    } else {
      append(`[Autonomy] Error: ${result.error || 'unknown'}`);
    }
  }, [append, onUpdateState, state.output]);

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: 'var(--accent-pink)', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700 }}>🔄 Autonomous Orchestration (v81.0.0)</h2>
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

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'run' && (
          <div className="card-container">
            <button onClick={handleRun} className="btn btn-lg" style={{
              background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
              color: 'var(--text-primary)',
              fontWeight: 700,
              marginBottom: '12px',
            }}>
              Start Autonomous Run
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Starts an autonomous swarm run for the specified workflow. If no workflow is specified, all ready tasks will be executed.
            </div>
          </div>
        )}

        {activeTab === 'heal' && (
          <div className="card-container">
            <button onClick={handleHeal} className="btn btn-lg" style={{
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
              color: 'var(--bg-primary)',
              fontWeight: 700,
              marginBottom: '12px',
            }}>
              Run Self-Healing Diagnostics
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Analyzes the workspace for issues and auto-patches ALP specifications.
            </div>
          </div>
        )}

        {activeTab === 'predict' && (
          <div className="card-container">
            <button onClick={handlePredict} disabled={!workflowInput.trim()} className="btn btn-lg" style={{
              background: 'var(--accent-purple)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              marginBottom: '12px',
            }}>
              Predict Workflow Outcome
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Predicts the outcome of a workflow based on current state and risk factors.
            </div>
          </div>
        )}

        {activeTab === 'observe' && (
          <div className="card-container">
            <div className="flex-wrap-gap">
              <input
                type="text"
                placeholder="Signal type (e.g. latency)"
                value={observeInput}
                onChange={(e) => setObserveInput(e.target.value)}
                className="input-field input-fluid"
                style={{ flex: 1 }}
              />
              <button onClick={handleObserve} className="btn btn-sm btn-primary" style={{ background: 'var(--accent-purple)', color: 'var(--text-primary)', fontWeight: 600 }}>
                Observe
              </button>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Observes an environment signal and tunes runtime parameters accordingly.
            </div>
          </div>
        )}

        {activeTab === 'mutate' && (
          <div className="card-container">
            <button onClick={handleMutate} disabled={!workflowInput.trim()} className="btn btn-lg" style={{
              background: 'var(--accent-yellow)',
              color: 'var(--bg-primary)',
              fontWeight: 700,
              marginBottom: '12px',
            }}>
              Propose Mutation
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Proposes a mutation to a running workflow (e.g. reroute tasks, adjust parallelism).
            </div>
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="card-container">
            <button onClick={handleDecisions} className="btn btn-lg" style={{
              background: 'var(--accent-red)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              marginBottom: '12px',
            }}>
              Refresh Decisions
            </button>
            {state.decisions.length > 0 ? (
              <div className="card-container">
                {state.decisions.map((d) => (
                  <div key={d.id} className="card">
                    <div style={{ fontWeight: 600, color: 'var(--accent-pink)' }}>{d.type}: {d.workflowId}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>{d.rationale}</div>
                    <div style={{ color: 'var(--accent-yellow)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
                      Confidence: {Math.round(d.confidence * 100)}% | {d.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No decisions recorded. Click "Refresh Decisions" to load.</div>
            )}
          </div>
        )}
      </div>

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

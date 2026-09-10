import React, { useState, useCallback } from 'react';
import type { AutonomyDecision } from '../shared/types.js';
import {
  autonomyRun,
  autonomyHeal,
  autonomyPredict,
  autonomyObserve,
  autonomyMutate,
} from '../../shared/alp-client.js';

interface RunFormProps {
  workflowInput: string;
  observeInput: string;
  onWorkflowInputChange: (value: string) => void;
  onObserveInputChange: (value: string) => void;
  onAppendOutput: (lines: string[]) => void;
}

export const RunForm: React.FC<RunFormProps> = ({
  workflowInput,
  observeInput,
  onWorkflowInputChange,
  onObserveInputChange,
  onAppendOutput,
}) => {
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

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
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

      <div className="card-container">
        <div className="flex-wrap-gap">
          <input
            type="text"
            placeholder="Signal type (e.g. latency)"
            value={observeInput}
            onChange={(e) => onObserveInputChange(e.target.value)}
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
    </div>
  );
};

import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { WorkflowReplayEngine, ReplayTrace } from '@autonomous-lifecycle-protocol-alp/parser';

interface ReplayControlsProps {
  engine: WorkflowReplayEngine;
  activeWorkflow: string;
  currentTrace: ReplayTrace | null;
  stepAction: string;
  agentId: string;
  stepOutput: string;
  onWorkflowChange: (value: string) => void;
  onStepActionChange: (value: string) => void;
  onAgentIdChange: (value: string) => void;
  onStepOutputChange: (value: string) => void;
  onStartTrace: () => void;
  onCaptureStep: () => void;
  onCompleteTrace: () => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  activeWorkflow,
  currentTrace,
  stepAction,
  agentId,
  stepOutput,
  onWorkflowChange,
  onStepActionChange,
  onAgentIdChange,
  onStepOutputChange,
  onStartTrace,
  onCaptureStep,
  onCompleteTrace,
}) => {
  return (
    <div className="grid-auto-fit-sm" style={{ marginBottom: '24px' }}>
      <div className="section-card">
        <h4 className="section-card-title">1. Trace Capture</h4>
        <div className="flex-wrap-gap">
          <input
            type="text"
            value={activeWorkflow}
            onChange={(e) => onWorkflowChange(e.target.value)}
            placeholder="Workflow ID..."
            className="input-field input-fluid"
          />
          <button
            onClick={onStartTrace}
            className="btn btn-sm btn-responsive btn-primary"
            style={{
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              color: 'var(--bg-primary)',
              fontWeight: 700,
            }}
          >
            Start Trace
          </button>
        </div>
        {currentTrace && (
          <button
            onClick={onCompleteTrace}
            disabled={currentTrace.status === 'COMPLETED'}
            className="btn btn-block btn-responsive"
            style={{
              width: '100%', padding: '8px',
              background: currentTrace.status === 'COMPLETED' ? 'var(--bg-secondary)' : 'var(--accent-red)22',
              color: currentTrace.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--accent-red)',
              border: '1px solid var(--accent-red)44',
              fontWeight: 600,
              boxSizing: 'border-box',
            }}
          >
            Seal Trace ({currentTrace.steps.length} steps)
          </button>
        )}
      </div>

      <div className="section-card">
        <h4 className="section-card-title">2. Record Action Step</h4>
        <div className="card-container">
          <div className="flex-wrap-gap">
            <input
              type="text"
              value={stepAction}
              onChange={(e) => onStepActionChange(e.target.value)}
              placeholder="Action..."
              className="input-field input-fluid"
              style={{ padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 10px)', fontSize: 'var(--font-size-xs)' }}
            />
            <input
              type="text"
              value={agentId}
              onChange={(e) => onAgentIdChange(e.target.value)}
              placeholder="Agent ID..."
              className="input-field input-fluid"
              style={{ padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 10px)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>
          <div className="flex-wrap-gap">
            <input
              type="text"
              value={stepOutput}
              onChange={(e) => onStepOutputChange(e.target.value)}
              placeholder="Step output snippet..."
              className="input-field input-fluid"
              style={{ flex: 1, padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 10px)', fontSize: 'var(--font-size-xs)' }}
            />
            <button
              onClick={onCaptureStep}
              disabled={!currentTrace || currentTrace.status === 'COMPLETED'}
              className="btn btn-sm btn-responsive"
              style={{ padding: '6px 14px', background: 'var(--accent-green)', color: 'var(--bg-primary)', fontWeight: 700 }}
            >
              + Step
            </button>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h4 className="section-card-title">3. Time-Travel Controls</h4>
        <div className="flex-wrap-gap" style={{ marginBottom: '12px' }}>
          <button
            onClick={() => {}}
            disabled={!currentTrace}
            className="btn btn-responsive btn-secondary"
            style={{
              flex: 1, padding: '8px', background: 'var(--bg-secondary)', color: 'var(--accent-blue)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontWeight: 600,
            }}
          >
            ◀ Step Back
          </button>
          <span className="badge badge-responsive" style={{ padding: '0 clamp(8px, 2vw, 12px)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
            #
          </span>
          <button
            onClick={() => {}}
            disabled={!currentTrace}
            className="btn btn-responsive btn-secondary"
            style={{
              flex: 1, padding: '8px', background: 'var(--bg-secondary)', color: 'var(--accent-blue)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontWeight: 600,
            }}
          >
            Step Fwd ▶
          </button>
        </div>
        {currentTrace && currentTrace.steps.length > 0 && (
          <input
            type="range"
            min="0"
            max={currentTrace.steps.length - 1}
            defaultValue="0"
            className="input-responsive"
            style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
          />
        )}
      </div>
    </div>
  );
};

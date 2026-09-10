import React from 'react';
import { Icon } from '../Icon.js';
import { ReplayStep } from './shared.js';

interface StepViewProps {
  currentTrace: { traceId: string; workflowId: string; steps: ReplayStep[]; status: string } | null;
  activeStepIndex: number;
  onSeek: (index: number) => void;
}

export const StepView: React.FC<StepViewProps> = ({ currentTrace, activeStepIndex, onSeek }) => {
  const activeStep: ReplayStep | undefined = currentTrace?.steps[activeStepIndex];

  if (!currentTrace) {
    return (
      <div className="section-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: '12px' }}>⏱️</div>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>No Active Replay Trace</h3>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Click "Start Trace" above to capture and inspect agent execution trajectories.</p>
      </div>
    );
  }

  return (
    <div className="panel-split" style={{ flexDirection: 'row', height: 'clamp(300px, 40vh, 500px)' }}>
      <div className="panel-split-sidebar" style={{ width: 'clamp(180px, 30vw, 340px)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 'var(--spacing-sm)', boxSizing: 'border-box' }}>
        <h3 className="section-card-title">
          Execution Trajectory ({currentTrace.steps.length} steps)
        </h3>
        <div className="card-container" style={{ gap: 'clamp(6px, 1.5vw, 10px)' }}>
          {currentTrace.steps.map((step) => {
            const isActive = step.stepIndex === activeStepIndex;
            return (
              <div
                key={step.stepIndex}
                onClick={() => onSeek(step.stepIndex)}
                className="card"
                style={{
                  padding: 'clamp(6px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--accent-blue)08' : 'var(--bg-secondary)',
                  border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
              >
                <div className="flex-wrap-gap">
                  <span className="list-item-icon" style={{
                    width: 'clamp(20px, 5vw, 28px)',
                    height: 'clamp(20px, 5vw, 28px)',
                    borderRadius: '50%',
                    background: isActive ? 'var(--accent-blue)' : 'var(--border)',
                    color: isActive ? 'var(--bg-primary)' : 'var(--text-primary)',
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
                  }}>
                    {step.stepIndex}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                      {step.action}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                      Agent: <span style={{ color: 'var(--text-secondary)' }}>{step.agentId}</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="table-responsive">
                    <div style={{ color: 'var(--accent-green)', fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', fontFamily: 'monospace' }}>
                      "{step.output}"
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '2px' }}>
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel-split-main" style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 'var(--spacing-sm)', overflow: 'auto', boxSizing: 'border-box' }}>
        <h3 className="section-card-title">
          <Icon name="search" size={16} /> Step #{activeStepIndex} State Inspector
        </h3>
        {activeStep ? (
          <div className="card-container">
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Action Name</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>{activeStep.action}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Agent ID</div>
              <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>{activeStep.agentId}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Execution Snapshot</div>
              <pre style={{ margin: '6px 0 0', background: 'var(--bg-primary)', padding: 'clamp(4px, 1vw, 8px)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-yellow)', fontSize: 'var(--font-size-xs)', overflowX: 'auto' }}>
                {JSON.stringify(activeStep.stateSnapshot, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="search" size={24} /></div>
            <div className="empty-state-title">No active step selected</div>
          </div>
        )}
      </div>
    </div>
  );
};

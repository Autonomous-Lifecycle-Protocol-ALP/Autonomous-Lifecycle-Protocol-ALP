import React, { useState } from 'react';
import { Icon } from './Icon.js';
import { WorkflowReplayEngine, ReplayTrace, ReplayStep, ReplayDiff } from '@autonomous-lifecycle-protocol-alp/parser';

export const WorkflowReplayPanel: React.FC = () => {
  const [engine] = useState(() => new WorkflowReplayEngine());
  const [activeWorkflow, setActiveWorkflow] = useState('wf-deploy-pipeline');
  const [currentTrace, setCurrentTrace] = useState<ReplayTrace | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepAction, setStepAction] = useState('compile-ast');
  const [agentId, setAgentId] = useState('agent-parser');
  const [stepOutput, setStepOutput] = useState('AST generated cleanly in 1.4ms');

  // Multi-trace comparison state
  const [compareTraceId, setCompareTraceId] = useState('');
  const [diffResults, setDiffResults] = useState<ReplayDiff[]>([]);

  const handleStartTrace = () => {
    const trace = engine.startTrace(activeWorkflow);
    // Seed initial steps
    engine.captureStep(trace.traceId, 'validate-schema', 'agent-linter', { valid: true }, '100% schema match');
    engine.captureStep(trace.traceId, 'compile-ast', 'agent-parser', { nodes: 142 }, 'AST generated cleanly');
    engine.captureStep(trace.traceId, 'execute-tests', 'agent-runner', { passed: 594 }, '594/594 tests passed');
    setCurrentTrace({ ...trace });
    setActiveStepIndex(trace.steps.length - 1);
  };

  const handleCaptureStep = () => {
    if (!currentTrace) return;
    engine.captureStep(currentTrace.traceId, stepAction, agentId, { timestamp: Date.now() }, stepOutput);
    const updated = engine.getTrace(currentTrace.traceId);
    if (updated) {
      setCurrentTrace({ ...updated });
      setActiveStepIndex(updated.steps.length - 1);
    }
  };

  const handleCompleteTrace = () => {
    if (!currentTrace) return;
    engine.completeTrace(currentTrace.traceId);
    const updated = engine.getTrace(currentTrace.traceId);
    if (updated) setCurrentTrace({ ...updated });
  };

  const handleSeek = (index: number) => {
    if (!currentTrace) return;
    const step = engine.seekToStep(currentTrace.traceId, index);
    if (step) setActiveStepIndex(index);
  };

  const handleStepBack = () => {
    if (!currentTrace || activeStepIndex <= 0) return;
    handleSeek(activeStepIndex - 1);
  };

  const handleStepForward = () => {
    if (!currentTrace || activeStepIndex >= currentTrace.steps.length - 1) return;
    handleSeek(activeStepIndex + 1);
  };

  const handleRunDiff = () => {
    if (!currentTrace || !compareTraceId) return;
    const diffs = engine.compareTraces(currentTrace.traceId, compareTraceId);
    setDiffResults(diffs);
  };

  const activeStep: ReplayStep | undefined = currentTrace?.steps[activeStepIndex];

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent-blue)', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, letterSpacing: '0.5px' }}>
            ⏱️ Workflow Replay & Time-Travel Debugger (v76.0.0)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Deterministic trace capture, step-back/step-forward state inspection, and divergence diff analysis
          </p>
        </div>
        <span className="badge badge-responsive" style={{ padding: '6px 12px', borderRadius: '20px', background: 'var(--accent-blue)10', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)30' }}>
          {currentTrace ? currentTrace.status : 'IDLE'}
        </span>
      </div>

      {/* Control Strip */}
      <div className="grid-auto-fit-sm" style={{ marginBottom: '24px' }}>
        {/* Trace Capture Control */}
        <div className="section-card">
          <h4 className="section-card-title">1. Trace Capture</h4>
          <div className="flex-wrap-gap">
            <input
              type="text"
              value={activeWorkflow}
              onChange={(e) => setActiveWorkflow(e.target.value)}
              placeholder="Workflow ID..."
              className="input-field input-fluid"
            />
            <button
              onClick={handleStartTrace}
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
              onClick={handleCompleteTrace}
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

        {/* Step Recorder */}
        <div className="section-card">
          <h4 className="section-card-title">2. Record Action Step</h4>
          <div className="card-container">
            <div className="flex-wrap-gap">
              <input
                type="text"
                value={stepAction}
                onChange={(e) => setStepAction(e.target.value)}
                placeholder="Action..."
                className="input-field input-fluid"
                style={{ padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 10px)', fontSize: 'var(--font-size-xs)' }}
              />
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="Agent ID..."
                className="input-field input-fluid"
                style={{ padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 10px)', fontSize: 'var(--font-size-xs)' }}
              />
            </div>
            <div className="flex-wrap-gap">
              <input
                type="text"
                value={stepOutput}
                onChange={(e) => setStepOutput(e.target.value)}
                placeholder="Step output snippet..."
                className="input-field input-fluid"
                style={{ flex: 1, padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 10px)', fontSize: 'var(--font-size-xs)' }}
              />
              <button
                onClick={handleCaptureStep}
                disabled={!currentTrace || currentTrace.status === 'COMPLETED'}
                className="btn btn-sm btn-responsive"
                style={{ padding: '6px 14px', background: 'var(--accent-green)', color: 'var(--bg-primary)', fontWeight: 700 }}
              >
                + Step
              </button>
            </div>
          </div>
        </div>

        {/* Time-Travel Debugger Controls */}
        <div className="section-card">
          <h4 className="section-card-title">3. Time-Travel Controls</h4>
          <div className="flex-wrap-gap" style={{ marginBottom: '12px' }}>
            <button
              onClick={handleStepBack}
              disabled={!currentTrace || activeStepIndex <= 0}
              className="btn btn-responsive btn-secondary"
              style={{
                flex: 1, padding: '8px', background: 'var(--bg-secondary)', color: 'var(--accent-blue)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontWeight: 600,
              }}
            >
              ◀ Step Back
            </button>
            <span className="badge badge-responsive" style={{ padding: '0 clamp(8px, 2vw, 12px)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
              #{activeStepIndex}
            </span>
            <button
              onClick={handleStepForward}
              disabled={!currentTrace || activeStepIndex >= (currentTrace?.steps.length ?? 1) - 1}
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
              value={activeStepIndex}
              onChange={(e) => handleSeek(parseInt(e.target.value, 10))}
              className="input-responsive"
              style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
            />
          )}
        </div>
      </div>

      {/* Main Trajectory & Inspector Display */}
      {currentTrace ? (
        <div className="panel-split" style={{ flexDirection: 'row', height: 'clamp(300px, 40vh, 500px)' }}>
          {/* Step Timeline */}
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
                    onClick={() => handleSeek(step.stepIndex)}
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
                        width: '28px', height: '28px',
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

          {/* Active Step Inspector */}
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
      ) : (
        <div className="section-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: '12px' }}>⏱️</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>No Active Replay Trace</h3>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Click "Start Trace" above to capture and inspect agent execution trajectories.</p>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
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
    <div style={{ padding: '24px', color: '#e6e6f0', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #2a2a3a', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#00f0ff', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.5px' }}>
            ⏱️ Workflow Replay & Time-Travel Debugger (v76.0.0)
          </h2>
          <p style={{ margin: '4px 0 0', color: '#9e9eb0', fontSize: '0.875rem' }}>
            Deterministic trace capture, step-back/step-forward state inspection, and divergence diff analysis
          </p>
        </div>
        <span style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)', fontSize: '0.8rem', fontWeight: 600 }}>
          {currentTrace ? currentTrace.status : 'IDLE'}
        </span>
      </div>

      {/* Control Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Trace Capture Control */}
        <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a' }}>
          <h4 style={{ margin: '0 0 12px', color: '#ff00ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. Trace Capture
          </h4>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={activeWorkflow}
              onChange={(e) => setActiveWorkflow(e.target.value)}
              placeholder="Workflow ID..."
              style={{ flex: 1, padding: '8px 12px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
            />
            <button
              onClick={handleStartTrace}
              style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00f0ff, #0066ff)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Start Trace
            </button>
          </div>
          {currentTrace && (
            <button
              onClick={handleCompleteTrace}
              disabled={currentTrace.status === 'COMPLETED'}
              style={{ width: '100%', padding: '8px', background: currentTrace.status === 'COMPLETED' ? '#2a2a3a' : 'rgba(255, 51, 102, 0.2)', color: currentTrace.status === 'COMPLETED' ? '#6c6c80' : '#ff3366', border: '1px solid rgba(255, 51, 102, 0.4)', borderRadius: '6px', fontWeight: 600, cursor: currentTrace.status === 'COMPLETED' ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
            >
              Seal Trace ({currentTrace.steps.length} steps)
            </button>
          )}
        </div>

        {/* Step Recorder */}
        <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a' }}>
          <h4 style={{ margin: '0 0 12px', color: '#00ff9d', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            2. Record Action Step
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={stepAction}
                onChange={(e) => setStepAction(e.target.value)}
                placeholder="Action..."
                style={{ flex: 1, padding: '6px 10px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
              />
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="Agent ID..."
                style={{ flex: 1, padding: '6px 10px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={stepOutput}
                onChange={(e) => setStepOutput(e.target.value)}
                placeholder="Step output snippet..."
                style={{ flex: 1, padding: '6px 10px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
              />
              <button
                onClick={handleCaptureStep}
                disabled={!currentTrace || currentTrace.status === 'COMPLETED'}
                style={{ padding: '6px 14px', background: '#00ff9d', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                + Step
              </button>
            </div>
          </div>
        </div>

        {/* Time-Travel Debugger Controls */}
        <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a' }}>
          <h4 style={{ margin: '0 0 12px', color: '#ffcc00', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            3. Time-Travel Controls
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={handleStepBack}
              disabled={!currentTrace || activeStepIndex <= 0}
              style={{ flex: 1, padding: '8px', background: '#161622', color: '#00f0ff', border: '1px solid #2a2a3a', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              ◀ Step Back
            </button>
            <span style={{ padding: '0 12px', fontWeight: 700, color: '#00f0ff', fontSize: '0.9rem' }}>
              #{activeStepIndex}
            </span>
            <button
              onClick={handleStepForward}
              disabled={!currentTrace || activeStepIndex >= (currentTrace?.steps.length ?? 1) - 1}
              style={{ flex: 1, padding: '8px', background: '#161622', color: '#00f0ff', border: '1px solid #2a2a3a', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
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
              style={{ width: '100%', accentColor: '#00f0ff' }}
            />
          )}
        </div>
      </div>

      {/* Main Trajectory & Inspector Display */}
      {currentTrace ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
          {/* Step Timeline */}
          <div style={{ background: '#0d0d14', borderRadius: '10px', border: '1px solid #2a2a3a', padding: '16px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#e6e6f0', fontSize: '1rem', fontWeight: 600 }}>
              Execution Trajectory ({currentTrace.steps.length} steps)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentTrace.steps.map((step) => {
                const isActive = step.stepIndex === activeStepIndex;
                return (
                  <div
                    key={step.stepIndex}
                    onClick={() => handleSeek(step.stepIndex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(0, 240, 255, 0.08)' : '#12121c',
                      border: isActive ? '1px solid #00f0ff' : '1px solid #1f1f2e',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isActive ? '#00f0ff' : '#2a2a3a',
                        color: isActive ? '#000' : '#e6e6f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        {step.stepIndex}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, color: isActive ? '#00f0ff' : '#e6e6f0', fontSize: '0.9rem' }}>
                          {step.action}
                        </div>
                        <div style={{ color: '#6c6c80', fontSize: '0.78rem' }}>
                          Agent: <span style={{ color: '#9e9eb0' }}>{step.agentId}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#00ff9d', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        "{step.output}"
                      </div>
                      <div style={{ color: '#6c6c80', fontSize: '0.72rem', marginTop: '2px' }}>
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Step Inspector */}
          <div style={{ background: '#0d0d14', borderRadius: '10px', border: '1px solid #2a2a3a', padding: '16px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#00f0ff', fontSize: '1rem', fontWeight: 600 }}>
              🔍 Step #{activeStepIndex} State Inspector
            </h3>
            {activeStep ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#161622', padding: '10px', borderRadius: '6px', border: '1px solid #2a2a3a' }}>
                  <div style={{ color: '#9e9eb0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action Name</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>{activeStep.action}</div>
                </div>
                <div style={{ background: '#161622', padding: '10px', borderRadius: '6px', border: '1px solid #2a2a3a' }}>
                  <div style={{ color: '#9e9eb0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Agent ID</div>
                  <div style={{ color: '#00ff9d', fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>{activeStep.agentId}</div>
                </div>
                <div style={{ background: '#161622', padding: '10px', borderRadius: '6px', border: '1px solid #2a2a3a' }}>
                  <div style={{ color: '#9e9eb0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Execution Snapshot</div>
                  <pre style={{ margin: '6px 0 0', background: '#0a0a14', padding: '8px', borderRadius: '4px', color: '#ffcc00', fontSize: '0.78rem', overflowX: 'auto' }}>
                    {JSON.stringify(activeStep.stateSnapshot, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div style={{ color: '#6c6c80', fontStyle: 'italic', fontSize: '0.85rem' }}>No active step selected</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '60px', textAlign: 'center', background: '#0d0d14', borderRadius: '10px', border: '1px border #2a2a3a', color: '#6c6c80' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏱️</div>
          <h3 style={{ color: '#e6e6f0', margin: '0 0 8px' }}>No Active Replay Trace</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Click "Start Trace" above to capture and inspect agent execution trajectories.</p>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { WorkflowReplayEngine, ReplayTrace } from '@autonomous-lifecycle-protocol-alp/parser';
import { ReplayControls } from './ReplayControls.js';
import { StepView } from './StepView.js';

export const WorkflowReplayPanel: React.FC = () => {
  const [engine] = useState(() => new WorkflowReplayEngine());
  const [activeWorkflow, setActiveWorkflow] = useState('wf-deploy-pipeline');
  const [currentTrace, setCurrentTrace] = useState<ReplayTrace | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepAction, setStepAction] = useState('compile-ast');
  const [agentId, setAgentId] = useState('agent-parser');
  const [stepOutput, setStepOutput] = useState('AST generated cleanly in 1.4ms');

  const handleStartTrace = () => {
    const trace = engine.startTrace(activeWorkflow);
    engine.captureStep(trace.traceId, 'validate-schema', 'agent-linter', { valid: true }, '100% schema match');
    engine.captureStep(trace.traceId, 'compile-ast', 'agent-parser', { nodes: 142 }, 'AST generated cleanly');
    engine.captureStep(trace.traceId, 'execute-tests', 'agent-runner', { passed: 594 }, '594/594 tests passed');
    setCurrentTrace(trace);
    setActiveStepIndex(trace.steps.length - 1);
  };

  const handleCaptureStep = () => {
    if (!currentTrace) return;
    engine.captureStep(currentTrace.traceId, stepAction, agentId, { timestamp: Date.now() }, stepOutput);
    const updated = engine.getTrace(currentTrace.traceId);
    if (updated) {
      setCurrentTrace(updated);
      setActiveStepIndex(updated.steps.length - 1);
    }
  };

  const handleCompleteTrace = () => {
    if (!currentTrace) return;
    engine.completeTrace(currentTrace.traceId);
    const updated = engine.getTrace(currentTrace.traceId);
    if (updated) setCurrentTrace(updated);
  };

  const handleSeek = (index: number) => {
    if (!currentTrace) return;
    const step = engine.seekToStep(currentTrace.traceId, index);
    if (step) setActiveStepIndex(index);
  };

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
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

      <ReplayControls
        engine={engine}
        activeWorkflow={activeWorkflow}
        currentTrace={currentTrace}
        stepAction={stepAction}
        agentId={agentId}
        stepOutput={stepOutput}
        onWorkflowChange={setActiveWorkflow}
        onStepActionChange={setStepAction}
        onAgentIdChange={setAgentId}
        onStepOutputChange={setStepOutput}
        onStartTrace={handleStartTrace}
        onCaptureStep={handleCaptureStep}
        onCompleteTrace={handleCompleteTrace}
      />

      <StepView
        currentTrace={currentTrace}
        activeStepIndex={activeStepIndex}
        onSeek={handleSeek}
      />
    </div>
  );
};

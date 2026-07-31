import React, { useState, useCallback } from 'react';
import {
  copilotSuggest,
  copilotApplyFix,
} from '../shared/alp-client.js';
import type { CopilotSuggestion, ALPDiagnostic } from '../shared/types.js';

// v62.0.0: Intent types from AgentCopilot
type CopilotIntent = 'CODE_GEN' | 'REFACTOR' | 'DEBUG' | 'EXPLAIN' | 'PLAN' | 'DELEGATE';

interface PlanStep {
  stepIndex: number;
  action: string;
  agentRole: string;
  rationale: string;
}

const INTENT_COLORS: Record<CopilotIntent, string> = {
  CODE_GEN: '#4fc3f7',
  REFACTOR: '#aed581',
  DEBUG: '#ff8a65',
  EXPLAIN: '#ce93d8',
  PLAN: '#ffd54f',
  DELEGATE: '#80cbc4',
};

const INTENT_ICONS: Record<CopilotIntent, string> = {
  CODE_GEN: '⚡',
  REFACTOR: '♻️',
  DEBUG: '🐛',
  EXPLAIN: '📖',
  PLAN: '🗺️',
  DELEGATE: '🤝',
};

function classifyIntent(prompt: string): CopilotIntent {
  const lower = prompt.toLowerCase();
  if (lower.includes('generate') || lower.includes('create') || lower.includes('write')) return 'CODE_GEN';
  if (lower.includes('refactor') || lower.includes('improve') || lower.includes('clean')) return 'REFACTOR';
  if (lower.includes('debug') || lower.includes('fix') || lower.includes('error') || lower.includes('bug')) return 'DEBUG';
  if (lower.includes('explain') || lower.includes('what does') || lower.includes('how does')) return 'EXPLAIN';
  if (lower.includes('delegate') || lower.includes('assign') || lower.includes('route')) return 'DELEGATE';
  return 'PLAN';
}

function buildPlan(intent: CopilotIntent): PlanStep[] {
  const plans: Record<CopilotIntent, PlanStep[]> = {
    CODE_GEN: [
      { stepIndex: 0, action: 'Analyze workspace context', agentRole: 'Context Analyzer', rationale: 'Understand existing patterns' },
      { stepIndex: 1, action: 'Scaffold code structure', agentRole: 'Code Generator', rationale: 'Create type-safe skeleton' },
      { stepIndex: 2, action: 'Implement business logic', agentRole: 'Code Generator', rationale: 'Fill implementation' },
      { stepIndex: 3, action: 'Generate unit tests', agentRole: 'Test Synthesizer', rationale: 'Ensure correctness' },
    ],
    REFACTOR: [
      { stepIndex: 0, action: 'Identify code smells', agentRole: 'Linter Agent', rationale: 'Spot improvement areas' },
      { stepIndex: 1, action: 'Apply refactoring patterns', agentRole: 'Refactor Agent', rationale: 'Improve quality' },
      { stepIndex: 2, action: 'Verify behavior parity', agentRole: 'Test Runner', rationale: 'No regressions' },
    ],
    DEBUG: [
      { stepIndex: 0, action: 'Capture error context', agentRole: 'Debug Collector', rationale: 'Gather stack trace' },
      { stepIndex: 1, action: 'Identify root cause', agentRole: 'Debug Analyst', rationale: 'Trace failure path' },
      { stepIndex: 2, action: 'Propose targeted fix', agentRole: 'Code Patcher', rationale: 'Generate patch' },
    ],
    EXPLAIN: [
      { stepIndex: 0, action: 'Parse code structure', agentRole: 'AST Analyzer', rationale: 'Understand topology' },
      { stepIndex: 1, action: 'Generate explanation', agentRole: 'Documentation Agent', rationale: 'Clear language' },
    ],
    PLAN: [
      { stepIndex: 0, action: 'Decompose task', agentRole: 'Task Planner', rationale: 'Break into steps' },
      { stepIndex: 1, action: 'Assign agents', agentRole: 'Orchestrator', rationale: 'Route to specialists' },
      { stepIndex: 2, action: 'Monitor execution', agentRole: 'Monitor Agent', rationale: 'Track and adapt' },
    ],
    DELEGATE: [
      { stepIndex: 0, action: 'Classify delegation target', agentRole: 'Router', rationale: 'Best-fit agent' },
      { stepIndex: 1, action: 'Dispatch task', agentRole: 'Orchestrator', rationale: 'Route with priority' },
    ],
  };
  return plans[intent];
}

interface CopilotPanelProps {
  suggestions: CopilotSuggestion[];
  output: string[];
  diagnostics: ALPDiagnostic[];
  onUpdateSuggestions: (suggestions: CopilotSuggestion[]) => void;
  onAppendOutput: (lines: string[]) => void;
}

export function CopilotPanel({
  suggestions,
  output,
  diagnostics,
  onUpdateSuggestions,
  onAppendOutput,
}: CopilotPanelProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'fix' | 'completion' | 'tip'>('all');
  const [intent, setIntent] = useState<CopilotIntent | null>(null);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'plan' | 'suggestions'>('chat');

  const handlePromptSubmit = useCallback(() => {
    if (!prompt.trim()) return;
    const detected = classifyIntent(prompt);
    setIntent(detected);
    setPlanSteps(buildPlan(detected));
    setActiveTab('plan');
    onAppendOutput([`[Copilot] Intent: ${detected}`, `[Copilot] Plan generated with ${buildPlan(detected).length} steps`]);
  }, [prompt, onAppendOutput]);

  const handleSuggest = useCallback(() => {
    if (!content.trim()) return;
    setLoading(true);
    copilotSuggest({ content, filePath: 'active-file.ts' }).then((result) => {
      if (result.success) onUpdateSuggestions(result.suggestions);
      setLoading(false);
      setActiveTab('suggestions');
    });
  }, [content, onUpdateSuggestions]);

  const filtered = filter === 'all' ? suggestions : suggestions.filter((s) => s.type === filter);

  const styles = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: '#0f0f1a', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
    header: { padding: '12px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', gap: 10 },
    tabs: { display: 'flex', borderBottom: '1px solid #1e2035' },
    tab: (active: boolean) => ({ padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: active ? '#a78bfa' : '#6b7280', borderBottom: active ? '2px solid #a78bfa' : '2px solid transparent', background: 'transparent', border: 'none', fontFamily: 'inherit' }),
    body: { flex: 1, overflowY: 'auto' as const, padding: 16 },
    intentBadge: (i: CopilotIntent) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: INTENT_COLORS[i] + '22', color: INTENT_COLORS[i], fontSize: 12, fontWeight: 600, border: `1px solid ${INTENT_COLORS[i]}44` }),
    planStep: { display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #1e2035' },
    stepBubble: { width: 24, height: 24, borderRadius: '50%', background: '#a78bfa22', border: '1px solid #a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#a78bfa', flexShrink: 0 },
    input: { width: '100%', background: '#16182a', border: '1px solid #2a2d4a', borderRadius: 8, color: '#e0e0e0', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const },
    btn: (color: string) => ({ background: color, border: 'none', borderRadius: 6, color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }),
    suggCard: { background: '#16182a', borderRadius: 8, padding: '10px 14px', marginBottom: 8, borderLeft: '3px solid #a78bfa' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={{ fontSize: 16 }}>🤖</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>Agent Copilot</span>
        <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 'auto' }}>v62.0.0</span>
      </div>

      <div style={styles.tabs}>
        {(['chat', 'plan', 'suggestions'] as const).map(tab => (
          <button key={tab} style={styles.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'chat' ? '💬 Chat' : tab === 'plan' ? '🗺️ Plan' : '✨ Suggestions'}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Describe what you want the copilot to do:</div>
            <textarea
              rows={3}
              placeholder='e.g. "generate a TypeScript async API handler" or "fix the auth bug"'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={{ ...styles.input, resize: 'none' }}
            />
            <button style={styles.btn('#a78bfa')} onClick={handlePromptSubmit}>
              🧠 Classify & Plan
            </button>

            {intent && (
              <div style={{ background: '#16182a', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Detected Intent:</div>
                <span style={styles.intentBadge(intent)}>
                  {INTENT_ICONS[intent]} {intent.replace('_', ' ')}
                </span>
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>Or get inline code suggestions:</div>
            <textarea
              rows={4}
              placeholder="Paste code for analysis..."
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ ...styles.input, fontFamily: 'monospace', resize: 'none' }}
            />
            <button style={styles.btn('#4fc3f7')} onClick={handleSuggest} disabled={loading}>
              {loading ? '⏳ Analyzing…' : '⚡ Get Suggestions'}
            </button>
          </div>
        )}

        {activeTab === 'plan' && (
          <div>
            {intent ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={styles.intentBadge(intent)}>{INTENT_ICONS[intent]} {intent.replace('_', ' ')}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{planSteps.length} steps</span>
                </div>
                {planSteps.map(step => (
                  <div key={step.stepIndex} style={styles.planStep}>
                    <div style={styles.stepBubble}>{step.stepIndex}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>{step.action}</div>
                      <div style={{ fontSize: 11, color: '#a78bfa', marginTop: 2 }}>{step.agentRole}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{step.rationale}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>
                💬 Enter a prompt in the Chat tab to generate a plan.
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' as const }}>
              {(['all', 'fix', 'completion', 'tip'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ ...styles.btn(filter === f ? '#a78bfa' : '#1e2035'), padding: '4px 12px', fontSize: 12 }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>
                ✨ No suggestions yet. Paste code in Chat and click "Get Suggestions".
              </div>
            ) : filtered.map((s, i) => (
              <div key={i} style={styles.suggCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>{s.type.toUpperCase()}</span>
                  <button
                    onClick={() => copilotApplyFix({ suggestion: s }).then(r => { if (r.success) onAppendOutput([`[Copilot] Applied fix: ${s.message}`]); })}
                    style={{ ...styles.btn('#4fc3f7'), padding: '2px 10px', fontSize: 11 }}
                  >
                    Apply
                  </button>
                </div>
                <div style={{ fontSize: 13, color: '#e0e0e0' }}>{s.message}</div>
                {s.replacement && (
                  <pre style={{ fontSize: 11, color: '#aed581', background: '#0a0a16', borderRadius: 6, padding: 8, marginTop: 6, overflowX: 'auto' }}>
                    {s.replacement}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {output.length > 0 && (
        <div style={{ borderTop: '1px solid #1e2035', padding: '8px 16px', maxHeight: 100, overflowY: 'auto' }}>
          {output.slice(-5).map((line, i) => (
            <div key={i} style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

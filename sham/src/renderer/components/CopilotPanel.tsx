import React, { useState, useCallback } from 'react';
import { Icon } from './Icon.js';
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
  CODE_GEN: 'zap',
  REFACTOR: 'refreshCw',
  DEBUG: 'bug',
  EXPLAIN: 'book',
  PLAN: 'map',
  DELEGATE: 'userPlus',
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
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const },
    header: { padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 },
    tabs: { display: 'flex', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
    tab: (active: boolean) => ({ padding: '8px 16px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: active ? 'var(--accent)' : 'var(--text-muted)', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', background: 'transparent', border: 'none', fontFamily: 'inherit' }),
    body: { flex: 1, overflowY: 'auto' as const, padding: 'var(--spacing-sm)', boxSizing: 'border-box' as const },
    intentBadge: (i: CopilotIntent) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: INTENT_COLORS[i] + '22', color: INTENT_COLORS[i], fontSize: 'var(--font-size-xs)', fontWeight: 600, border: `1px solid ${INTENT_COLORS[i]}44` }),
    planStep: { display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' },
    stepBubble: { width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)22', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--accent)', flexShrink: 0 },
    input: { width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: 'var(--font-size-sm)', fontFamily: 'inherit', boxSizing: 'border-box' as const },
    btn: (color: string) => ({ background: color, border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600 }),
    suggCard: { background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 8, borderLeft: '3px solid var(--accent)' },
  };

  return (
    <div style={styles.container}>
      <div className="panel-header">
        <div className="flex-wrap-gap">
          <span style={{ fontSize: 'var(--font-size-md)' }}><Icon name="bot" size={18} /></span>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--accent)' }}>Agent Copilot</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>v62.0.0</span>
        </div>
      </div>

      <div className="tab-nav">
        {(['chat', 'plan', 'suggestions'] as const).map(tab => (
          <button key={tab} style={styles.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'chat' ? <><Icon name="messageCircle" size={14} /> Chat</> : tab === 'plan' ? <><Icon name="map" size={14} /> Plan</> : <><Icon name="star" size={14} /> Suggestions</>}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {activeTab === 'chat' && (
          <div className="card-container">
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Describe what you want the copilot to do:</div>
            <textarea
              rows={3}
              placeholder='e.g. "generate a TypeScript async API handler" or "fix the auth bug"'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="input-field input-fluid"
              style={{ ...styles.input, resize: 'none', fontFamily: 'inherit' }}
            />
            <button className="btn btn-responsive" style={styles.btn('var(--accent)')} onClick={handlePromptSubmit}>
              <Icon name="cpu" size={14} /> Classify & Plan
            </button>

            {intent && (
              <div className="card">
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>Detected Intent:</div>
                <span style={styles.intentBadge(intent)}>
                  {INTENT_ICONS[intent]} {intent.replace('_', ' ')}
                </span>
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Or get inline code suggestions:</div>
            <textarea
              rows={4}
              placeholder="Paste code for analysis..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="input-field input-fluid"
              style={{ ...styles.input, fontFamily: 'monospace', resize: 'none' }}
            />
            <button className="btn btn-responsive" style={styles.btn('var(--accent-blue)')} onClick={handleSuggest} disabled={loading}>
              {loading ? <><Icon name="refreshCw" size={14} /> Analyzing…</> : <><Icon name="zap" size={14} /> Get Suggestions</>}
            </button>
          </div>
        )}

        {activeTab === 'plan' && (
          <div>
            {intent ? (
              <>
                <div className="flex-wrap-gap" style={{ marginBottom: 16 }}>
                  <span style={styles.intentBadge(intent)}><Icon name={INTENT_ICONS[intent] as any} size={14} /> {intent.replace('_', ' ')}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{planSteps.length} steps</span>
                </div>
                {planSteps.map(step => (
                  <div key={step.stepIndex} style={styles.planStep}>
                    <div style={styles.stepBubble}>{step.stepIndex}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{step.action}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent)', marginTop: 2 }}>{step.agentRole}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{step.rationale}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Icon name="messageCircle" size={32} color="var(--text-muted)" /></div>
                <div className="empty-state-title">No plan generated</div>
                <div className="empty-state-desc">Enter a prompt in the Chat tab to generate a plan.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            <div className="flex-wrap-gap" style={{ marginBottom: 12 }}>
              {(['all', 'fix', 'completion', 'tip'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ ...styles.btn(filter === f ? 'var(--accent)' : 'var(--border)'), padding: '4px 12px', fontSize: 'var(--font-size-xs)' }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Icon name="zap" size={32} color="var(--text-muted)" /></div>
                <div className="empty-state-title">No suggestions</div>
                <div className="empty-state-desc">Paste code in Chat and click "Get Suggestions".</div>
              </div>
            ) : filtered.map((s, i) => (
              <div key={i} className="card" style={{ ...styles.suggCard }}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent)', fontWeight: 600 }}>{s.type.toUpperCase()}</span>
                  <button
                    onClick={() => copilotApplyFix({ filePath: 'untitled.alp', suggestionId: (s as unknown as { id: string }).id ?? 's-1' }).then(r => { if (r.success) onAppendOutput([`[Copilot] Applied fix: ${s.message}`]); })}
                    className="btn btn-sm"
                    style={{ ...styles.btn('var(--accent-blue)'), padding: '2px 10px', fontSize: 'var(--font-size-xs)' }}
                  >
                    Apply
                  </button>
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{s.message}</div>
                {(s as unknown as { replacement?: string }).replacement && (
                  <pre style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-green)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: 8, marginTop: 6, overflowX: 'auto' }} className="table-responsive">
                    {(s as unknown as { replacement?: string }).replacement}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {output.length > 0 && (
        <div className="panel-header" style={{ borderTop: '1px solid var(--border)', maxHeight: 'clamp(80px, 15vh, 100px)', overflowY: 'auto' }}>
          {output.slice(-5).map((line, i) => (
            <div key={i} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

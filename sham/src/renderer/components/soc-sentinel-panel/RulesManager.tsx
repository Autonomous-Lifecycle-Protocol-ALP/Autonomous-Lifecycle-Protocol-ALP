import React, { useState } from 'react';
import { DetectionRule, ThreatSeverity, RemediationAction } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface RulesManagerProps {
  rules: DetectionRule[];
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  onAddRule: (ruleId: string, name: string, pattern: string, severity: ThreatSeverity, action: RemediationAction) => void;
}

export function RulesManager({ rules, onToggleRule, onAddRule }: RulesManagerProps): React.JSX.Element {
  const [showAddForm, setShowAddForm] = useState(false);
  const [ruleId, setRuleId] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [pattern, setPattern] = useState('');
  const [severity, setSeverity] = useState<ThreatSeverity>('HIGH');
  const [action, setAction] = useState<RemediationAction>('ISOLATE_AGENT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleId || !ruleName || !pattern) return;
    onAddRule(ruleId, ruleName, pattern, severity, action);
    setRuleId('');
    setRuleName('');
    setPattern('');
    setShowAddForm(false);
  };

  const severityColor = (sev: ThreatSeverity) => {
    switch (sev) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Threat Detection Rules Engine
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time heuristic & signature matching policies triggered on swarm message ingestion.
          </p>
        </div>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          data-testid="add-rule-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px' }}
        >
          <Icon name="plus" size={14} /> Add Detection Rule
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Rule ID:</label>
            <input
              type="text"
              placeholder="rule-prompt-injection"
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value)}
              style={{ width: '100%', marginTop: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Rule Name:</label>
            <input
              type="text"
              placeholder="Prompt Injection Attempt"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              style={{ width: '100%', marginTop: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pattern (Regex / Substring):</label>
            <input
              type="text"
              placeholder="ignore previous instructions|system prompt leak"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              style={{ width: '100%', marginTop: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Severity:</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as ThreatSeverity)}
              style={{ width: '100%', marginTop: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px' }}
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Remediation Action:</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as RemediationAction)}
              style={{ width: '100%', marginTop: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px' }}
            >
              <option value="ISOLATE_AGENT">ISOLATE_AGENT</option>
              <option value="REVOKE_CREDENTIALS">REVOKE_CREDENTIALS</option>
              <option value="BLOCK_IP">BLOCK_IP</option>
              <option value="ROLLBACK_DEPLOY">ROLLBACK_DEPLOY</option>
              <option value="PATCH_VULNERABILITY">PATCH_VULNERABILITY</option>
              <option value="QUARANTINE_FILE">QUARANTINE_FILE</option>
              <option value="NOTIFY_TEAM">NOTIFY_TEAM</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-sm btn-primary">Save Rule</button>
          </div>
        </form>
      )}

      {/* Rules Table */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 14px' }}>Rule</th>
              <th style={{ padding: '10px 14px' }}>Pattern</th>
              <th style={{ padding: '10px 14px' }}>Severity</th>
              <th style={{ padding: '10px 14px' }}>Action</th>
              <th style={{ padding: '10px 14px' }}>Matches</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.ruleId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rule.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{rule.ruleId}</div>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <code>{rule.pattern}</code>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: `${severityColor(rule.severity)}22`,
                      color: severityColor(rule.severity),
                      border: `1px solid ${severityColor(rule.severity)}44`,
                    }}
                  >
                    {rule.severity}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 600 }}>
                  {rule.action}
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                  {rule.matchCount}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  <button
                    className={`btn btn-sm ${rule.enabled ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => onToggleRule(rule.ruleId, !rule.enabled)}
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

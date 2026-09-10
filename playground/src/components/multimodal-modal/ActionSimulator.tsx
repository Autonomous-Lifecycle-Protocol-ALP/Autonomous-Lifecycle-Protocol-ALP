import React from 'react';
import type { AlpActionSpace, ActionDefinition } from '@autonomous-lifecycle-protocol-alp/parser';
import { FiShield, FiPlay } from 'react-icons/fi';
import { COLORS, cardStyle } from './shared.js';

interface ActionSimulatorProps {
  actionSpaces: AlpActionSpace[];
  selectedActionSpaceId: string;
  setSelectedActionSpaceId: (id: string) => void;
  selectedActionName: string;
  setSelectedActionName: (name: string) => void;
  activeActionSpace: AlpActionSpace | undefined;
  activeAction: ActionDefinition | undefined;
  paramInputs: Record<string, string>;
  setParamInputs: (inputs: Record<string, string>) => void;
  confirmed: boolean;
  setConfirmed: (v: boolean) => void;
  actionTestResult: { allowed: boolean; reason?: string; timestamp?: string; blockedActions?: string[] } | null;
  handleExecuteActionTest: () => void;
}

export function ActionSimulator({
  actionSpaces,
  selectedActionSpaceId: _selectedActionSpaceId,
  setSelectedActionSpaceId,
  selectedActionName: _selectedActionName,
  setSelectedActionName,
  activeActionSpace,
  activeAction,
  paramInputs,
  setParamInputs,
  confirmed,
  setConfirmed,
  actionTestResult,
  handleExecuteActionTest,
}: ActionSimulatorProps): React.JSX.Element | null {
  if (actionSpaces.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 36,
          color: COLORS.textMuted,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
        }}
      >
        <FiShield size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: 13 }}>No @action_space blocks defined in the current ALP spec.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Left: Action Spaces Explorer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {actionSpaces.map((as) => (
          <div
            key={as.id}
            style={{
              ...cardStyle,
              border: `1px solid ${as.id === activeActionSpace?.id ? COLORS.cyanBright : COLORS.border}`,
              padding: 12,
              cursor: 'pointer',
            }}
            onClick={() => {
              setSelectedActionSpaceId(as.id);
              if (as.actions?.[0]) setSelectedActionName(as.actions[0].name);
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{as.id}</span>
              <span style={{ fontSize: 10, color: COLORS.textSecondary }}>Domain: {as.domain || 'general'}</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {as.actions?.map((act) => {
                const badgeColor =
                  act.safety_level === 'critical'
                    ? COLORS.red
                    : act.safety_level === 'high'
                    ? COLORS.amber
                    : act.safety_level === 'medium'
                    ? COLORS.cyan
                    : COLORS.green;
                return (
                  <button
                    key={act.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActionSpaceId(as.id);
                      setSelectedActionName(act.name);
                    }}
                    style={{
                      border: `1px solid ${act.name === activeAction?.name ? badgeColor : 'rgba(255,255,255,0.1)'}`,
                      background: act.name === activeAction?.name ? `${badgeColor}22` : 'rgba(255,255,255,0.03)',
                      color: badgeColor,
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {act.name} [{act.safety_level.toUpperCase()}]
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Right: Action Testing & Execution Sandbox */}
      <div
        style={{
          ...cardStyle,
          padding: 14,
        }}
      >
        <h4 style={{ margin: '0 0 10px', fontSize: 13, color: COLORS.cyan }}>
          ⚡ Action Safety & Execution Sandbox
        </h4>
        {activeAction ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: COLORS.textPrimary }}>
              <strong>Action:</strong> <code>{activeAction.name}</code> ({activeAction.type})
            </div>
            <div style={{ fontSize: 12, color: COLORS.textPrimary }}>
              <strong>Safety Level:</strong>{' '}
              <span
                style={{
                  color:
                    activeAction.safety_level === 'critical'
                      ? COLORS.red
                      : activeAction.safety_level === 'high'
                      ? COLORS.amber
                      : COLORS.green,
                  fontWeight: 600,
                }}
              >
                {activeAction.safety_level.toUpperCase()}
              </span>
            </div>

            {/* Parameter Form */}
            {activeAction.parameters && activeAction.parameters.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Parameters:</span>
                {activeAction.parameters.map((param) => (
                  <div key={param.name} style={{ marginTop: 6 }}>
                    <label style={{ display: 'block', fontSize: 11, color: COLORS.textSecondary }}>
                      {param.name} {param.required ? <span style={{ color: COLORS.red }}>*</span> : ''} ({param.type})
                    </label>
                    <input
                      type="text"
                      placeholder={param.description || `Enter ${param.name}`}
                      value={paramInputs[param.name] || ''}
                      onChange={(e) =>
                        setParamInputs({ ...paramInputs, [param.name]: e.target.value })
                      }
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: COLORS.bgDarker,
                        color: COLORS.textPrimary,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeAction.safety_level === 'critical' && activeAction.requires_confirmation && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color: COLORS.red,
                  marginTop: 6,
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Confirm critical action execution
              </label>
            )}

            <button
              onClick={handleExecuteActionTest}
              style={{
                marginTop: 10,
                background: COLORS.cyanBright,
                color: COLORS.bgDarker,
                fontWeight: 600,
                padding: '6px 12px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
              }}
            >
              <FiPlay size={12} /> Test Action Gating
            </button>

            {/* Result Output */}
            {actionTestResult && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 6,
                  background: actionTestResult.allowed
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${actionTestResult.allowed ? COLORS.green : COLORS.red}`,
                  fontSize: 11,
                }}
              >
                <div
                  style={{
                    color: actionTestResult.allowed ? COLORS.green : COLORS.red,
                    fontWeight: 600,
                  }}
                >
                  {actionTestResult.allowed ? '✓ EXECUTION ALLOWED' : '✗ EXECUTION BLOCKED'}
                </div>
                <div style={{ color: COLORS.textPrimary, marginTop: 4 }}>{actionTestResult.reason}</div>
                {actionTestResult.blockedActions && actionTestResult.blockedActions.length > 0 && (
                  <ul style={{ margin: '6px 0 0 16px', padding: 0, color: '#f87171', fontSize: 10 }}>
                    {actionTestResult.blockedActions.map((ba, i) => (
                      <li key={i}>{ba}</li>
                    ))}
                  </ul>
                )}
                <div style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 4 }}>
                  Checked at: {actionTestResult.timestamp}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>Select an action to inspect.</span>
        )}
      </div>
    </div>
  );
}

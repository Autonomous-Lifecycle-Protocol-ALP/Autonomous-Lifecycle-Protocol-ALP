import React, { useState, useCallback } from 'react';
import { AlpActionSpace } from '@autonomous-lifecycle-protocol-alp/parser';
import { MultiModalBridge } from '@autonomous-lifecycle-protocol-alp/sdk';
import {
  SectionHeader,
  cardStyle,
  chipStyle,
  SAFETY_COLORS,
  SafetyLevel,
} from './shared.js';

export function SimulatorTab({
  actionSpaces,
  bridge,
}: {
  actionSpaces: AlpActionSpace[];
  bridge: MultiModalBridge;
}) {
  const [selectedSpace, setSelectedSpace] = useState<string>(actionSpaces[0]?.id || '');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<{
    allowed: boolean;
    reason?: string;
    actionName: string;
    safetyLevel: string;
  } | null>(null);

  const currentSpace = actionSpaces.find((as) => as.id === selectedSpace);
  const currentActions = currentSpace?.actions || [];

  const handleExecute = useCallback(() => {
    if (!currentSpace || !selectedAction) return;
    const execResult = bridge.validateActionExecution(currentSpace, selectedAction, {}, confirmed);
    setResult(execResult);
  }, [currentSpace, selectedAction, confirmed, bridge]);

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <SectionHeader title="Action Space Dry-Run Simulator" count={0} />

      <div style={cardStyle}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>
            Action Space
          </label>
          <select
            value={selectedSpace}
            onChange={(e) => {
              setSelectedSpace(e.target.value);
              setSelectedAction('');
              setResult(null);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#e6edf3',
              fontSize: 13,
            }}
          >
            {actionSpaces.map((as) => (
              <option key={as.id} value={as.id}>
                {as.id} ({as.domain || 'general'})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>
            Action
          </label>
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setResult(null);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#e6edf3',
              fontSize: 13,
            }}
          >
            <option value="">Select an action...</option>
            {currentActions.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name} [{a.safety_level}]
              </option>
            ))}
          </select>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: '#8b949e',
            cursor: 'pointer',
            marginBottom: 14,
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ accentColor: '#8b5cf6' }}
          />
          Human confirmation provided
        </label>

        <button
          onClick={handleExecute}
          disabled={!selectedAction}
          style={{
            width: '100%',
            padding: '10px 0',
            background: selectedAction
              ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
              : '#21262d',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: selectedAction ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
          }}
        >
          ▶ Dry-Run Execute
        </button>
      </div>

      {result && (
        <div
          style={{
            ...cardStyle,
            borderColor: result.allowed ? '#10b98155' : '#ef444455',
            background: result.allowed ? '#10b9811a' : '#ef44441a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{result.allowed ? '✅' : '🚫'}</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: result.allowed ? '#10b981' : '#ef4444' }}>
              {result.allowed ? 'EXECUTION ALLOWED' : 'EXECUTION DENIED'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#8b949e' }}>
            Action: <strong>{result.actionName}</strong> · Safety:&nbsp;
            <span style={chipStyle(SAFETY_COLORS[result.safetyLevel as SafetyLevel] || '#8b949e')}>
              {result.safetyLevel.toUpperCase()}
            </span>
          </div>
          {result.reason && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: '#0d1117',
                borderRadius: 6,
                fontSize: 12,
                color: '#f59e0b',
                border: '1px solid #f59e0b33',
              }}
            >
              ⚠️ {result.reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SimulatorTab;

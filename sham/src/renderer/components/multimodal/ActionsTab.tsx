import React from 'react';
import { AlpActionSpace, MultiModalEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import {
  cardStyle,
  chipStyle,
  SAFETY_COLORS,
  SafetyLevel,
} from './shared.js';

export function ActionsTab({
  actionSpaces,
  engine,
}: {
  actionSpaces: AlpActionSpace[];
  engine: MultiModalEngine;
}) {
  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      {actionSpaces.map((as) => {
        const validation = engine.validateActionSpace(as);
        const guardCheck = engine.verifySafetyGuards(as, as.safety_guards || []);

        return (
          <div key={as.id} style={{ marginBottom: 20 }}>
            <div style={{ ...cardStyle, borderColor: guardCheck.allowed ? '#21262d' : '#f8514933' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}
              >
                <span style={{ fontWeight: 700, fontSize: 15 }}>🎯 {as.id}</span>
                <span
                  style={chipStyle(guardCheck.allowed ? '#10b981' : '#ef4444')}
                >
                  {guardCheck.allowed ? '✅ SAFE' : '⚠️ BLOCKED'}
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 12 }}>
                Domain: {as.domain || 'general'} · Agent: {as.agent || 'global'} · Critical:&nbsp;
                {validation.criticalActionCount}
              </div>

              {/* Actions List */}
              {(as.actions || []).map((action) => {
                const isBlocked = guardCheck.blockedActions.includes(action.name);
                return (
                  <div
                    key={action.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: isBlocked ? '#f851490d' : '#0d1117',
                      borderRadius: 8,
                      marginBottom: 6,
                      border: `1px solid ${isBlocked ? '#f8514933' : '#21262d'}`,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: SAFETY_COLORS[action.safety_level as SafetyLevel] || '#8b949e',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{action.name}</span>
                    <span style={chipStyle(SAFETY_COLORS[action.safety_level as SafetyLevel] || '#8b949e')}>
                      {action.safety_level.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: '#8b949e' }}>{action.type}</span>
                    {action.requires_confirmation && (
                      <span style={{ fontSize: 10 }} title="Requires confirmation">
                        🔒
                      </span>
                    )}
                    {isBlocked && (
                      <span style={{ fontSize: 10 }} title="Blocked by safety guards">
                        🚫
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Safety Guards */}
              {(as.safety_guards || []).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: '#8b949e', fontWeight: 600, marginBottom: 4 }}>
                    Active Safety Guards:
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(as.safety_guards || []).map((g) => (
                      <span key={g} style={chipStyle('#10b981')}>
                        🛡️ {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ActionsTab;

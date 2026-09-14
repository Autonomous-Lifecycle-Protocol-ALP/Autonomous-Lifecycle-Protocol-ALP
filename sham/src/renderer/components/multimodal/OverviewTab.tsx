import React, { useMemo } from 'react';
import {
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
} from '@autonomous-lifecycle-protocol-alp/parser';
import { MultiModalBridge } from '@autonomous-lifecycle-protocol-alp/sdk';
import {
  StatCard,
  SectionHeader,
  TokenBudgetBar,
  cardStyle,
  chipStyle,
  MODALITY_ICONS,
} from './shared.js';

export function OverviewTab({
  multimodalSpecs,
  actionSpaces,
  visionModels,
  bridge,
}: {
  multimodalSpecs: AlpMultimodal[];
  actionSpaces: AlpActionSpace[];
  visionModels: AlpVisionModel[];
  bridge: MultiModalBridge;
}) {
  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        <StatCard label="Multimodal Specs" value={multimodalSpecs.length} color="#8b5cf6" icon="👁️" />
        <StatCard label="Action Spaces" value={actionSpaces.length} color="#3b82f6" icon="🎯" />
        <StatCard label="Vision Models" value={visionModels.length} color="#10b981" icon="🧠" />
      </div>

      {/* Multimodal Specs */}
      <SectionHeader title="Multimodal Specifications" count={multimodalSpecs.length} />
      {multimodalSpecs.map((mm) => {
        const budget = bridge.estimateContextBudget(mm, visionModels[0]);
        return (
          <div key={mm.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>👁️ {mm.id}</span>
              <span style={{ fontSize: 11, color: '#8b949e' }}>
                {budget.totalTokens} tokens ({budget.budgetPercent.toFixed(0)}%)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {(mm.modalities || []).map((m) => (
                <span key={m} style={chipStyle('#8b5cf6')}>
                  {MODALITY_ICONS[m] || '📦'} {m}
                </span>
              ))}
            </div>
            <TokenBudgetBar percent={budget.budgetPercent} />
          </div>
        );
      })}

      {/* Action Spaces */}
      <SectionHeader title="Action Spaces" count={actionSpaces.length} />
      {actionSpaces.map((as) => (
        <div key={as.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>🎯 {as.id}</span>
            <span style={chipStyle('#3b82f6')}>{as.domain || 'general'}</span>
          </div>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8 }}>
            Agent: {as.agent || 'global'} · {(as.actions || []).length} actions
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(as.actions || []).map((a) => (
              <span key={a.name} style={chipStyle('#8b949e')}>
                {a.name} ({a.safety_level})
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Vision Models */}
      <SectionHeader title="Vision Models" count={visionModels.length} />
      {visionModels.map((vm) => (
        <div key={vm.id} style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🧠 {vm.id}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={chipStyle('#06b6d4')}>Backbone: {vm.backbone}</span>
            {vm.embedding_dim && <span style={chipStyle('#f59e0b')}>Dim: {vm.embedding_dim}</span>}
            {vm.context_tokens && <span style={chipStyle('#10b981')}>Context: {vm.context_tokens}</span>}
            {vm.max_resolution && <span style={chipStyle('#8b5cf6')}>Res: {vm.max_resolution}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default OverviewTab;

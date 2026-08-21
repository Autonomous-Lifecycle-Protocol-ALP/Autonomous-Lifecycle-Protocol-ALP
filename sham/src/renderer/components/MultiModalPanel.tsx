import React, { useState, useMemo, useCallback } from 'react';
import {
  MultiModalEngine,
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
  MultiModalAsset,
} from '@autonomous-lifecycle-protocol-alp/parser';
import { MultiModalBridge } from '@autonomous-lifecycle-protocol-alp/sdk';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from './Icon.js';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface MultiModalPanelProps {
  parsedObjects?: AlpObject[] | null;
}

type SafetyLevel = 'low' | 'medium' | 'high' | 'critical';

const SAFETY_COLORS: Record<SafetyLevel, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const MODALITY_ICONS: Record<string, string> = {
  vision: '👁️',
  audio: '🎵',
  sensor: '📡',
  text: '📝',
  spatial: '🌐',
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  image: '#8b5cf6',
  video: '#3b82f6',
  audio: '#10b981',
  sensor: '#f59e0b',
  point_cloud: '#06b6d4',
  spatial: '#ec4899',
};

/* ── Styles ────────────────────────────────────────────────────────────── */

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#0e1117',
  color: '#e6edf3',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  borderBottom: '1px solid #21262d',
  background: 'linear-gradient(135deg, #161b22 0%, #0e1117 100%)',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid #21262d',
  background: '#161b22',
};

const cardStyle: React.CSSProperties = {
  background: '#161b22',
  borderRadius: 10,
  border: '1px solid #21262d',
  padding: '14px 16px',
  marginBottom: 10,
  transition: 'border-color 0.2s',
};

const chipStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 10px',
  borderRadius: 9999,
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: color + '1a',
  color,
  border: `1px solid ${color}44`,
});

/* ── Tabs ──────────────────────────────────────────────────────────────── */

type Tab = 'overview' | 'assets' | 'actions' | 'simulator';

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        border: 'none',
        borderBottom: active ? '2px solid #8b5cf6' : '2px solid transparent',
        background: 'transparent',
        color: active ? '#e6edf3' : '#8b949e',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

/* ── Overview Tab ──────────────────────────────────────────────────────── */

function OverviewTab({
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
              <span key={a.name} style={chipStyle(SAFETY_COLORS[a.safety_level as SafetyLevel] || '#8b949e')}>
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

/* ── Assets Tab ────────────────────────────────────────────────────────── */

function AssetsTab({ multimodalSpecs }: { multimodalSpecs: AlpMultimodal[] }) {
  const allAssets = useMemo(() => {
    const assets: (MultiModalAsset & { parentId: string })[] = [];
    for (const mm of multimodalSpecs) {
      for (const a of mm.assets || []) {
        assets.push({ ...a, parentId: mm.id });
      }
    }
    return assets;
  }, [multimodalSpecs]);

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <SectionHeader title="All Multimodal Assets" count={allAssets.length} />
      {allAssets.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8b949e', padding: 40 }}>
          No multimodal assets defined. Add <code>assets</code> to your <code>@multimodal</code> spec.
        </div>
      )}
      {allAssets.map((asset) => (
        <div key={`${asset.parentId}-${asset.id}`} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: ASSET_TYPE_COLORS[asset.type] || '#8b949e',
                  marginRight: 8,
                }}
              />
              {asset.id}
            </span>
            <span style={chipStyle(ASSET_TYPE_COLORS[asset.type] || '#8b949e')}>{asset.type}</span>
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', wordBreak: 'break-all', marginBottom: 4 }}>
            URI: {asset.uri}
          </div>
          {asset.resolution && (
            <div style={{ fontSize: 11, color: '#8b949e' }}>Resolution: {asset.resolution}</div>
          )}
          {asset.format && <div style={{ fontSize: 11, color: '#8b949e' }}>Format: {asset.format}</div>}
          <div style={{ fontSize: 10, color: '#484f58', marginTop: 4 }}>Parent: {asset.parentId}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Actions Tab ───────────────────────────────────────────────────────── */

function ActionsTab({
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

/* ── Simulator Tab ─────────────────────────────────────────────────────── */

function SimulatorTab({
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
            Action: <strong>{result.actionName}</strong> · Safety:{' '}
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

/* ── Shared Components ─────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: `${color}0d`,
        border: `1px solid ${color}33`,
        borderRadius: 10,
        padding: '14px 14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#8b949e', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 6,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>{title}</span>
      {count > 0 && (
        <span style={{ fontSize: 10, color: '#8b949e', background: '#21262d', padding: '2px 8px', borderRadius: 9999 }}>
          {count}
        </span>
      )}
    </div>
  );
}

function TokenBudgetBar({ percent }: { percent: number }) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const barColor =
    clampedPercent > 90 ? '#ef4444' : clampedPercent > 70 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          width: '100%',
          height: 6,
          backgroundColor: '#21262d',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedPercent}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2, textAlign: 'right' }}>
        {clampedPercent.toFixed(0)}% context budget
      </div>
    </div>
  );
}

/* ── Sample Data ───────────────────────────────────────────────────────── */

const SAMPLE_MULTIMODAL: AlpMultimodal[] = [
  {
    id: 'mm-factory-inspection',
    modalities: ['vision', 'sensor', 'audio'],
    resolution: '1920x1080',
    fps: 30,
    assets: [
      { id: 'cam-front', type: 'image', uri: 's3://factory/cam-front.png', resolution: '1920x1080' },
      { id: 'cam-side', type: 'image', uri: 's3://factory/cam-side.png', resolution: '1280x720' },
      { id: 'mic-ambient', type: 'audio', uri: 's3://factory/mic.wav' },
      { id: 'lidar-scan', type: 'point_cloud', uri: 's3://factory/scan.pcd' },
    ],
  },
  {
    id: 'mm-drone-telemetry',
    modalities: ['vision', 'spatial'],
    assets: [
      { id: 'aerial-cam', type: 'video', uri: 's3://drone/aerial.mp4' },
      { id: 'gps-stream', type: 'sensor', uri: 'mqtt://drone/gps' },
    ],
  },
];

const SAMPLE_ACTION_SPACES: AlpActionSpace[] = [
  {
    id: 'as-robotic-arm',
    agent: 'agent-manufacturing',
    domain: 'robotics',
    safety_guards: ['enforce-human-in-the-loop'],
    actions: [
      { name: 'move_joint', type: 'physical', safety_level: 'low', parameters: [{ name: 'angle', type: 'number', required: true }] },
      { name: 'grip_object', type: 'actuator', safety_level: 'medium' },
      { name: 'emergency_stop', type: 'physical', safety_level: 'critical', requires_confirmation: true },
      { name: 'override_safety', type: 'actuator', safety_level: 'critical', requires_confirmation: false },
    ],
  },
  {
    id: 'as-browser-agent',
    agent: 'agent-web-navigator',
    domain: 'browser',
    actions: [
      { name: 'navigate_url', type: 'api', safety_level: 'low' },
      { name: 'click_element', type: 'digital', safety_level: 'low' },
      { name: 'fill_form', type: 'digital', safety_level: 'medium' },
      { name: 'submit_payment', type: 'api', safety_level: 'critical', requires_confirmation: true },
    ],
  },
];

const SAMPLE_VISION_MODELS: AlpVisionModel[] = [
  {
    id: 'vm-gemini-vision',
    backbone: 'gemini-vision',
    embedding_dim: 1024,
    max_resolution: '4096x4096',
    context_tokens: 32768,
    latency_p95_ms: 120,
  },
  {
    id: 'vm-siglip-base',
    backbone: 'siglip',
    embedding_dim: 768,
    max_resolution: '1024x1024',
    context_tokens: 4096,
  },
];

/* ── Main Panel ────────────────────────────────────────────────────────── */

export function MultiModalPanel({ parsedObjects }: MultiModalPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const engine = useMemo(() => new MultiModalEngine(), []);
  const bridge = useMemo(() => new MultiModalBridge(), []);

  const { multimodalSpecs, actionSpaces, visionModels } = useMemo(() => {
    const objects = parsedObjects && parsedObjects.length > 0 ? parsedObjects : [];

    const mmFromParsed = objects.filter((o) => o._type === 'multimodal') as unknown as AlpMultimodal[];
    const asFromParsed = objects.filter((o) => o._type === 'action_space') as unknown as AlpActionSpace[];
    const vmFromParsed = objects.filter((o) => o._type === 'vision_model') as unknown as AlpVisionModel[];

    return {
      multimodalSpecs: mmFromParsed.length > 0 ? mmFromParsed : SAMPLE_MULTIMODAL,
      actionSpaces: asFromParsed.length > 0 ? asFromParsed : SAMPLE_ACTION_SPACES,
      visionModels: vmFromParsed.length > 0 ? vmFromParsed : SAMPLE_VISION_MODELS,
    };
  }, [parsedObjects]);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Icon name="camera" size={20} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>
            Multi-Modal & VLA Engine
          </div>
          <div style={{ fontSize: 10, color: '#8b949e' }}>
            v82.0.0 · Vision · Audio · Sensor · Action Space
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        <TabButton label="Overview" icon="📊" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton label="Assets" icon="📦" active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
        <TabButton label="Actions" icon="🎯" active={activeTab === 'actions'} onClick={() => setActiveTab('actions')} />
        <TabButton label="Simulator" icon="▶" active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} />
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          multimodalSpecs={multimodalSpecs}
          actionSpaces={actionSpaces}
          visionModels={visionModels}
          bridge={bridge}
        />
      )}
      {activeTab === 'assets' && <AssetsTab multimodalSpecs={multimodalSpecs} />}
      {activeTab === 'actions' && <ActionsTab actionSpaces={actionSpaces} engine={engine} />}
      {activeTab === 'simulator' && <SimulatorTab actionSpaces={actionSpaces} bridge={bridge} />}
    </div>
  );
}

export default MultiModalPanel;

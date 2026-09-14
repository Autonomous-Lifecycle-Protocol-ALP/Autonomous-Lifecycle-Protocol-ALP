import React, { useState, useMemo, useCallback } from 'react';
import {
  MultiModalEngine,
  type AlpMultimodal,
  type AlpActionSpace,
  type AlpVisionModel,
  type ActionDefinition,
} from '@autonomous-lifecycle-protocol-alp/parser';
import {
  FiX,
  FiEye,
  FiActivity,
  FiShield,
  FiCpu,
  FiCopy,
  FiCheck,
  FiTerminal,
} from 'react-icons/fi';
import { SpecView } from './SpecView.js';
import { ActionSimulator } from './ActionSimulator.js';
import type { MultiModalModalProps, ActionTestResult } from './shared.js';

export function MultiModalModal({
  isOpen,
  onClose,
  parsedObjects,
}: MultiModalModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'models' | 'stream' | 'json'>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  const [selectedVisionModelId, setSelectedVisionModelId] = useState<string>('');

  // Action test state
  const [selectedActionSpaceId, setSelectedActionSpaceId] = useState<string>('');
  const [selectedActionName, setSelectedActionName] = useState<string>('');
  const [paramInputs, setParamInputs] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [actionTestResult, setActionTestResult] = useState<ActionTestResult | null>(null);

  // Simulation stream constants (static simulation display)
  const isSimulatingStream = true;
  const simFps = 30;

  const engine = useMemo(() => new MultiModalEngine(), []);

  const mmObjects = useMemo(() => {
    return parsedObjects.filter((o) => o._type === 'multimodal') as unknown as AlpMultimodal[];
  }, [parsedObjects]);

  const actionSpaces = useMemo(() => {
    return parsedObjects.filter((o) => o._type === 'action_space') as unknown as AlpActionSpace[];
  }, [parsedObjects]);

  const visionModels = useMemo(() => {
    return parsedObjects.filter((o) => o._type === 'vision_model') as unknown as AlpVisionModel[];
  }, [parsedObjects]);

  const selectedVisionModel = useMemo(() => {
    return visionModels.find((vm) => vm.id === selectedVisionModelId) || visionModels[0] || undefined;
  }, [visionModels, selectedVisionModelId]);

  const primaryVisionModel = selectedVisionModel;

  const totalTokens = useMemo(() => {
    let sum = 0;
    for (const mm of mmObjects) {
      sum += engine.estimateTokenCost(mm.modalities || [], mm.assets || [], primaryVisionModel);
    }
    return sum;
  }, [mmObjects, engine, primaryVisionModel]);

  const maxContext = primaryVisionModel?.context_tokens || 8192;
  const tokenPercentage = Math.min(100, (totalTokens / maxContext) * 100);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  }, []);

  // Action Space testing logic
  const activeActionSpace = useMemo(() => {
    return actionSpaces.find((as) => as.id === selectedActionSpaceId) || actionSpaces[0];
  }, [actionSpaces, selectedActionSpaceId]);

  const activeAction: ActionDefinition | undefined = useMemo(() => {
    if (!activeActionSpace?.actions) return undefined;
    return activeActionSpace.actions.find((a) => a.name === selectedActionName) || activeActionSpace.actions[0];
  }, [activeActionSpace, selectedActionName]);

  const handleExecuteActionTest = useCallback(() => {
    if (!activeActionSpace || !activeAction) return;

    const safetyResult = engine.verifySafetyGuards(activeActionSpace, activeActionSpace.safety_guards || []);

    if (!safetyResult.allowed) {
      setActionTestResult({
        allowed: false,
        reason: `Blocked by safety guards: ${safetyResult.blockedActions.join(', ')}`,
        blockedActions: safetyResult.blockedActions,
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    setActionTestResult({
      allowed: true,
      reason: `Action '${activeAction.name}' passed safety guards in action space '${activeActionSpace.id}'.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [activeActionSpace, activeAction, engine]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="multimodal-title">
      <div
        className="modal-card"
        style={{ maxWidth: 880, width: '92vw', height: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>👁️</span>
            <div>
              <h3 id="multimodal-title" style={{ margin: 0, fontSize: 16, color: '#f1f5f9', fontWeight: 600 }}>
                Multi-Modal Protocol & VLA Engine
              </h3>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Vision-Language-Action Primitives & Context Budgeting (v82.0.0)
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 16px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button
            className={`action-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{ fontSize: 12, padding: '5px 12px' }}
            autoFocus
          >
            <FiEye size={13} /> Specs ({mmObjects.length})
          </button>
          <button
            className={`action-btn ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
            style={{ fontSize: 12, padding: '5px 12px' }}
          >
            <FiShield size={13} /> Action Spaces ({actionSpaces.length})
          </button>
          <button
            className={`action-btn ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
            style={{ fontSize: 12, padding: '5px 12px' }}
          >
            <FiCpu size={13} /> Vision Models ({visionModels.length})
          </button>
          <button
            className={`action-btn ${activeTab === 'stream' ? 'active' : ''}`}
            onClick={() => setActiveTab('stream')}
            style={{ fontSize: 12, padding: '5px 12px' }}
          >
            <FiActivity size={13} /> Stream Feed Simulator
          </button>
          <button
            className={`action-btn ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
            style={{ fontSize: 12, padding: '5px 12px' }}
          >
            <FiTerminal size={13} /> JSON Export
          </button>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#0b0f19' }}>
          {(activeTab === 'overview' || activeTab === 'models') && (
            <SpecView
              tab={activeTab}
              mmObjects={mmObjects}
              actionSpaces={actionSpaces}
              visionModels={visionModels}
              engine={engine as any}
              selectedVisionModelId={selectedVisionModelId}
              setSelectedVisionModelId={setSelectedVisionModelId}
              primaryVisionModel={primaryVisionModel}
              totalTokens={totalTokens}
              maxContext={maxContext}
              tokenPercentage={tokenPercentage}
            />
          )}

          {activeTab === 'actions' && (
            <ActionSimulator
              actionSpaces={actionSpaces}
              selectedActionSpaceId={selectedActionSpaceId}
              setSelectedActionSpaceId={setSelectedActionSpaceId}
              selectedActionName={selectedActionName}
              setSelectedActionName={setSelectedActionName}
              activeActionSpace={activeActionSpace}
              activeAction={activeAction}
              paramInputs={paramInputs}
              setParamInputs={setParamInputs}
              confirmed={confirmed}
              setConfirmed={setConfirmed}
              actionTestResult={actionTestResult}
              handleExecuteActionTest={handleExecuteActionTest}
            />
          )}

          {activeTab === 'stream' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Dynamic Camera Feed */}
              <div
                style={{
                  background: '#131b2e',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>
                    📷 {mmObjects.length > 0 ? `${mmObjects[0].id} Stream` : 'Live Camera Stream Preview'}
                  </span>
                  <span style={{ fontSize: 10, color: isSimulatingStream ? '#10b981' : '#64748b' }}>
                    {isSimulatingStream ? `● LIVE (${simFps} FPS)` : 'PAUSED'}
                  </span>
                </div>
                <div
                  style={{
                    height: 200,
                    background: 'radial-gradient(circle at center, #1e293b, #0f172a)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                      color: '#00f0ff',
                    }}
                  >
                    {mmObjects.length > 0
                      ? `${mmObjects[0].resolution || 'No resolution'}${mmObjects[0].fps ? ` • ${mmObjects[0].fps} FPS` : ''} • ${mmObjects[0].modalities?.join(', ') || 'RGB'}`
                      : '1920x1080 • RGB • H.264'}
                  </div>
                  {mmObjects.length > 0 && mmObjects[0].modalities && mmObjects[0].modalities.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        display: 'flex',
                        gap: 4,
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {mmObjects[0].modalities.map((mod) => (
                        <span
                          key={mod}
                          style={{
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontSize: 9,
                            fontFamily: 'JetBrains Mono',
                          }}
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      border: '2px dashed #00f0ff',
                      borderRadius: 8,
                      animation: isSimulatingStream ? 'spin 6s linear infinite' : 'none',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
                    {mmObjects.length > 0 ? `${mmObjects[0].id} Active` : 'VLA Spatial Visual Grid Active'}
                  </span>
                </div>
                {mmObjects.length > 0 && mmObjects[0].assets && mmObjects[0].assets.length > 0 && (
                  <div
                    style={{
                      padding: 8,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 6,
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  >
                    <span style={{ color: '#64748b', fontSize: 9, textTransform: 'uppercase' }}>Assets</span>
                    {mmObjects[0].assets.map((asset) => (
                      <div
                        key={asset.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: 3,
                          color: '#cbd5e1',
                        }}
                      >
                        <span>{asset.id}</span>
                        <span style={{ color: '#00f0ff' }}>{asset.type} → {asset.uri}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Telemetry */}
              <div
                style={{
                  background: '#131b2e',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#c084fc' }}>
                  🎙️ {mmObjects.length > 0 ? `${mmObjects[0].id} Telemetry` : 'Audio & Sensor Telemetry'}
                </span>
                <div
                  style={{
                    height: 200,
                    background: '#0b0f19',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    padding: 12,
                    fontFamily: 'JetBrains Mono',
                    fontSize: 11,
                    color: '#10b981',
                    overflowY: 'auto',
                  }}
                >
                  {mmObjects.length > 0 ? (
                    <>
                      {mmObjects[0].modalities?.map((mod) => {
                        const modUpper = mod.toUpperCase();
                        let line = '';
                        if (modUpper === 'VISION' || modUpper === 'IMAGE') {
                          line = `[${modUpper}] Resolution: ${mmObjects[0].resolution || 'N/A'} • FPS: ${mmObjects[0].fps || '—'}`;
                        } else if (modUpper === 'AUDIO') {
                           line = `[${modUpper}] Sample Rate: ${(mmObjects[0].sample_rate_hz || 44.1)}kHz • Channels: 2`;
                        } else {
                          line = `[${modUpper}] Active`;
                        }
                        return <div key={mod}>{line}</div>;
                      })}
                      {mmObjects[0].assets && mmObjects[0].assets.map((asset) => (
                        <div key={asset.id}>
                          [ASSET] {asset.id} ({asset.type}) → {asset.uri}
                        </div>
                      ))}
                      <div>[STATUS] Gating: Enforced • Token Budget: OK</div>
                      <div>[HEARTBEAT] Stream synced at {new Date().toLocaleTimeString()}</div>
                    </>
                  ) : (
                    <>
                      <div>[AUDIO] Sample Rate: 44.1kHz • Channels: 2 • SNR: 48dB</div>
                      <div>[SENSOR] IMU Gyro: (0.02, -0.01, 0.98) G</div>
                      <div>[VLA] Action Inference Latency: 32ms</div>
                      <div>[STATUS] Gating: Enforced • Token Budget: OK</div>
                      <div>[HEARTBEAT] Stream synced at {new Date().toLocaleTimeString()}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  className="action-btn"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify({ multimodal: mmObjects, actionSpaces, visionModels }, null, 2),
                      'json'
                    )
                  }
                >
                  {copied === 'json' ? <FiCheck size={12} /> : <FiCopy size={12} />} Copy JSON
                </button>
              </div>
              <pre
                style={{
                  background: '#131b2e',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: 14,
                  color: '#f1f5f9',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  overflowX: 'auto',
                  maxHeight: 400,
                }}
              >
                {JSON.stringify({ multimodal: mmObjects, actionSpaces, visionModels }, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 18px',
            background: 'rgba(15, 23, 42, 0.8)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: '#64748b' }}>
            ALP Multi-Modal & VLA Engine (v82.0.0)
          </span>
          <button className="action-btn" onClick={onClose} style={{ padding: '6px 16px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

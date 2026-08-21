import React, { useState, useMemo, useCallback } from 'react';
import {
  MultiModalEngine,
  type AlpObject,
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
  FiPlay,
  FiTerminal,
} from 'react-icons/fi';

interface MultiModalModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedObjects: AlpObject[];
}

export function MultiModalModal({
  isOpen,
  onClose,
  parsedObjects,
}: MultiModalModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'models' | 'stream' | 'json'>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  // Action test state
  const [selectedActionSpaceId, setSelectedActionSpaceId] = useState<string>('');
  const [selectedActionName, setSelectedActionName] = useState<string>('');
  const [paramInputs, setParamInputs] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [actionTestResult, setActionTestResult] = useState<{
    allowed: boolean;
    reason?: string;
    timestamp?: string;
  } | null>(null);

  // Simulation stream state
  const [isSimulatingStream] = useState(true);
  const [simFps] = useState(30);

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

  const primaryVisionModel = visionModels[0] || undefined;

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

  const handleExecuteActionTest = () => {
    if (!activeActionSpace || !activeAction) return;

    // Parameter requirement check
    if (activeAction.parameters) {
      for (const p of activeAction.parameters) {
        if (p.required && !paramInputs[p.name]) {
          setActionTestResult({
            allowed: false,
            reason: `Required parameter '${p.name}' is missing.`,
            timestamp: new Date().toLocaleTimeString(),
          });
          return;
        }
      }
    }

    if (activeAction.safety_level === 'critical' && activeAction.requires_confirmation && !confirmed) {
      setActionTestResult({
        allowed: false,
        reason: `Action '${activeAction.name}' is marked CRITICAL and requires user confirmation.`,
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    setActionTestResult({
      allowed: true,
      reason: `Action '${activeAction.name}' executed safely within action space '${activeActionSpace.id}'.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
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
              <h3 style={{ margin: 0, fontSize: 16, color: '#f1f5f9', fontWeight: 600 }}>
                Multi-Modal Protocol & VLA Engine
              </h3>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Vision-Language-Action Primitives & Context Budgeting (v82.0.0)
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Context Budget Bar */}
              <div
                style={{
                  background: '#131b2e',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                    Multi-Modal Context Window Budget
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>
                    {totalTokens} / {maxContext} tokens ({tokenPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 5,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${tokenPercentage}%`,
                      background:
                        tokenPercentage > 85
                          ? '#ef4444'
                          : tokenPercentage > 60
                          ? '#f59e0b'
                          : 'linear-gradient(90deg, #00f0ff, #3b82f6)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Multimodal Specs */}
              {mmObjects.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 36,
                    color: '#64748b',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                  }}
                >
                  <FiEye size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>No @multimodal blocks defined in the current ALP spec.</p>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#475569' }}>
                    Use the MultiModal template or add a <code>@multimodal</code> directive.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
                  {mmObjects.map((mm) => {
                    const validation = engine.validateMultimodal(mm);
                    const tokens = engine.estimateTokenCost(
                      mm.modalities || [],
                      mm.assets || [],
                      primaryVisionModel
                    );

                    return (
                      <div
                        key={mm.id}
                        style={{
                          background: '#131b2e',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 8,
                          padding: 14,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#38bdf8' }}>{mm.id}</span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: validation.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: validation.valid ? '#10b981' : '#ef4444',
                            }}
                          >
                            {validation.valid ? 'VALID SPEC' : 'ERRORS'}
                          </span>
                        </div>

                        <div style={{ margin: '10px 0', fontSize: 11, color: '#94a3b8' }}>
                          <div>
                            <strong>Modalities:</strong>{' '}
                            {mm.modalities?.map((m) => (
                              <span
                                key={m}
                                style={{
                                  display: 'inline-block',
                                  margin: '2px 4px 2px 0',
                                  padding: '1px 6px',
                                  background: 'rgba(56, 189, 248, 0.1)',
                                  color: '#38bdf8',
                                  borderRadius: 4,
                                }}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                          {mm.resolution && (
                            <div style={{ marginTop: 4 }}>
                              <strong>Resolution:</strong> {mm.resolution} {mm.fps ? `@ ${mm.fps} FPS` : ''}
                            </div>
                          )}
                          <div style={{ marginTop: 4 }}>
                            <strong>Est. Tokens:</strong> ~{tokens} tokens
                          </div>
                        </div>

                        {/* Assets list */}
                        {mm.assets && mm.assets.length > 0 && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 8,
                              background: 'rgba(0,0,0,0.3)',
                              borderRadius: 6,
                              fontSize: 11,
                            }}
                          >
                            <span style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase' }}>Assets</span>
                            {mm.assets.map((asset) => (
                              <div
                                key={asset.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginTop: 4,
                                  color: '#cbd5e1',
                                }}
                              >
                                <span>{asset.id}</span>
                                <span style={{ color: '#00f0ff', fontFamily: 'JetBrains Mono' }}>{asset.type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action Spaces Tab */}
          {activeTab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {actionSpaces.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 36,
                    color: '#64748b',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                  }}
                >
                  <FiShield size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>No @action_space blocks defined in the current ALP spec.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Left: Action Spaces Explorer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {actionSpaces.map((as) => (
                      <div
                        key={as.id}
                        style={{
                          background: '#131b2e',
                          border: `1px solid ${as.id === activeActionSpace?.id ? '#00f0ff' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 8,
                          padding: 12,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedActionSpaceId(as.id);
                          if (as.actions?.[0]) setSelectedActionName(as.actions[0].name);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{as.id}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>Domain: {as.domain || 'general'}</span>
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {as.actions?.map((act) => {
                            const badgeColor =
                              act.safety_level === 'critical'
                                ? '#ef4444'
                                : act.safety_level === 'high'
                                ? '#f59e0b'
                                : act.safety_level === 'medium'
                                ? '#38bdf8'
                                : '#10b981';
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
                      background: '#131b2e',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#38bdf8' }}>
                      ⚡ Action Safety & Execution Sandbox
                    </h4>
                    {activeAction ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                          <strong>Action:</strong> <code>{activeAction.name}</code> ({activeAction.type})
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                          <strong>Safety Level:</strong>{' '}
                          <span
                            style={{
                              color:
                                activeAction.safety_level === 'critical'
                                  ? '#ef4444'
                                  : activeAction.safety_level === 'high'
                                  ? '#f59e0b'
                                  : '#10b981',
                              fontWeight: 600,
                            }}
                          >
                            {activeAction.safety_level.toUpperCase()}
                          </span>
                        </div>

                        {/* Parameter Form */}
                        {activeAction.parameters && activeAction.parameters.length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Parameters:</span>
                            {activeAction.parameters.map((param) => (
                              <div key={param.name} style={{ marginTop: 6 }}>
                                <label style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>
                                  {param.name} {param.required ? <span style={{ color: '#ef4444' }}>*</span> : ''} (
                                  {param.type})
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
                                    background: '#0b0f19',
                                    color: '#f1f5f9',
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
                              color: '#ef4444',
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
                          className="action-btn"
                          style={{
                            marginTop: 10,
                            background: '#00f0ff',
                            color: '#0b0f19',
                            fontWeight: 600,
                            justifyContent: 'center',
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
                              border: `1px solid ${actionTestResult.allowed ? '#10b981' : '#ef4444'}`,
                              fontSize: 11,
                            }}
                          >
                            <div
                              style={{
                                color: actionTestResult.allowed ? '#10b981' : '#ef4444',
                                fontWeight: 600,
                              }}
                            >
                              {actionTestResult.allowed ? '✓ EXECUTION ALLOWED' : '✗ EXECUTION BLOCKED'}
                            </div>
                            <div style={{ color: '#cbd5e1', marginTop: 4 }}>{actionTestResult.reason}</div>
                            <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
                              Checked at: {actionTestResult.timestamp}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#64748b' }}>Select an action to inspect.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vision Models Tab */}
          {activeTab === 'models' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {visionModels.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: 36,
                    color: '#64748b',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                  }}
                >
                  <FiCpu size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>No @vision_model blocks declared.</p>
                </div>
              ) : (
                visionModels.map((vm) => (
                  <div
                    key={vm.id}
                    style={{
                      background: '#131b2e',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#c084fc' }}>{vm.id}</span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#c084fc',
                          borderRadius: 12,
                        }}
                      >
                        {vm.backbone}
                      </span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>Context Tokens: <strong>{vm.context_tokens || 4096}</strong></div>
                      <div>Embedding Dim: <strong>{vm.embedding_dim || 768}</strong></div>
                      {vm.latency_p95_ms && <div>Latency (p95): <strong>{vm.latency_p95_ms} ms</strong></div>}
                      {vm.max_resolution && <div>Max Resolution: <strong>{vm.max_resolution}</strong></div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Stream Feed Simulator Tab */}
          {activeTab === 'stream' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Simulated Camera Feed */}
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
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>📷 Live Camera Stream Preview</span>
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
                    1920x1080 • RGB • H.264
                  </div>
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
                    VLA Spatial Visual Grid Active
                  </span>
                </div>
              </div>

              {/* Simulated Sensory Telemetry */}
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
                <span style={{ fontSize: 13, fontWeight: 600, color: '#c084fc' }}>🎙️ Audio & Sensor Telemetry</span>
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
                  <div>[AUDIO] Sample Rate: 44.1kHz • Channels: 2 • SNR: 48dB</div>
                  <div>[SENSOR] IMU Gyro: (0.02, -0.01, 0.98) G</div>
                  <div>[VLA] Action Inference Latency: 32ms</div>
                  <div>[STATUS] Gating: Enforced • Token Budget: OK</div>
                  <div>[HEARTBEAT] Stream synced at {new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* JSON Export Tab */}
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

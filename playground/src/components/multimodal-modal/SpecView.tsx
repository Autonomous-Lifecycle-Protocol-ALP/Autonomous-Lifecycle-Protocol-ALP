import React from 'react';
import type { AlpMultimodal, AlpActionSpace, AlpVisionModel } from '@autonomous-lifecycle-protocol-alp/parser';
import { FiEye, FiCpu } from 'react-icons/fi';
import { COLORS, cardStyle, badgeStyle } from './shared.js';
import { AssetGrid } from './AssetGrid.js';

interface SpecViewProps {
  tab: 'overview' | 'models';
  mmObjects: AlpMultimodal[];
  actionSpaces: AlpActionSpace[];
  visionModels: AlpVisionModel[];
  engine: { validateMultimodal: (mm: AlpMultimodal) => { valid: boolean; errors: string[]; warnings: string[]; safetyScore: number }; validateActionSpace: (as: AlpActionSpace) => { valid: boolean; errors: string[]; warnings: string[]; criticalActionCount: number }; validateVisionModel: (vm: AlpVisionModel) => { valid: boolean; errors: string[] }; estimateTokenCost: (modalities: string[], assets: { id: string; type: string; uri?: string }[], vm?: AlpVisionModel) => number };
  selectedVisionModelId: string;
  setSelectedVisionModelId: (id: string) => void;
  primaryVisionModel: AlpVisionModel | undefined;
  totalTokens: number;
  maxContext: number;
  tokenPercentage: number;
}

export function SpecView({
  tab,
  mmObjects,
  actionSpaces,
  visionModels,
  engine,
  selectedVisionModelId,
  setSelectedVisionModelId,
  primaryVisionModel,
  totalTokens,
  maxContext,
  tokenPercentage,
}: SpecViewProps): React.JSX.Element | null {
  if (tab === 'models') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {visionModels.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 36,
              color: COLORS.textMuted,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 8,
            }}
          >
            <FiCpu size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: 13 }}>No @vision_model blocks declared.</p>
          </div>
        ) : (
          visionModels.map((vm) => {
            const vmValidation = engine.validateVisionModel(vm);
            return (
              <div
                key={vm.id}
                style={{
                  ...cardStyle,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.purple }}>{vm.id}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: COLORS.purple,
                      borderRadius: 12,
                    }}
                  >
                    {vm.backbone}
                  </span>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textSecondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Context Tokens: <strong>{vm.context_tokens || 4096}</strong></div>
                  <div>Embedding Dim: <strong>{vm.embedding_dim || 768}</strong></div>
                  {vm.latency_p95_ms && <div>Latency (p95): <strong>{vm.latency_p95_ms} ms</strong></div>}
                  {vm.max_resolution && <div>Max Resolution: <strong>{vm.max_resolution}</strong></div>}
                </div>
                {vmValidation.errors.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      borderRadius: 4,
                      border: '1px solid rgba(239,68,68,0.4)',
                      background: 'rgba(239,68,68,0.06)',
                      fontSize: 10,
                    }}
                  >
                    <ul style={{ margin: 0, padding: '0 0 0 14px', color: '#fca5a5' }}>
                      {vmValidation.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Model Selector for Budget Calculation */}
      {visionModels.length > 1 && (
        <div
          style={{
            ...cardStyle,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.purple, whiteSpace: 'nowrap' }}>
            Vision Model for Budget Calculation:
          </span>
          <select
            value={selectedVisionModelId}
            onChange={(e) => setSelectedVisionModelId(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.1)',
              background: COLORS.bgDarker,
              color: COLORS.textPrimary,
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
            }}
          >
            {visionModels.map((vm) => (
              <option key={vm.id} value={vm.id}>{vm.id} ({vm.backbone})</option>
            ))}
          </select>
        </div>
      )}

      {/* Context Budget Bar */}
      <div
        style={{
          ...cardStyle,
          border: `1px solid ${COLORS.borderCyan}`,
          padding: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.cyan }}>
            Multi-Modal Context Window Budget
          </span>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: COLORS.textSecondary }}>
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
                  ? COLORS.red
                  : tokenPercentage > 60
                  ? COLORS.amber
                  : `linear-gradient(90deg, ${COLORS.cyanBright}, ${COLORS.blue})`,
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
            color: COLORS.textMuted,
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
            const tokens = engine.estimateTokenCost(mm.modalities || [], mm.assets || [], primaryVisionModel);

            return (
              <div
                key={mm.id}
                style={{
                  ...cardStyle,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.cyan }}>{mm.id}</span>
                  <span
                    style={{
                      ...badgeStyle(
                        validation.valid ? COLORS.green : COLORS.red,
                        validation.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                      ),
                    }}
                  >
                    {validation.valid ? 'VALID SPEC' : 'ERRORS'}
                  </span>
                </div>

                <div style={{ margin: '10px 0', fontSize: 11, color: COLORS.textSecondary }}>
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
                          color: COLORS.cyan,
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

                <AssetGrid assets={mm.assets} />

                {/* Validation details */}
                {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {validation.errors.length > 0 && (
                      <div
                        style={{
                          padding: 8,
                          borderRadius: 4,
                          border: '1px solid rgba(239,68,68,0.4)',
                          background: 'rgba(239,68,68,0.06)',
                          fontSize: 10,
                        }}
                      >
                        <span style={{ color: '#f87171', fontWeight: 600 }}>Errors</span>
                        <ul style={{ margin: '4px 0 0 14px', padding: 0, color: '#fca5a5' }}>
                          {validation.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validation.warnings.length > 0 && (
                      <div
                        style={{
                          padding: 8,
                          borderRadius: 4,
                          border: '1px solid rgba(245,158,11,0.4)',
                          background: 'rgba(245,158,11,0.06)',
                          fontSize: 10,
                        }}
                      >
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>Warnings</span>
                        <ul style={{ margin: '4px 0 0 14px', padding: 0, color: '#fde68a' }}>
                          {validation.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 8px',
                      borderRadius: 12,
                      background: 'rgba(148,163,184,0.1)',
                      color: COLORS.textSecondary,
                    }}
                  >
                    Safety Score: {validation.safetyScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Spaces Validation */}
      {actionSpaces.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.cyan }}>
            Action Spaces Validation
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {actionSpaces.map((as) => {
              const asValidation = engine.validateActionSpace(as);
              return (
                <div
                  key={as.id}
                  style={{
                    ...cardStyle,
                    padding: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{as.id}</span>
                    <span
                      style={{
                        ...badgeStyle(
                          asValidation.valid ? COLORS.green : COLORS.red,
                          asValidation.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                        ),
                      }}
                    >
                      {asValidation.valid ? 'VALID' : 'ERRORS'}
                    </span>
                  </div>
                  {asValidation.errors.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        borderRadius: 4,
                        border: '1px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.06)',
                        fontSize: 10,
                      }}
                    >
                      <ul style={{ margin: 0, padding: '0 0 0 14px', color: '#fca5a5' }}>
                        {asValidation.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {asValidation.warnings.length > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        padding: 8,
                        borderRadius: 4,
                        border: '1px solid rgba(245,158,11,0.4)',
                        background: 'rgba(245,158,11,0.06)',
                        fontSize: 10,
                      }}
                    >
                      <ul style={{ margin: 0, padding: '0 0 0 14px', color: '#fde68a' }}>
                        {asValidation.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 10, color: COLORS.textSecondary }}>
                    Critical Actions: <strong>{asValidation.criticalActionCount}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vision Models Validation */}
      {visionModels.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.purple }}>
            Vision Models Validation
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {visionModels.map((vm) => {
              const vmValidation = engine.validateVisionModel(vm);
              return (
                <div
                  key={vm.id}
                  style={{
                    ...cardStyle,
                    padding: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{vm.id}</span>
                    <span
                      style={{
                        ...badgeStyle(
                          vmValidation.valid ? COLORS.green : COLORS.red,
                          vmValidation.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                        ),
                      }}
                    >
                      {vmValidation.valid ? 'VALID' : 'ERRORS'}
                    </span>
                  </div>
                  {vmValidation.errors.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        borderRadius: 4,
                        border: '1px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.06)',
                        fontSize: 10,
                      }}
                    >
                      <ul style={{ margin: 0, padding: '0 0 0 14px', color: '#fca5a5' }}>
                        {vmValidation.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

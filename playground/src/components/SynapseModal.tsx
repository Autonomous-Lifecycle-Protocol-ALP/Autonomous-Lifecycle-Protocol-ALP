import React, { useState, useMemo, useCallback } from 'react';
import { SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';
import type { SynapseTopology } from '@autonomous-lifecycle-protocol-alp/sdk';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import {
  FiX,
  FiDownload,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';

interface SynapseModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedObjects: AlpObject[];
}

export function SynapseModal({ isOpen, onClose, parsedObjects }: SynapseModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'topology' | 'vault' | 'canvas' | 'mermaid' | 'dot'>('topology');
  const [copied, setCopied] = useState<string | null>(null);

  const engine = useMemo(() => new SynapseEngine(), []);

  const topology: SynapseTopology = useMemo(() => {
    return engine.buildTopology(parsedObjects);
  }, [engine, parsedObjects]);

  const vaultFiles = useMemo(() => {
    return engine.generateVault(parsedObjects);
  }, [engine, parsedObjects]);

  const canvasData = useMemo(() => {
    return engine.generateCanvas(topology);
  }, [engine, topology]);

  const mermaidStr = useMemo(() => {
    return engine.toMermaid(topology);
  }, [engine, topology]);

  const dotStr = useMemo(() => {
    return engine.toDot(topology);
  }, [engine, topology]);

  const mocContent = useMemo(() => {
    const moc = vaultFiles.find((f) => f.relativePath === 'MOC.md');
    return moc ? moc.content : '';
  }, [vaultFiles]);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  }, []);

  const handleDownloadCanvas = useCallback(() => {
    const blob = new Blob([JSON.stringify(canvasData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synapse.canvas';
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasData]);

  const handleDownloadVaultJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(vaultFiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-vault-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [vaultFiles]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="synapse-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '85vh',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            background: 'linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              🧠
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span id="synapse-title" style={{ fontSize: '16px', fontWeight: 700 }}>Synapse Knowledge Graph &amp; Canvas Vault</span>
                <span
                  style={{
                    fontSize: '11px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                  }}
                >
                  v80.0.0
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Bi-directional linked vault notes, Canvas diagrams &amp; graph analytics
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* HUD Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
            padding: '12px 20px',
            background: '#090d16',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ background: '#1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Nodes</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>{topology.stats.totalNodes}</div>
          </div>
          <div style={{ background: '#1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Edges</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#4ade80' }}>{topology.stats.totalEdges}</div>
          </div>
          <div style={{ background: '#1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Central Hubs</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#c084fc' }}>{topology.stats.centralHubs.length}</div>
          </div>
          <div style={{ background: '#1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Density</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#facc15' }}>{topology.stats.density.toFixed(3)}</div>
          </div>
          <div style={{ background: '#1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Broken Links</div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: topology.stats.brokenLinks.length > 0 ? '#f87171' : '#4ade80',
              }}
            >
              {topology.stats.brokenLinks.length}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 20px',
            borderBottom: '1px solid #1e293b',
            background: '#0f172a',
          }}
        >
          {[
            { id: 'topology', label: 'Topology & Nodes' },
            { id: 'vault', label: 'Map of Content (MOC)' },
            { id: 'canvas', label: 'JSON Canvas (.canvas)' },
            { id: 'mermaid', label: 'Mermaid' },
            { id: 'dot', label: 'Graphviz DOT' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? '#6366f1' : '#1e293b',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'topology' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {topology.nodes.map((node) => (
                  <div
                    key={node.id}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: node.color,
                        }}
                      >
                        {node.type}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          background: '#0f172a',
                          color: '#94a3b8',
                          padding: '1px 6px',
                          borderRadius: '8px',
                        }}
                      >
                        Degree: {node.degree}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      [[{node.id}]]
                    </div>
                    {node.status && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                        Status: <span style={{ color: '#38bdf8' }}>{node.status}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                      <span>Out: {node.outLinks.length}</span>
                      <span>In: {node.inLinks.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Generated {vaultFiles.length} Markdown vault files with [[wikilinks]]
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCopy(mocContent, 'moc')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {copied === 'moc' ? <FiCheck color="#4ade80" /> : <FiCopy />} Copy MOC
                  </button>
                  <button
                    onClick={handleDownloadVaultJson}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    <FiDownload /> Download Vault JSON
                  </button>
                </div>
              </div>
              <pre
                style={{
                  background: '#090d16',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#e2e8f0',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {mocContent}
              </pre>
            </div>
          )}

          {activeTab === 'canvas' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  JSON Canvas Specification 1.0 (Compatible with Obsidian Canvas, VS Code Canvas)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCopy(JSON.stringify(canvasData, null, 2), 'canvas')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {copied === 'canvas' ? <FiCheck color="#4ade80" /> : <FiCopy />} Copy JSON
                  </button>
                  <button
                    onClick={handleDownloadCanvas}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    <FiDownload /> Download .canvas
                  </button>
                </div>
              </div>
              <pre
                style={{
                  background: '#090d16',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#94a3b8',
                  overflowX: 'auto',
                  maxHeight: '400px',
                }}
              >
                {JSON.stringify(canvasData, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'mermaid' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                  onClick={() => handleCopy(mermaidStr, 'mermaid')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {copied === 'mermaid' ? <FiCheck color="#4ade80" /> : <FiCopy />} Copy Mermaid
                </button>
              </div>
              <pre
                style={{
                  background: '#090d16',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#e2e8f0',
                  overflowX: 'auto',
                }}
              >
                {mermaidStr}
              </pre>
            </div>
          )}

          {activeTab === 'dot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                  onClick={() => handleCopy(dotStr, 'dot')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {copied === 'dot' ? <FiCheck color="#4ade80" /> : <FiCopy />} Copy Graphviz DOT
                </button>
              </div>
              <pre
                style={{
                  background: '#090d16',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#e2e8f0',
                  overflowX: 'auto',
                }}
              >
                {dotStr}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

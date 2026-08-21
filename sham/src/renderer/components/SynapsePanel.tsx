import React, { useState, useMemo, useCallback } from 'react';
import { SynapseEngine, SynapseTopology, SynapseNode, SynapseVaultFile } from '@autonomous-lifecycle-protocol-alp/sdk';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from './Icon.js';

interface SynapsePanelProps {
  parsedObjects?: AlpObject[] | null;
  onSelectNode?: (nodeId: string) => void;
}

const DEFAULT_SAMPLE_OBJECTS: AlpObject[] = [
  {
    _type: 'agent',
    id: 'agent-orchestrator',
    description: 'Master Orchestration & Task Delegation Agent',
    status: 'active',
  } as any,
  {
    _type: 'agent',
    id: 'agent-security',
    description: 'Zero-Trust & Vault Access Security Specialist',
    status: 'active',
  } as any,
  {
    _type: 'agent',
    id: 'agent-coder',
    description: 'Autonomous Software Engineering Agent',
    status: 'active',
  } as any,
  {
    _type: 'policy',
    id: 'policy-zero-trust',
    description: 'Enforce zero-trust token authentication on all service routes',
    guards: ['task-api-gateway', 'contract-oauth-bridge'],
  } as any,
  {
    _type: 'contract',
    id: 'contract-oauth-bridge',
    description: 'JWT OAuth2.0 Token Handshake Contract',
    status: 'active',
  } as any,
  {
    _type: 'vault',
    id: 'vault-jwt-secrets',
    description: 'Post-Quantum Encrypted Secret Store',
    recipients: ['agent-security'],
  } as any,
  {
    _type: 'task',
    id: 'task-api-gateway',
    status: '[~]',
    description: 'Implement reverse-proxy authentication gate',
    owner: 'agent-security',
    depends: ['contract-oauth-bridge', 'vault-jwt-secrets'],
  } as any,
  {
    _type: 'task',
    id: 'task-codegen-service',
    status: '[x]',
    description: 'Generate type-safe ALP runtime bindings',
    owner: 'agent-coder',
    depends: ['task-api-gateway'],
  } as any,
  {
    _type: 'workflow',
    id: 'wf-continuous-audit',
    description: 'Continuous Formal Verification & Security Scan',
    status: 'scheduled',
    steps: ['policy-zero-trust', 'task-api-gateway'],
  } as any,
];

export function SynapsePanel({ parsedObjects, onSelectNode }: SynapsePanelProps): React.JSX.Element {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'vault' | 'canvas' | 'analytics'>('graph');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const engine = useMemo(() => new SynapseEngine(), []);

  // Compute topology
  const activeObjects = useMemo(() => {
    if (parsedObjects && parsedObjects.length > 0) {
      return parsedObjects;
    }
    return DEFAULT_SAMPLE_OBJECTS;
  }, [parsedObjects]);

  const topology: SynapseTopology = useMemo(() => {
    return engine.buildTopology(activeObjects);
  }, [engine, activeObjects]);

  const vaultFiles: SynapseVaultFile[] = useMemo(() => {
    return engine.generateVault(activeObjects);
  }, [engine, activeObjects]);

  const canvasData = useMemo(() => {
    return engine.generateCanvas(topology);
  }, [engine, topology]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return topology.nodes.filter((node) => {
      const matchType = selectedType === 'all' || node.type === selectedType;
      const matchQuery =
        !searchQuery.trim() ||
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchQuery;
    });
  }, [topology.nodes, selectedType, searchQuery]);

  const selectedNode = useMemo(() => {
    return topology.nodes.find((n) => n.id === selectedNodeId) || filteredNodes[0] || null;
  }, [topology.nodes, selectedNodeId, filteredNodes]);

  // Node position map for SVG graph layout
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const total = filteredNodes.length;
    if (total === 0) return map;

    const centerX = 340;
    const centerY = 240;
    const radius = Math.min(220, Math.max(120, total * 24));

    filteredNodes.forEach((node, i) => {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      map.set(node.id, { x, y });
    });

    return map;
  }, [filteredNodes]);

  const handleExportVault = useCallback(() => {
    const jsonBlob = new Blob([JSON.stringify(vaultFiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-vault-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(`Exported ${vaultFiles.length} Markdown vault files and .canvas!`);
    setTimeout(() => setExportNotice(null), 4000);
  }, [vaultFiles]);

  const handleDownloadCanvas = useCallback(() => {
    const jsonBlob = new Blob([JSON.stringify(canvasData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synapse.canvas';
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('Downloaded synapse.canvas for Obsidian/Canvas viewers!');
    setTimeout(() => setExportNotice(null), 4000);
  }, [canvasData]);

  const handleCopyMermaid = useCallback(() => {
    const mermaid = engine.toMermaid(topology);
    navigator.clipboard.writeText(mermaid);
    setExportNotice('Copied Mermaid graph to clipboard!');
    setTimeout(() => setExportNotice(null), 3000);
  }, [engine, topology]);

  const mocContent = useMemo(() => {
    const moc = vaultFiles.find((f) => f.relativePath === 'MOC.md');
    return moc ? moc.content : '';
  }, [vaultFiles]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0d1117',
        color: '#c9d1d9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #21262d',
          background: '#161b22',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: '#ffffff',
            }}
          >
            <Icon name="network" size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#f0f6fc' }}>Synapse Knowledge Graph</span>
              <span
                style={{
                  fontSize: '10px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#a78bfa',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}
              >
                v80.0.0
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#8b949e' }}>
              Bi-directional Wikilinks, Force-Directed Topology &amp; Canvas Vault
            </div>
          </div>
        </div>

        {/* View mode switcher */}
        <div style={{ display: 'flex', gap: '4px', background: '#0d1117', padding: '3px', borderRadius: '6px', border: '1px solid #30363d' }}>
          <button
            onClick={() => setViewMode('graph')}
            style={{
              background: viewMode === 'graph' ? '#238636' : 'transparent',
              color: viewMode === 'graph' ? '#fff' : '#8b949e',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Graph View
          </button>
          <button
            onClick={() => setViewMode('vault')}
            style={{
              background: viewMode === 'vault' ? '#238636' : 'transparent',
              color: viewMode === 'vault' ? '#fff' : '#8b949e',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Vault MOC
          </button>
          <button
            onClick={() => setViewMode('canvas')}
            style={{
              background: viewMode === 'canvas' ? '#238636' : 'transparent',
              color: viewMode === 'canvas' ? '#fff' : '#8b949e',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            .canvas JSON
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            style={{
              background: viewMode === 'analytics' ? '#238636' : 'transparent',
              color: viewMode === 'analytics' ? '#fff' : '#8b949e',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Topology Stats
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportVault}
            title="Export full Synapse Markdown vault with [[wikilinks]]"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1f6feb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Icon name="fileText" size={13} /> Export Vault
          </button>
          <button
            onClick={handleDownloadCanvas}
            title="Download interactive JSON Canvas file"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#238636',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Icon name="palette" size={13} /> .canvas
          </button>
          <button
            onClick={handleCopyMermaid}
            title="Copy Mermaid diagram"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#21262d',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <Icon name="share2" size={13} /> Mermaid
          </button>
        </div>
      </div>

      {/* Notification toast */}
      {exportNotice && (
        <div
          style={{
            background: 'rgba(35, 134, 54, 0.15)',
            borderBottom: '1px solid #238636',
            color: '#3fb950',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          ✅ {exportNotice}
        </div>
      )}

      {/* Stats Quick HUD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          padding: '10px 16px',
          background: '#11161d',
          borderBottom: '1px solid #21262d',
          fontSize: '11px',
        }}
      >
        <div style={{ background: '#161b22', padding: '6px 10px', borderRadius: '4px', border: '1px solid #30363d' }}>
          <div style={{ color: '#8b949e' }}>Total Nodes</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#58a6ff' }}>{topology.stats.totalNodes}</div>
        </div>
        <div style={{ background: '#161b22', padding: '6px 10px', borderRadius: '4px', border: '1px solid #30363d' }}>
          <div style={{ color: '#8b949e' }}>Total Edges</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#3fb950' }}>{topology.stats.totalEdges}</div>
        </div>
        <div style={{ background: '#161b22', padding: '6px 10px', borderRadius: '4px', border: '1px solid #30363d' }}>
          <div style={{ color: '#8b949e' }}>Graph Density</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#d29922' }}>{topology.stats.density.toFixed(3)}</div>
        </div>
        <div style={{ background: '#161b22', padding: '6px 10px', borderRadius: '4px', border: '1px solid #30363d' }}>
          <div style={{ color: '#8b949e' }}>Central Hubs</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#bc8cff' }}>{topology.stats.centralHubs.length}</div>
        </div>
        <div style={{ background: '#161b22', padding: '6px 10px', borderRadius: '4px', border: '1px solid #30363d' }}>
          <div style={{ color: '#8b949e' }}>Orphan Nodes</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: topology.stats.orphanNodes.length > 0 ? '#f85149' : '#8b949e' }}>
            {topology.stats.orphanNodes.length}
          </div>
        </div>
        <div style={{ background: '#161b22', padding: '6px 10px', borderRadius: '4px', border: '1px solid #30363d' }}>
          <div style={{ color: '#8b949e' }}>Broken Links</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: topology.stats.brokenLinks.length > 0 ? '#f85149' : '#8b949e' }}>
            {topology.stats.brokenLinks.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: '#0d1117',
          borderBottom: '1px solid #21262d',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, maxWidth: '280px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search nodes, wikilinks, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#c9d1d9',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: '#8b949e',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ color: '#8b949e' }}>Filter Type:</span>
          {['all', 'task', 'agent', 'policy', 'contract', 'workflow', 'vault'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              style={{
                background: selectedType === t ? '#30363d' : 'transparent',
                color: selectedType === t ? '#f0f6fc' : '#8b949e',
                border: '1px solid',
                borderColor: selectedType === t ? '#8b949e' : '#21262d',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Center Canvas / Content Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'auto', background: '#090d13' }}>
          {viewMode === 'graph' && (
            <div style={{ width: '100%', height: '100%', minHeight: '480px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 680 480" style={{ display: 'block' }}>
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="18"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#8b949e" />
                  </marker>
                </defs>

                {/* Edges */}
                {topology.edges.map((edge, idx) => {
                  const sourcePos = nodePositions.get(edge.source);
                  const targetPos = nodePositions.get(edge.target);
                  if (!sourcePos || !targetPos) return null;

                  const isHighlighted =
                    selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

                  return (
                    <g key={`edge-${idx}`}>
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isHighlighted ? '#58a6ff' : '#30363d'}
                        strokeWidth={isHighlighted ? 2.5 : 1.2}
                        strokeDasharray={edge.relation === 'guards' ? '4,4' : undefined}
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {filteredNodes.map((node) => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        if (onSelectNode) onSelectNode(node.id);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        r={isSelected ? 22 : 18}
                        fill={node.color || '#3b82f6'}
                        stroke={isSelected ? '#ffffff' : '#161b22'}
                        strokeWidth={isSelected ? 3 : 2}
                        opacity={0.9}
                      />
                      <text
                        textAnchor="middle"
                        dy="4"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {node.type.slice(0, 2).toUpperCase()}
                      </text>
                      <text
                        textAnchor="middle"
                        dy={isSelected ? '32' : '28'}
                        fill={isSelected ? '#f0f6fc' : '#c9d1d9'}
                        fontSize="11"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        pointerEvents="none"
                      >
                        {node.id}
                      </text>
                      {/* Degree badge */}
                      <circle cx="14" cy="-14" r="8" fill="#21262d" stroke="#30363d" strokeWidth="1" />
                      <text textAnchor="middle" x="14" y="-11" fill="#8b949e" fontSize="9" fontWeight="bold">
                        {node.degree}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {viewMode === 'vault' && (
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <div
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#58a6ff', marginBottom: '12px' }}>
                  📄 Map of Content (MOC.md) Preview
                </div>
                <pre
                  style={{
                    background: '#0d1117',
                    padding: '14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: '#c9d1d9',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {mocContent}
                </pre>
              </div>
            </div>
          )}

          {viewMode === 'canvas' && (
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <div
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#3fb950', marginBottom: '12px' }}>
                  🎨 Interactive JSON Canvas (.canvas)
                </div>
                <pre
                  style={{
                    background: '#0d1117',
                    padding: '14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: '#8b949e',
                    overflowX: 'auto',
                    maxHeight: '420px',
                  }}
                >
                  {JSON.stringify(canvasData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {viewMode === 'analytics' && (
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div
                  style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#bc8cff', marginBottom: '10px' }}>
                    🏆 Top Central Hubs
                  </div>
                  {topology.stats.centralHubs.length === 0 ? (
                    <div style={{ color: '#8b949e', fontSize: '12px' }}>No hubs detected</div>
                  ) : (
                    topology.stats.centralHubs.map((hub) => (
                      <div
                        key={hub.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid #21262d',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: '#58a6ff', fontWeight: 500 }}>[[{hub.id}]]</span>
                        <span style={{ color: '#8b949e' }}>Degree {hub.degree}</span>
                      </div>
                    ))
                  )}
                </div>

                <div
                  style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#d29922', marginBottom: '10px' }}>
                    📦 Object Type Distribution
                  </div>
                  {Object.entries(topology.stats.byTypeCount).map(([type, count]) => (
                    <div
                      key={type}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid #21262d',
                        fontSize: '12px',
                        textTransform: 'capitalize',
                      }}
                    >
                      <span style={{ color: '#c9d1d9' }}>{type}</span>
                      <span style={{ fontWeight: 600, color: '#58a6ff' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Inspector Sidebar */}
        {selectedNode && (
          <div
            style={{
              width: '300px',
              borderLeft: '1px solid #21262d',
              background: '#161b22',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: selectedNode.color || '#58a6ff',
                  }}
                >
                  {selectedNode.type}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    background: '#21262d',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    color: '#8b949e',
                  }}
                >
                  Degree: {selectedNode.degree}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0f6fc', wordBreak: 'break-all' }}>
                [[{selectedNode.id}]]
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>{selectedNode.title}</div>
            </div>

            {/* Outgoing Links (Dependencies) */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', marginBottom: '6px' }}>
                OUTGOING WIKILINKS ({selectedNode.outLinks.length})
              </div>
              {selectedNode.outLinks.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#6e7681' }}>None</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedNode.outLinks.map((target) => (
                    <button
                      key={target}
                      onClick={() => setSelectedNodeId(target)}
                      style={{
                        textAlign: 'left',
                        background: '#0d1117',
                        border: '1px solid #30363d',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        color: '#58a6ff',
                        cursor: 'pointer',
                      }}
                    >
                      → [[{target}]]
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming Links (Backlinks) */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', marginBottom: '6px' }}>
                INCOMING BACKLINKS ({selectedNode.inLinks.length})
              </div>
              {selectedNode.inLinks.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#6e7681' }}>None</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedNode.inLinks.map((source) => (
                    <button
                      key={source}
                      onClick={() => setSelectedNodeId(source)}
                      style={{
                        textAlign: 'left',
                        background: '#0d1117',
                        border: '1px solid #30363d',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        color: '#3fb950',
                        cursor: 'pointer',
                      }}
                    >
                      ← [[{source}]]
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', marginBottom: '6px' }}>TAGS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {selectedNode.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '10px',
                      background: '#21262d',
                      color: '#c9d1d9',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

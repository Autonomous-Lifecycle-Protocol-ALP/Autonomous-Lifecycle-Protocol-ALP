import React, { useState, useMemo, useCallback } from 'react';
import { SynapseEngine, SynapseTopology, SynapseNode, SynapseVaultFile } from '@autonomous-lifecycle-protocol-alp/sdk';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';
import { SynapseInspector } from '../synapse/SynapseInspector.js';
import { TopologyStats } from './TopologyStats.js';
import { NodeFilter } from './NodeFilter.js';
import { ExportButtons } from './ExportButtons.js';
import { SynapseGraphView } from './GraphView.js';
import { COLORS, DEFAULT_SAMPLE_OBJECTS, downloadJsonFile, buildVaultDownloadName } from './shared.js';
import type { ViewMode, SynapsePanelProps } from './shared.js';

function HeaderToolbar({ viewMode, setViewMode, onExportVault, onDownloadCanvas, onCopyMermaid }: HeaderToolbarProps): React.JSX.Element {
  const viewButtons: { key: ViewMode; label: string }[] = [
    { key: 'graph', label: 'Graph View' },
    { key: 'vault', label: 'Vault MOC' },
    { key: 'canvas', label: '.canvas JSON' },
    { key: 'analytics', label: 'Topology Stats' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgHeader }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#ffffff' }}>
          <Icon name="network" size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: COLORS.textBright }}>Synapse Knowledge Graph</span>
            <span style={{ fontSize: '10px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>v80.0.0</span>
          </div>
          <div style={{ fontSize: '11px', color: COLORS.textMuted }}>Bi-directional Wikilinks, Force-Directed Topology &amp; Canvas Vault</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', background: COLORS.bg, padding: '3px', borderRadius: '6px', border: `1px solid ${COLORS.borderLight}` }}>
        {viewButtons.map((b) => (
          <button key={b.key} onClick={() => setViewMode(b.key)} style={{ background: viewMode === b.key ? COLORS.greenBg : 'transparent', color: viewMode === b.key ? '#fff' : COLORS.textMuted, border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}>{b.label}</button>
        ))}
      </div>
      <ExportButtons vaultFiles={[]} canvasData={null} onExportVault={onExportVault} onDownloadCanvas={onDownloadCanvas} onCopyMermaid={onCopyMermaid} />
    </div>
  );
}

function NotificationToast({ message }: { message: string }): React.JSX.Element {
  return (
    <div style={{ background: 'rgba(35, 134, 54, 0.15)', borderBottom: `1px solid ${COLORS.greenBg}`, color: COLORS.green, padding: '6px 16px', fontSize: '12px', fontWeight: 500 }}>✅ {message}</div>
  );
}

function WorkspaceBody({ viewMode, topology, filteredNodes, nodePositions, selectedNode, selectedNodeId, setSelectedNodeId, onSelectNode, mocContent, canvasData }: WorkspaceBodyProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'auto', background: '#090d13' }}>
        {viewMode === 'graph' && (
          <SynapseGraphView topology={topology} filteredNodes={filteredNodes} nodePositions={nodePositions} selectedNode={selectedNode} selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId} onSelectNode={onSelectNode} />
        )}
        {viewMode === 'vault' && (
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ background: COLORS.bgHeader, border: `1px solid ${COLORS.borderLight}`, borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.accent, marginBottom: '12px' }}>📄 Map of Content (MOC.md) Preview</div>
              <pre style={{ background: COLORS.bg, padding: '14px', borderRadius: '6px', fontSize: '12px', lineHeight: '1.5', color: COLORS.text, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{mocContent}</pre>
            </div>
          </div>
        )}
        {viewMode === 'canvas' && (
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ background: COLORS.bgHeader, border: `1px solid ${COLORS.borderLight}`, borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.green, marginBottom: '12px' }}>🎨 Interactive JSON Canvas (.canvas)</div>
              <pre style={{ background: COLORS.bg, padding: '14px', borderRadius: '6px', fontSize: '12px', lineHeight: '1.5', color: COLORS.textMuted, overflowX: 'auto', maxHeight: '420px' }}>{JSON.stringify(canvasData, null, 2)}</pre>
            </div>
          </div>
        )}
        {viewMode === 'analytics' && (
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: COLORS.bgHeader, border: `1px solid ${COLORS.borderLight}`, borderRadius: '6px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.violet, marginBottom: '10px' }}>🏆 Top Central Hubs</div>
                {topology.stats.centralHubs.length === 0 ? (
                  <div style={{ color: COLORS.textMuted, fontSize: '12px' }}>No hubs detected</div>
                ) : (
                  topology.stats.centralHubs.map((hub) => (
                    <div key={hub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: '12px' }}>
                      <span style={{ color: COLORS.accent, fontWeight: 500 }}>[[{hub.id}]]</span>
                      <span style={{ color: COLORS.textMuted }}>Degree {hub.degree}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ background: COLORS.bgHeader, border: `1px solid ${COLORS.borderLight}`, borderRadius: '6px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.yellow, marginBottom: '10px' }}>📦 Object Type Distribution</div>
                {Object.entries(topology.stats.byTypeCount).map(([type, count]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: '12px', textTransform: 'capitalize' }}>
                    <span style={{ color: COLORS.text }}>{type}</span>
                    <span style={{ fontWeight: 600, color: COLORS.accent }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedNode && <SynapseInspector selectedNode={selectedNode} setSelectedNodeId={setSelectedNodeId} />}
    </div>
  );
}

interface HeaderToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExportVault: () => void;
  onDownloadCanvas: () => void;
  onCopyMermaid: () => void;
}

interface WorkspaceBodyProps {
  viewMode: ViewMode;
  topology: SynapseTopology;
  filteredNodes: SynapseNode[];
  nodePositions: Map<string, { x: number; y: number }>;
  selectedNode: SynapseNode | null;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string) => void;
  onSelectNode?: (nodeId: string) => void;
  mocContent: string;
  canvasData: unknown;
}

export function SynapsePanel({ parsedObjects, onSelectNode }: SynapsePanelProps): React.JSX.Element {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const engine = useMemo(() => new SynapseEngine(), []);

  const activeObjects = useMemo(() => {
    if (parsedObjects && parsedObjects.length > 0) return parsedObjects;
    return DEFAULT_SAMPLE_OBJECTS;
  }, [parsedObjects]);

  const topology: SynapseTopology = useMemo(() => engine.buildTopology(activeObjects), [engine, activeObjects]);
  const vaultFiles: SynapseVaultFile[] = useMemo(() => engine.generateVault(activeObjects), [engine, activeObjects]);
  const canvasData = useMemo(() => engine.generateCanvas(topology), [engine, topology]);

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
    downloadJsonFile(buildVaultDownloadName(), vaultFiles);
    setExportNotice(`Exported ${vaultFiles.length} Markdown vault files and .canvas!`);
    setTimeout(() => setExportNotice(null), 4000);
  }, [vaultFiles]);

  const handleDownloadCanvas = useCallback(() => {
    downloadJsonFile('synapse.canvas', canvasData);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLORS.bg, color: COLORS.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <HeaderToolbar viewMode={viewMode} setViewMode={setViewMode} onExportVault={handleExportVault} onDownloadCanvas={handleDownloadCanvas} onCopyMermaid={handleCopyMermaid} />
      {exportNotice && <NotificationToast message={exportNotice} />}
      <TopologyStats topology={topology} />
      <NodeFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedType={selectedType} onTypeChange={setSelectedType} />
      <WorkspaceBody
        viewMode={viewMode}
        topology={topology}
        filteredNodes={filteredNodes}
        nodePositions={nodePositions}
        selectedNode={selectedNode}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        onSelectNode={onSelectNode}
        mocContent={mocContent}
        canvasData={canvasData}
      />
    </div>
  );
}
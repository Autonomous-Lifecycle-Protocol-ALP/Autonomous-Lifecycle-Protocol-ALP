import React, { useState, useMemo, useEffect } from 'react';
import {
  AgentStudioEngine,
  StudioProject,
  VisualNodeType,
  CapabilityListing,
} from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';
import { StudioTab } from './shared.js';
import { DAGCanvas } from './DAGCanvas.js';
import { TemplateSelector } from './TemplateSelector.js';
import { MarketplaceBrowser } from './MarketplaceBrowser.js';

export function AgentStudioPanel(): React.JSX.Element {
  const engine = useMemo(() => new AgentStudioEngine(), []);

  // Initialize with the fullstack swarm template
  const [project, setProject] = useState<StudioProject>(() => {
    return engine.createProject('Enterprise Agent Swarm', 'tpl-fullstack', 'Production autonomous lifecycle agent pipeline');
  });

  const [activeTab, setActiveTab] = useState<StudioTab>('canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Revalidate on project change
  const validation = useMemo(() => {
    return engine.validateDAG(project.projectId);
  }, [project, engine]);

  // Export specification on project change
  const alpSpec = useMemo(() => {
    return engine.exportProject(project.projectId);
  }, [project, engine]);

  const templates = useMemo(() => engine.listTemplates(), [engine]);
  const capabilities = useMemo(() => engine.listCapabilities(), [engine]);

  const handleAddNode = (type: VisualNodeType, label: string) => {
    engine.addNode(project.projectId, type, label);
    const updated = engine.getProject(project.projectId);
    if (updated) setProject({ ...updated });
  };

  const handleRemoveNode = (nodeId: string) => {
    engine.removeNode(project.projectId, nodeId);
    const updated = engine.getProject(project.projectId);
    if (updated) setProject({ ...updated });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleAddEdge = (from: string, to: string, label?: string) => {
    engine.addEdge(project.projectId, from, to, label);
    const updated = engine.getProject(project.projectId);
    if (updated) setProject({ ...updated });
  };

  const handleRemoveEdge = (edgeId: string) => {
    engine.removeEdge(project.projectId, edgeId);
    const updated = engine.getProject(project.projectId);
    if (updated) setProject({ ...updated });
  };

  const handleSelectTemplate = (templateId: string) => {
    const newProject = engine.createProject(`${project.name} (${templateId})`, templateId);
    setProject(newProject);
    setSelectedNodeId(null);
    setActiveTab('canvas');
  };

  const handleInstallCapability = (capability: CapabilityListing) => {
    if (selectedNodeId) {
      const node = project.nodes.find(n => n.id === selectedNodeId);
      if (node) {
        if (!node.capabilities) node.capabilities = [];
        if (!node.capabilities.includes(capability.name.toLowerCase().replace(/\s+/g, '-'))) {
          node.capabilities.push(capability.name.toLowerCase().replace(/\s+/g, '-'));
          setProject({ ...project });
        }
      }
    } else if (project.nodes.length > 0) {
      const first = project.nodes[0];
      if (!first.capabilities) first.capabilities = [];
      first.capabilities.push(capability.name.toLowerCase().replace(/\s+/g, '-'));
      setProject({ ...project });
    }
    setActiveTab('canvas');
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(alpSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const s = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
    },
    header: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box' as const,
      background: 'var(--bg-secondary)',
    },
    kpiRow: {
      display: 'flex',
      gap: '8px',
      padding: '8px var(--spacing-md)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      flexWrap: 'wrap' as const,
    },
    kpiCard: (accent: string) => ({
      flex: 1,
      minWidth: '120px',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius)',
      padding: '8px 12px',
      border: `1px solid ${accent}33`,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 2,
    }),
    tabNav: {
      display: 'flex',
      gap: '4px',
      borderBottom: '1px solid var(--border)',
      padding: '0 var(--spacing-md)',
      background: 'var(--bg-secondary)',
    },
    tabBtn: (active: boolean) => ({
      padding: '8px 16px',
      background: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }),
    body: {
      flex: 1,
      overflow: 'hidden',
      padding: 'var(--spacing-md)',
      display: 'flex',
      flexDirection: 'column' as const,
    },
  };

  return (
    <div style={s.container} data-testid="agent-studio-panel">
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--accent)' }}><Icon name="palette" size={20} /></span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>ALP Agent Studio</span>
              <span className="badge" style={{ background: 'var(--accent)22', color: 'var(--accent)' }}>Visual DAG</span>
              <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>v82.0.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Project: <strong style={{ color: 'var(--text-primary)' }}>{project.name}</strong>
              {project.template && <span> · Template: <span style={{ color: 'var(--accent)' }}>{project.template}</span></span>}
            </div>
          </div>
        </div>

        {/* Validation Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: validation.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${validation.valid ? '#10b981' : '#ef4444'}`,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: validation.valid ? '#34d399' : '#f87171',
            }}
          >
            <Icon name={validation.valid ? 'checkCircle' : 'alertTriangle'} size={14} />
            <span>{validation.valid ? 'DAG Valid (Acyclic)' : 'Cycle Detected'}</span>
          </div>

          <button
            className="btn btn-sm btn-secondary"
            onClick={handleCopySpec}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.8rem' }}
          >
            <Icon name={copied ? 'check' : 'code'} size={14} />
            {copied ? 'Copied!' : 'Copy ALP'}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={s.kpiRow}>
        <div style={s.kpiCard('var(--accent-blue)')}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>NODES</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{project.nodes.length}</span>
        </div>
        <div style={s.kpiCard('var(--accent-green)')}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>EDGES</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-green)' }}>{project.edges.length}</span>
        </div>
        <div style={s.kpiCard('var(--accent)')}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOPOLOGICAL STEPS</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
            {validation.topologicalOrder?.length || 0}
          </span>
        </div>
        <div style={s.kpiCard(validation.valid ? 'var(--accent-green)' : 'var(--accent-red)')}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DAG STATUS</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: validation.valid ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {validation.valid ? 'OPTIMAL' : 'CYCLIC'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={s.tabNav}>
        <button style={s.tabBtn(activeTab === 'canvas')} onClick={() => setActiveTab('canvas')}>
          <Icon name="palette" size={14} /> DAG Canvas
        </button>
        <button style={s.tabBtn(activeTab === 'templates')} onClick={() => setActiveTab('templates')}>
          <Icon name="box" size={14} /> Templates ({templates.length})
        </button>
        <button style={s.tabBtn(activeTab === 'marketplace')} onClick={() => setActiveTab('marketplace')}>
          <Icon name="shoppingBag" size={14} /> Capabilities ({capabilities.length})
        </button>
        <button style={s.tabBtn(activeTab === 'export')} onClick={() => setActiveTab('export')}>
          <Icon name="code" size={14} /> ALP Export
        </button>
      </div>

      {/* Tab Body */}
      <div style={s.body}>
        {activeTab === 'canvas' && (
          <DAGCanvas
            nodes={project.nodes}
            edges={project.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onAddNode={handleAddNode}
            onRemoveNode={handleRemoveNode}
            onAddEdge={handleAddEdge}
            onRemoveEdge={handleRemoveEdge}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateSelector
            templates={templates}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceBrowser
            capabilities={capabilities}
            onInstallCapability={handleInstallCapability}
          />
        )}

        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>Generated Autonomous Lifecycle Protocol (.alp)</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Declarative specification synthesized directly from your visual DAG topology.
                </p>
              </div>
              <button className="btn btn-sm btn-primary" onClick={handleCopySpec}>
                <Icon name={copied ? 'check' : 'code'} size={14} /> {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre
              style={{
                flex: 1,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                color: 'var(--text-primary)',
                fontFamily: 'Fira Code, monospace',
                fontSize: '0.85rem',
                overflow: 'auto',
                lineHeight: 1.5,
              }}
            >
              {alpSpec}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

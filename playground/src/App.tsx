import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactFlow, {
  Background,
  Controls,
  Position,
  Handle,
  MarkerType,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type { Edge, Node, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { AlpParser, AlpGraph } from '@autonomous-lifecycle-protocol-alp/parser';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import './App.css';

// ── Preset Templates ───────────────────────────────────────────────────
const TEMPLATES: Record<string, { label: string; code: string }> = {
  webApp: {
    label: '🚀 Web App Lifecycle',
    code: `!alp-version: 3.0.0

@project
  id: alp-commerce-app
  status: [~]
  description: "Next-gen Autonomous E-Commerce Platform"

@feature
  id: feat-auth
  status: [x]
  description: "User Authentication & OAuth2"

@feature
  id: feat-checkout
  status: [~]
  description: "Stripe & Crypto Payment Gateway"

@task
  id: task-db-schema
  status: [x]
  feature: -> feat-auth
  owner: "@agent-backend"
  verify:
    - "npm run db:migrate"

@task
  id: task-auth-api
  status: [x]
  feature: -> feat-auth
  depends_on:
    - -> task-db-schema
  verify:
    - "npm test tests/auth.test.ts"

@task
  id: task-cart-api
  status: [~]
  feature: -> feat-checkout
  depends_on:
    - -> task-auth-api
  verify:
    - "npm test tests/cart.test.ts"

@task
  id: task-stripe-integration
  status: [!] Stripe key not configured
  feature: -> feat-checkout
  depends_on:
    - -> task-cart-api
  requires:
    - "env.STRIPE_SECRET_KEY != ''"
  verify:
    - "npm test tests/stripe.test.ts"

@rule
  id: rule-no-direct-db-write
  description: "All DB updates must pass through the repository pattern"
`,
  },
  swarm: {
    label: '🐝 Swarm & Multi-Agent Network',
    code: `!alp-version: 3.0.0

@project
  id: autonomous-swarm-cluster
  status: [~]

@agent
  id: agent-architect
  role: "Lead Systems Architect"

@agent
  id: agent-coder
  role: "Senior Fullstack Engineer"

@agent
  id: agent-qa
  role: "Automated QA & Security Audit"

@task
  id: task-spec-decomposition
  status: [x]
  owner: -> agent-architect

@task
  id: task-build-core
  status: [~]
  depends_on:
    - -> task-spec-decomposition
  owner: -> agent-coder

@task
  id: task-run-fuzzing
  status: [ ]
  depends_on:
    - -> task-build-core
  owner: -> agent-qa
`,
  },
  governance: {
    label: '🛡️ Policy & Vault Governance',
    code: `!alp-version: 3.0.0

@project
  id: secure-banking-service
  status: [~]

@policy
  id: policy-prod-deploy
  applies_to: "@agent-deployer"
  allow_paths:
    - "deploy/**"
  deny_paths:
    - "secrets/**"
  require_approval: true

@contract
  id: contract-deploy-boundary
  from: "@agent-deployer"
  to: "@agent-k8s"
  allows:
    - "deploy.k8s.*"
  denies:
    - "admin.system.*"

@timeline
  id: tl-nightly-health
  cron: "0 1 * * *"
  description: "Nightly cluster health check"
  status: [ ]

@vault
  id: vault-prod-db
  recipients:
    - "maintainer.pub"

@task
  id: task-deploy-service
  status: [?] Awaiting production approval
  policy: -> policy-prod-deploy
  contract: -> contract-deploy-boundary
  vault: -> vault-prod-db
`,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────
const statusIcon = (st: string) => {
  if (st.includes('[x]')) return '✅';
  if (st.includes('[~]')) return '🔄';
  if (st.includes('[!]')) return '🚫';
  if (st.includes('[?]')) return '🔍';
  return '⬜';
};

type TypeFilter = 'all' | string;

// ── Custom ReactFlow Node ─────────────────────────────────────────────
function AlpCustomNode({ data, selected }: NodeProps) {
  const rawStatus: string = data.status || '[ ]';
  const normalizedStatus = rawStatus.split(' ')[0];
  const getStatusClass = (st: string) => {
    switch (st) {
      case '[x]': return 'done';
      case '[~]': return 'progress';
      case '[!]': return 'blocked';
      case '[?]': return 'review';
      default: return 'todo';
    }
  };

  return (
    <div className={`alp-custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#00f0ff', width: 8, height: 8 }} />
      <div className="node-type-badge">@{data.type}</div>
      <div className="node-title">{data.id}</div>
      <div className="node-footer">
        <span className={`status-badge ${getStatusClass(rawStatus)}`}>
          {statusIcon(normalizedStatus)} {normalizedStatus.replace(/[\[\]]/g, '') || 'todo'}
        </span>
        {data.owner && <span className="node-owner">{data.owner.replace('-> ', '')}</span>}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#9d4edd', width: 8, height: 8 }} />
    </div>
  );
}

// ── Main App Component ────────────────────────────────────────────────
export default function App() {
  const [templateKey, setTemplateKey] = useState<string>('webApp');
  const [code, setCode] = useState<string>(TEMPLATES['webApp'].code);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [selectedObj, setSelectedObj] = useState<AlpObject | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logPanelCollapsed, setLogPanelCollapsed] = useState(true);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [parsedObjects, setParsedObjects] = useState<AlpObject[]>([]);

  // Register custom node types
  const nodeTypes = useMemo(() => ({ alpNode: AlpCustomNode }), []);
  const processTimerRef = useRef<number | undefined>(undefined);

  const processCode = useCallback((newCode: string) => {
    setCode(newCode);
    if (processTimerRef.current) {
      clearTimeout(processTimerRef.current);
    }
    processTimerRef.current = window.setTimeout(() => {
      const logs: string[] = [];
      try {
        const parser = new AlpParser();
        const objects = parser.parseAndValidate(newCode);
        setParsedObjects(objects);

      const graph = new AlpGraph();
      graph.buildGraph(objects);

      logs.push(`[INFO] Parsed ${objects.length} objects`);
      logs.push(`[INFO] Discovered ${graph.edges.length} edges`);

      const blockedCount = objects.filter(o => o.status && o.status.includes('[!]')).length;
      const inProgressCount = objects.filter(o => o.status && o.status.includes('[~]')).length;
      if (blockedCount > 0) logs.push(`[WARN] ${blockedCount} blocked object(s) detected`);
      if (inProgressCount > 0) logs.push(`[INFO] ${inProgressCount} in-progress item(s)`);

      const edgeList: { from: string; to: string; type: string }[] = [];
      const inDegree: Record<string, number> = {};
      const adj: Record<string, string[]> = {};

      objects.forEach((obj) => {
        inDegree[obj.id] = 0;
        adj[obj.id] = [];
      });

      graph.edges.forEach((e) => {
        edgeList.push({ from: e.source, to: e.target, type: e.type });
        if (adj[e.source]) adj[e.source].push(e.target);
        if (inDegree[e.target] !== undefined) inDegree[e.target] += 1;
      });

      const depth: Record<string, number> = {};
      const queue: string[] = [];

      Object.keys(inDegree).forEach((id) => {
        if (inDegree[id] === 0) {
          queue.push(id);
          depth[id] = 0;
        }
      });

      let processed = 0;
      while (queue.length > 0) {
        const curr = queue.shift()!;
        processed++;
        const d = depth[curr];
        (adj[curr] || []).forEach((next) => {
          depth[next] = Math.max(depth[next] || 0, d + 1);
          inDegree[next] -= 1;
          if (inDegree[next] === 0) queue.push(next);
        });
      }

      if (processed < objects.length) {
        logs.push('[ERROR] Cyclic dependency detected in graph');
        setError('Cyclic dependency detected in graph');
      } else {
        logs.push('[OK] DAG verified: no cycles detected');
        setError(null);
      }

      const columns: Record<number, AlpObject[]> = {};
      objects.forEach((obj) => {
        const d = depth[obj.id] ?? 0;
        if (!columns[d]) columns[d] = [];
        columns[d].push(obj);
      });

      const newNodes: Node[] = [];
      const colWidth = 260;
      const rowHeight = 120;

      Object.entries(columns).forEach(([colStr, colObjects]) => {
        const c = parseInt(colStr, 10);
        colObjects.forEach((obj, r) => {
          newNodes.push({
            id: obj.id,
            type: 'alpNode',
            position: { x: 50 + c * colWidth, y: 50 + r * rowHeight },
            data: {
              id: obj.id,
              type: obj._type,
              status: obj.status,
              owner: (obj as any).owner || null,
              rawObject: obj,
            },
          });
        });
      });

      const newEdges: Edge[] = edgeList.map((e, idx) => {
        let strokeColor = '#00f0ff';
        if (e.type === 'feature') strokeColor = '#9d4edd';
        if (e.type === 'owner') strokeColor = '#3b82f6';
        if (e.type === 'requires') strokeColor = '#f59e0b';

        return {
          id: `edge-${idx}`,
          source: e.from,
          target: e.to,
          label: e.type,
          type: 'smoothstep',
          animated: e.type === 'depends_on' || e.type === 'requires',
          style: { stroke: strokeColor, strokeWidth: 2 },
          labelStyle: { fill: '#8a94b0', fontSize: 10, fontFamily: 'JetBrains Mono' },
          labelBgStyle: { fill: '#131625', fillOpacity: 0.8 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          },
        };
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setError(null);
      setValidationLogs(logs);
    } catch (err: any) {
      const errMsg = err.message || 'Syntax Error in ALP specification';
      setError(errMsg);
      setValidationLogs(prev => [`[ERROR] ${errMsg}`, ...prev]);
    }
    });
  }, [setNodes, setEdges]);

  useEffect(() => {
    processCode(code);
  }, [code, processCode]);

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    if (TEMPLATES[key]) {
      setCode(TEMPLATES[key].code);
    }
  };

  const handleNodeClick = (_: any, node: Node) => {
    if (node.data && node.data.rawObject) {
      setSelectedObj(node.data.rawObject);
    }
  };

  const handleCopyBundle = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    try {
      const parser = new AlpParser();
      const objects = parser.parseAndValidate(code);
      const blob = new Blob([JSON.stringify(objects, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spec.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // no-op: export fails silently when spec is invalid
    }
  };

  // Stats calculation
  const totalTasks = nodes.filter((n) => n.data.type === 'task').length;
  const doneTasks = nodes.filter((n) => n.data.status === '[x]').length;
  const inProgressTasks = nodes.filter((n) => n.data.status === '[~]').length;
  const blockedTasks = nodes.filter((n) => n.data.status === '[!]').length;
  const reviewTasks = nodes.filter((n) => n.data.status === '[?]').length;

  // Sidebar filtered objects
  const filteredObjects = useMemo(() => {
    return parsedObjects.filter((obj) => {
      const matchesType = typeFilter === 'all' || obj._type === typeFilter;
      const matchesSearch = !searchQuery || obj.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [parsedObjects, searchQuery, typeFilter]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(parsedObjects.map(o => o._type));
    return Array.from(types).sort();
  }, [parsedObjects]);

  // Navigation helper: focus node
  const handleFocusNode = (id: string) => {
    setSelectedObj(parsedObjects.find(o => o.id === id) || null);
  };

  // Inspector fields builder
  const renderInspectorFields = (obj: AlpObject) => {
    const fields: { label: string; value: string }[] = [];
    fields.push({ label: 'Type', value: obj._type });
    fields.push({ label: 'ID', value: obj.id });
    if (obj.status) fields.push({ label: 'Status', value: obj.status });
    if (obj.description) fields.push({ label: 'Description', value: obj.description });

    Object.entries(obj).forEach(([key, value]) => {
      if (['_type', 'id', 'status', 'description'].includes(key)) return;
      if (value === undefined || value === null || value === '') return;
      const displayValue = Array.isArray(value) ? value.join('\n') : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      fields.push({ label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: displayValue });
    });

    return fields;
  };

  return (
    <div className="playground">
      {/* Navbar Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">ALP</div>
          <span className="brand-title">Execution Engine &amp; DAG Playground</span>
          <span className="brand-badge">v40.0.0</span>
        </div>

        <div className="header-controls">
          <select
            className="template-select"
            value={templateKey}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            {Object.entries(TEMPLATES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <button className="action-btn" onClick={handleCopyBundle}>
            {copied ? '✅ Copied' : '📋 Copy Bundle'}
          </button>

          <button className="action-btn" onClick={handleExportJSON} title="Export spec as JSON">
            ⬇ Export JSON
          </button>

          <button
            className={`action-btn ${!logPanelCollapsed ? 'active' : ''}`}
            onClick={() => setLogPanelCollapsed(prev => !prev)}
            title="Toggle validation log panel"
          >
            📟 Logs
          </button>

          <button
            className={`action-btn ${minimapEnabled ? 'active' : ''}`}
            onClick={() => setMinimapEnabled(prev => !prev)}
            title="Toggle graph minimap"
          >
            🗺 Minimap
          </button>

          <div className={`status-indicator ${error ? 'invalid' : 'valid'}`}>
            {error ? '❌ Invalid Spec' : '⚡ Verified DAG'}
          </div>
        </div>
      </header>

      {/* Main Workspace Split-Pane */}
      <div className="main-workspace">
        {/* Left Sidebar: Object Explorer */}
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} id="object-sidebar">
          <div className="sidebar-header">
            <h3>Explorer</h3>
            <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(prev => !prev)}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="sidebar-filters">
                <input
                  type="text"
                  placeholder="🔍 Search objects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sidebar-search"
                />
                <select
                  className="sidebar-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(t => (
                    <option key={t} value={t}>@{t}</option>
                  ))}
                </select>
              </div>

              <div className="sidebar-object-list">
                {filteredObjects.length === 0 && (
                  <div className="sidebar-empty">No objects found</div>
                )}
                {filteredObjects.map((obj) => (
                  <div
                    key={obj.id}
                    className={`sidebar-object-item ${selectedObj?.id === obj.id ? 'selected' : ''}`}
                    onClick={() => handleFocusNode(obj.id)}
                  >
                    <div className="sidebar-object-icon">{statusIcon(obj.status || '[ ]')}</div>
                    <div className="sidebar-object-info">
                      <div className="sidebar-object-id">@{obj._type} · {obj.id}</div>
                      <div className="sidebar-object-status">{obj.status || ''}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sidebar-footer">
                <span>{filteredObjects.length} object{filteredObjects.length !== 1 ? 's' : ''}</span>
              </div>
            </>
          )}
        </div>

        {/* Editor + Graph Area */}
        <div className="center-area">
          {/* Left: Code Editor */}
          <div className="editor-container">
            <div className="editor-header">
              <span>spec.alp — Autonomous LifeCycle Protocol</span>
              <span>UTF-8</span>
            </div>
            <Editor
              height="100%"
              defaultLanguage="yaml"
              theme="vs-dark"
              value={code}
              onChange={(val) => processCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono',
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                lineNumbersMinChars: 3,
              }}
            />
          </div>

          {/* Right: DAG Visualizer */}
          <div className="graph-container">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              fitView
            >
              <Background color="#1e2338" gap={20} size={1} />
              <Controls />
              {minimapEnabled && (
                <MiniMap
                  nodeStrokeColor="#00f0ff"
                  nodeColor="#1a1f35"
                  nodeBorderRadius={4}
                  maskColor="rgba(0, 0, 0, 0.6)"
                  style={{ background: '#0d1017' }}
                />
              )}
            </ReactFlow>

            {/* Node Inspector Sidebar */}
            {selectedObj && (
              <div className="inspector-panel">
                <div className="inspector-header">
                  <h3>@{selectedObj._type} Details</h3>
                  <button className="close-btn" onClick={() => setSelectedObj(null)}>
                    ✕
                  </button>
                </div>
                <div className="inspector-content">
                  {renderInspectorFields(selectedObj).map((field) => (
                    <div key={field.label} className="inspector-field">
                      <div className="field-label">{field.label}</div>
                      <div className="field-value">{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && <div className="error-toast">⚠️ {error}</div>}
          </div>
        </div>
      </div>

      {/* Validation Log Panel */}
      <div className={`log-panel ${logPanelCollapsed ? 'collapsed' : ''}`}>
        <div className="log-panel-header">
          <span className="log-panel-title">📟 Validation Logs</span>
          <button className="sidebar-toggle" onClick={() => setLogPanelCollapsed(prev => !prev)}>
            {logPanelCollapsed ? '↑' : '↓'}
          </button>
        </div>
        {!logPanelCollapsed && (
          <div className="log-panel-content">
            {validationLogs.length === 0 && (
              <div className="log-entry info">[INFO] Awaiting validation...</div>
            )}
            {validationLogs.map((log, idx) => {
              let level = 'info';
              if (log.startsWith('[ERROR]')) level = 'error';
              else if (log.startsWith('[WARN]')) level = 'warn';
              else if (log.startsWith('[OK]')) level = 'success';
              return (
                <div key={idx} className={`log-entry ${level}`}>
                  {log}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <footer className="summary-bar">
        <div className="summary-item">
          Total: <strong>{nodes.length}</strong>
        </div>
        <div className="summary-item">
          By Type: <strong>{uniqueTypes.length}</strong>
        </div>
        <div className="summary-item">
          Tasks: <strong>{totalTasks}</strong>
        </div>
        <div className="summary-item done">
          Done: <strong>{doneTasks}</strong>
        </div>
        <div className="summary-item in-progress">
          In Progress: <strong>{inProgressTasks}</strong>
        </div>
        <div className="summary-item blocked">
          Blocked: <strong>{blockedTasks}</strong>
        </div>
        <div className="summary-item review">
          Review: <strong>{reviewTasks}</strong>
        </div>
        <div className="summary-item edges-count">
          Edges: <strong>{edges.length}</strong>
        </div>
      </footer>
    </div>
  );
}



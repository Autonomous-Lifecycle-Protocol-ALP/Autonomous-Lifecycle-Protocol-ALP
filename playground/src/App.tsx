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
    label: 'Web App Lifecycle',
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
    label: 'Swarm & Multi-Agent Network',
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
    label: 'Policy & Vault Governance',
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
  eventMesh: {
    label: 'Event Mesh & CRDT State',
    code: `!alp-version: 3.0.0

@project
  id: real-time-crdt-sync
  status: [~]

@agent
  id: agent-node-alpha
  role: "P2P State Synchronizer Alpha"

@agent
  id: agent-node-beta
  role: "P2P State Synchronizer Beta"

@task
  id: task-init-crdt-canvas
  status: [x]
  owner: -> agent-node-alpha

@task
  id: task-broadcast-delta
  status: [~]
  depends_on:
    - -> task-init-crdt-canvas
  owner: -> agent-node-beta

@task
  id: task-reconcile-conflicts
  status: [ ]
  depends_on:
    - -> task-broadcast-delta
  owner: -> agent-node-alpha
`,
  },
  zkProof: {
    label: 'ZK-Proof & Formal Verification',
    code: `!alp-version: 3.0.0

@project
  id: zero-knowledge-verifier
  status: [~]

@task
  id: task-compile-circom-circuit
  status: [x]
  verify:
    - "npx circom circuit.circom --r1cs --wasm"

@task
  id: task-generate-witness
  status: [x]
  depends_on:
    - -> task-compile-circom-circuit
  verify:
    - "node generate_witness.js"

@task
  id: task-prove-zk-snark
  status: [~]
  depends_on:
    - -> task-generate-witness
  verify:
    - "npx snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json"

@task
  id: task-verify-on-chain
  status: [ ]
  depends_on:
    - -> task-prove-zk-snark
  verify:
    - "npx hardhat test test/verifier.test.ts"
`,
  },
};

// ── Directive Snippets ─────────────────────────────────────────────────
const SNIPPETS: Record<string, string> = {
  task: `\n@task\n  id: task-new-feature\n  status: [ ]\n  description: "Implement new service component"\n  verify:\n    - "npm test"\n`,
  agent: `\n@agent\n  id: agent-specialist\n  role: "Automated Domain Specialist"\n`,
  policy: `\n@policy\n  id: policy-security-guard\n  applies_to: "@agent-coder"\n  allow_paths:\n    - "src/**"\n  deny_paths:\n    - "config/keys/**"\n`,
  contract: `\n@contract\n  id: contract-service-boundary\n  from: "@agent-frontend"\n  to: "@agent-backend"\n  allows:\n    - "api.v1.*"\n`,
  vault: `\n@vault\n  id: vault-credentials\n  recipients:\n    - "devops.pub"\n`,
  rule: `\n@rule\n  id: rule-clean-architecture\n  description: "Do not import infrastructure logic directly into core entities"\n`,
  timeline: `\n@timeline\n  id: tl-scheduled-backup\n  cron: "0 0 * * *"\n  description: "Daily automated snapshot"\n  status: [ ]\n`,
};

// ── Helpers ────────────────────────────────────────────────────────────
const statusIcon = (st: string) => {
  if (st.includes('[x]')) return '[DONE]';
  if (st.includes('[~]')) return '[RUN]';
  if (st.includes('[!]')) return '[WARN]';
  if (st.includes('[?]')) return '[WAIT]';
  return '[TODO]';
};

type TypeFilter = 'all' | string;
type LayoutMode = 'dag' | 'tree' | 'grid';

const TYPE_META: Record<string, { color: string; icon: string; bg: string }> = {
  task: { color: '#00f0ff', icon: 'TSK', bg: 'rgba(0, 240, 255, 0.08)' },
  agent: { color: '#a855f7', icon: 'AGT', bg: 'rgba(168, 85, 247, 0.08)' },
  policy: { color: '#10b981', icon: 'PLC', bg: 'rgba(16, 185, 129, 0.08)' },
  contract: { color: '#f59e0b', icon: 'CTR', bg: 'rgba(245, 158, 11, 0.08)' },
  vault: { color: '#f43f5e', icon: 'VLT', bg: 'rgba(244, 63, 94, 0.08)' },
  rule: { color: '#3b82f6', icon: 'RUL', bg: 'rgba(59, 130, 246, 0.08)' },
  timeline: { color: '#6366f1', icon: 'TML', bg: 'rgba(99, 102, 241, 0.08)' },
  project: { color: '#ec4899', icon: 'PRJ', bg: 'rgba(236, 72, 153, 0.08)' },
};

// ── Custom ReactFlow Node ─────────────────────────────────────────────
function AlpCustomNode({ data, selected }: NodeProps) {
  const rawStatus: string = data.simStatus || data.status || '[ ]';
  const normalizedStatus = rawStatus.split(' ')[0];
  const isSimulating = Boolean(data.isSimulating);
  const isExecutingCurrent = Boolean(data.isExecutingCurrent);
  const meta = TYPE_META[data.type] || { color: '#94a3b8', icon: 'OBJ', bg: 'rgba(148, 163, 184, 0.08)' };

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
    <div
      className={`alp-custom-node ${selected ? 'selected' : ''} ${
        isExecutingCurrent ? 'node-executing-active' : ''
      } ${data.isHighlightConnected ? 'node-highlight-connected' : ''}`}
      style={{ borderLeft: `4px solid ${meta.color}` }}
    >
      <Handle type="target" position={Position.Left} style={{ background: meta.color, width: 8, height: 8 }} />
      <div className="node-header">
        <span className="node-type-icon">{meta.icon}</span>
        <span className="node-type-badge" style={{ color: meta.color }}>@{data.type}</span>
      </div>
      <div className="node-title">{data.id}</div>
      <div className="node-footer">
        <span className={`status-badge ${getStatusClass(normalizedStatus)}`}>
          {statusIcon(normalizedStatus)} {normalizedStatus.replace(/[\[\]]/g, '') || 'todo'}
        </span>
        {data.owner && <span className="node-owner">{data.owner.replace('-> ', '')}</span>}
      </div>
      {isSimulating && (
        <div className="sim-pulse-dot" style={{ background: meta.color }} title="Active simulation state" />
      )}
      <Handle type="source" position={Position.Right} style={{ background: meta.color, width: 8, height: 8 }} />
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'progress' | 'blocked' | 'todo'>('all');
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dag');
  const [parsedObjects, setParsedObjects] = useState<AlpObject[]>([]);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('alp-theme') as 'dark' | 'light') || 'dark';
    } catch { return 'dark'; }
  });
  const [showKbdHelp, setShowKbdHelp] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [simNodeStates, setSimNodeStates] = useState<Record<string, string>>({});
  const [simOrder, setSimOrder] = useState<string[]>([]);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const nodeTypes = useMemo(() => ({ alpNode: AlpCustomNode }), []);
  const processTimerRef = useRef<number | undefined>(undefined);
  const simTimerRef = useRef<number | undefined>(undefined);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('alp-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Parse and Layout Engine
  const processCode = useCallback((newCode: string, currentLayout: LayoutMode = layoutMode) => {
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

        const blockedCount = objects.filter((o) => o.status && o.status.includes('[!]')).length;
        const inProgressCount = objects.filter((o) => o.status && o.status.includes('[~]')).length;

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
        const topoOrder: string[] = [];

        Object.keys(inDegree).forEach((id) => {
          if (inDegree[id] === 0) {
            queue.push(id);
            depth[id] = 0;
          }
        });

        let processed = 0;
        while (queue.length > 0) {
          const curr = queue.shift()!;
          topoOrder.push(curr);
          processed++;
          const d = depth[curr];
          (adj[curr] || []).forEach((next) => {
            depth[next] = Math.max(depth[next] || 0, d + 1);
            inDegree[next] -= 1;
            if (inDegree[next] === 0) queue.push(next);
          });
        }

        setSimOrder(topoOrder);

        if (processed < objects.length) {
          logs.push('[ERROR] Cyclic dependency detected in graph');
          setError('Cyclic dependency detected in graph');
        } else {
          logs.push('[OK] DAG verified: no cycles detected');
          setError(null);
        }

        // Calculate positions based on chosen Layout
        const newNodes: Node[] = [];

        if (currentLayout === 'tree') {
          const depthRows: Record<number, AlpObject[]> = {};
          objects.forEach((obj) => {
            const d = depth[obj.id] ?? 0;
            if (!depthRows[d]) depthRows[d] = [];
            depthRows[d].push(obj);
          });

          Object.entries(depthRows).forEach(([dStr, rowObjs]) => {
            const row = parseInt(dStr, 10);
            const rowWidth = rowObjs.length * 240;
            const startX = 400 - rowWidth / 2;
            rowObjs.forEach((obj, idx) => {
              newNodes.push({
                id: obj.id,
                type: 'alpNode',
                position: { x: startX + idx * 240, y: 50 + row * 160 },
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
        } else if (currentLayout === 'grid') {
          const cols = Math.ceil(Math.sqrt(objects.length));
          objects.forEach((obj, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            newNodes.push({
              id: obj.id,
              type: 'alpNode',
              position: { x: 50 + c * 250, y: 50 + r * 140 },
              data: {
                id: obj.id,
                type: obj._type,
                status: obj.status,
                owner: (obj as any).owner || null,
                rawObject: obj,
              },
            });
          });
        } else {
          // Default: Topological DAG columns
          const columns: Record<number, AlpObject[]> = {};
          objects.forEach((obj) => {
            const d = depth[obj.id] ?? 0;
            if (!columns[d]) columns[d] = [];
            columns[d].push(obj);
          });

          const colWidth = 270;
          const rowHeight = 130;

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
        }

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
        setValidationLogs((prev) => [`[ERROR] ${errMsg}`, ...prev]);
      }
    });
  }, [layoutMode, setNodes, setEdges]);

  useEffect(() => {
    processCode(code, layoutMode);
  }, [code, layoutMode, processCode]);

  // Simulation Controls & Loop
  const handleStartSim = () => {
    const initialStates: Record<string, string> = {};
    parsedObjects.forEach((o) => {
      initialStates[o.id] = '[ ]';
    });
    setSimNodeStates(initialStates);
    setSimStepIndex(0);
    setIsSimulating(true);
    setSimLogs(['Swarm Simulation Started', `[TOPOLOGY] ${simOrder.join(' -> ')}`]);
  };

  const handleStepSim = useCallback(() => {
    if (simStepIndex >= simOrder.length) {
      setIsSimulating(false);
      setSimLogs((prev) => ['Simulation Complete: All tasks resolved', ...prev]);
      return;
    }

    const currentId = simOrder[simStepIndex];
    const currentObj = parsedObjects.find((o) => o.id === currentId);

    setSimNodeStates((prev) => {
      const next = { ...prev };
      if (currentObj?.status?.includes('[!]')) {
        next[currentId] = '[!]';
      } else {
        next[currentId] = '[x]';
      }
      return next;
    });

    const statusMsg = currentObj?.status?.includes('[!]')
      ? `Blocked execution: ${currentId}`
      : `Executed ${currentId} via top-sorted step ${simStepIndex + 1}/${simOrder.length}`;

    setSimLogs((prev) => [statusMsg, ...prev]);
    setSimStepIndex((prev) => prev + 1);
  }, [simStepIndex, simOrder, parsedObjects]);

  useEffect(() => {
    if (isSimulating) {
      const intervalMs = Math.max(200, 1200 / simSpeed);
      simTimerRef.current = window.setTimeout(() => {
        handleStepSim();
      }, intervalMs);
    }
    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    };
  }, [isSimulating, simStepIndex, simSpeed, handleStepSim]);

  const handleResetSim = () => {
    setIsSimulating(false);
    setSimStepIndex(0);
    setSimNodeStates({});
    setSimLogs([]);
  };

  const handleApplySimToCode = () => {
    let updatedCode = code;
    Object.entries(simNodeStates).forEach(([id, st]) => {
      const regex = new RegExp(`(id:\\s*${id}[\\s\\S]*?status:\\s*)\\[[^\\]]*\\]`, 'g');
      updatedCode = updatedCode.replace(regex, `$1${st}`);
    });
    setCode(updatedCode);
    setSimLogs((prev) => ['Applied simulation status updates to ALP spec', ...prev]);
  };

  // Sync Node data with simulation states
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        const simSt = simNodeStates[n.id];
        const isCurrent = simOrder[simStepIndex - 1] === n.id;
        const isSelected = selectedObj?.id === n.id;

        return {
          ...n,
          data: {
            ...n.data,
            simStatus: simSt,
            isSimulating: simSt !== undefined,
            isExecutingCurrent: isCurrent,
            isHighlightConnected: isSelected,
          },
        };
      })
    );
  }, [simNodeStates, simStepIndex, simOrder, selectedObj, setNodes]);

  // UI Handlers
  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    if (TEMPLATES[key]) {
      handleResetSim();
      setCode(TEMPLATES[key].code);
    }
  };

  const handleInsertSnippet = (snippetKey: string) => {
    if (SNIPPETS[snippetKey]) {
      const updated = code + SNIPPETS[snippetKey];
      setCode(updated);
    }
  };

  const handleNodeClick = (_: any, node: Node) => {
    if (node.data && node.data.rawObject) {
      setSelectedObj(node.data.rawObject);
    }
  };

  const handleCopyBundle = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleExportJSON = useCallback(() => {
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
      // ignore
    }
  }, [code]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') {
        e.preventDefault();
        handleCopyBundle();
      } else if (ctrl && e.key === 'e') {
        e.preventDefault();
        handleExportJSON();
      } else if (ctrl && e.key === '/') {
        e.preventDefault();
        setShowKbdHelp((p) => !p);
      } else if (ctrl && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((p) => !p);
      } else if (ctrl && e.key === 'l') {
        e.preventDefault();
        setLogPanelCollapsed((p) => !p);
      } else if (e.key === 'Escape') {
        setShowKbdHelp(false);
        setSelectedObj(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCopyBundle, handleExportJSON]);

  // Stats calculation
  const totalTasks = nodes.filter((n) => n.data.type === 'task').length;
  const doneTasks = nodes.filter((n) => (n.data.simStatus || n.data.status || '').includes('[x]')).length;
  const inProgressTasks = nodes.filter((n) => (n.data.simStatus || n.data.status || '').includes('[~]')).length;
  const blockedTasks = nodes.filter((n) => (n.data.simStatus || n.data.status || '').includes('[!]')).length;
  const reviewTasks = nodes.filter((n) => (n.data.simStatus || n.data.status || '').includes('[?]')).length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 100;

  const filteredObjects = useMemo(() => {
    return parsedObjects.filter((obj) => {
      const matchesType = typeFilter === 'all' || obj._type === typeFilter;
      const matchesSearch = !searchQuery || obj.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const st = simNodeStates[obj.id] || obj.status || '[ ]';
      let matchesStatus = true;
      if (statusFilter === 'done') matchesStatus = st.includes('[x]');
      else if (statusFilter === 'progress') matchesStatus = st.includes('[~]');
      else if (statusFilter === 'blocked') matchesStatus = st.includes('[!]');
      else if (statusFilter === 'todo') matchesStatus = !st.includes('[x]') && !st.includes('[~]') && !st.includes('[!]');

      return matchesType && matchesSearch && matchesStatus;
    });
  }, [parsedObjects, searchQuery, typeFilter, statusFilter, simNodeStates]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(parsedObjects.map((o) => o._type));
    return Array.from(types).sort();
  }, [parsedObjects]);

  const handleFocusNode = (id: string) => {
    setSelectedObj(parsedObjects.find((o) => o.id === id) || null);
  };

  const renderInspectorFields = (obj: AlpObject) => {
    const fields: { label: string; value: string }[] = [];
    fields.push({ label: 'Type', value: obj._type });
    fields.push({ label: 'ID', value: obj.id });
    if (obj.status) fields.push({ label: 'Status', value: simNodeStates[obj.id] || obj.status });
    if (obj.description) fields.push({ label: 'Description', value: obj.description });

    Object.entries(obj).forEach(([key, value]) => {
      if (['_type', 'id', 'status', 'description'].includes(key)) return;
      if (value === undefined || value === null || value === '') return;
      const displayValue =
        Array.isArray(value)
          ? value.join('\n')
          : typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : String(value);
      fields.push({ label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), value: displayValue });
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
          <span className="brand-badge">v80.0.0</span>
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

          {/* Layout Mode Selector */}
          <div className="layout-switcher">
            <button
              className={`layout-btn ${layoutMode === 'dag' ? 'active' : ''}`}
              onClick={() => setLayoutMode('dag')}
              title="Topological DAG Columns"
            >
              DAG
            </button>
            <button
              className={`layout-btn ${layoutMode === 'tree' ? 'active' : ''}`}
              onClick={() => setLayoutMode('tree')}
              title="Hierarchical Tree"
            >
              Tree
            </button>
            <button
              className={`layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
              onClick={() => setLayoutMode('grid')}
              title="Grid Matrix"
            >
              Grid
            </button>
          </div>

          <button className="action-btn" onClick={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 400 })} title="Fit graph view">
            Fit View
          </button>

          <button className="action-btn" onClick={handleCopyBundle} title="Copy bundle (Ctrl+S)">
            {copied ? 'Copied' : 'Copy Bundle'} <span className="kbd-hint">Ctrl+S</span>
          </button>

          <button className="action-btn" onClick={handleExportJSON} title="Export spec as JSON (Ctrl+E)">
            Export JSON <span className="kbd-hint">Ctrl+E</span>
          </button>

          <button
            className={`action-btn ${!logPanelCollapsed ? 'active' : ''}`}
            onClick={() => setLogPanelCollapsed((prev) => !prev)}
            title="Toggle validation log panel (Ctrl+L)"
          >
            Logs <span className="kbd-hint">Ctrl+L</span>
          </button>

          <button
            className={`action-btn ${minimapEnabled ? 'active' : ''}`}
            onClick={() => setMinimapEnabled((prev) => !prev)}
            title="Toggle graph minimap"
          >
            Minimap
          </button>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? 'Lt' : 'Dk'}
          </button>

          <button
            className="action-btn"
            onClick={() => setShowKbdHelp((p) => !p)}
            title="Keyboard shortcuts (Ctrl+/)"
          >
            Keys <span className="kbd-hint">Ctrl+/</span>
          </button>

          <div className="telemetry-badge" title="Live task completion metric">
            <div className="telemetry-ring" />
            <span>{completionRate}% Complete</span>
          </div>

          <div className={`status-indicator ${error ? 'invalid' : 'valid'}`}>
            {error ? 'Invalid Spec' : 'Verified DAG'}
          </div>
        </div>
      </header>

      {/* Simulation Control Toolbar */}
      <div className="sim-bar">
        <div className="sim-controls">
          {!isSimulating ? (
            <button className="sim-btn play" onClick={handleStartSim} title="Start Swarm Simulation">
              Run Swarm Sim
            </button>
          ) : (
            <button className="sim-btn pause" onClick={() => setIsSimulating(false)} title="Pause Simulation">
              Pause Sim
            </button>
          )}

          <button
            className="sim-btn step"
            onClick={handleStepSim}
            disabled={simStepIndex >= simOrder.length}
            title="Step Forward Topologically"
          >
            Step
          </button>

          <button className="sim-btn reset" onClick={handleResetSim} title="Reset Simulation">
            Reset
          </button>

          <select
            className="sim-speed-select"
            value={simSpeed}
            onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
          >
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1.0x Speed</option>
            <option value={2}>2.0x Speed</option>
            <option value={5}>5.0x Speed</option>
          </select>

          {Object.keys(simNodeStates).length > 0 && (
            <button className="sim-btn apply" onClick={handleApplySimToCode} title="Sync status changes to Monaco editor">
              Apply Sim to Spec
            </button>
          )}
        </div>

        <div className="sim-progress">
          <span>Step {simStepIndex} / {simOrder.length}</span>
          <div className="sim-progress-track">
            <div
              className="sim-progress-fill"
              style={{ width: `${simOrder.length > 0 ? (simStepIndex / simOrder.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Workspace Split-Pane */}
      <div className="main-workspace">
        {/* Left Sidebar: Object Explorer */}
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} id="object-sidebar">
          <div className="sidebar-header">
            <h3>Explorer</h3>
            <button className="sidebar-toggle" onClick={() => setSidebarCollapsed((prev) => !prev)}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="sidebar-filters">
                <input
                  type="text"
                  placeholder="Search objects..."
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
                  {uniqueTypes.map((t) => (
                    <option key={t} value={t}>
                      @{t}
                    </option>
                  ))}
                </select>
                <div className="sidebar-status-filter">
                  <button
                    className={`status-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`status-filter-chip ${statusFilter === 'done' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('done')}
                  >
                    Done
                  </button>
                  <button
                    className={`status-filter-chip ${statusFilter === 'progress' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('progress')}
                  >
                    In-Progress
                  </button>
                  <button
                    className={`status-filter-chip ${statusFilter === 'blocked' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('blocked')}
                  >
                    Blocked
                  </button>
                  <button
                    className={`status-filter-chip ${statusFilter === 'todo' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('todo')}
                  >
                    Todo
                  </button>
                </div>
              </div>

              <div className="sidebar-object-list">
                {filteredObjects.length === 0 && <div className="sidebar-empty">No objects found</div>}
                {filteredObjects.map((obj) => (
                  <div
                    key={obj.id}
                    className={`sidebar-object-item ${selectedObj?.id === obj.id ? 'selected' : ''}`}
                    onClick={() => handleFocusNode(obj.id)}
                  >
                    <div className="sidebar-object-icon">
                      {statusIcon(simNodeStates[obj.id] || obj.status || '[ ]')}
                    </div>
                    <div className="sidebar-object-info">
                      <div className="sidebar-object-id">
                        @{obj._type} · {obj.id}
                      </div>
                      <div className="sidebar-object-status">
                        {simNodeStates[obj.id] || obj.status || ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sidebar-footer">
                <span>
                  {filteredObjects.length} object{filteredObjects.length !== 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Editor + Graph Area */}
        <div className="center-area">
          {/* Left: Code Editor with Directive Palette */}
          <div className="editor-container">
            <div className="editor-header">
              <span>spec.alp — Autonomous LifeCycle Protocol</span>
              <span>UTF-8</span>
            </div>

            {/* Directive Snippet Bar */}
            <div className="snippet-bar">
              <span className="snippet-label">Insert:</span>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('task')}>+ @task</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('agent')}>+ @agent</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('policy')}>+ @policy</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('contract')}>+ @contract</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('vault')}>+ @vault</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('rule')}>+ @rule</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('timeline')}>+ @timeline</button>
            </div>

            <Editor
              height="100%"
              defaultLanguage="yaml"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={code}
              onChange={(val) => processCode(val || '', layoutMode)}
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
              onInit={setReactFlowInstance}
              fitView
            >
              <Background color={theme === 'dark' ? '#1e2338' : '#cbd5e1'} gap={20} size={1} />
              <Controls />
              {minimapEnabled && (
                <MiniMap
                  nodeStrokeColor={theme === 'dark' ? '#00f0ff' : '#0891b2'}
                  nodeColor={theme === 'dark' ? '#1a1f35' : '#e2e8f0'}
                  nodeBorderRadius={4}
                  maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'}
                  style={{ background: theme === 'dark' ? '#0d1017' : '#f8fafc' }}
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
            {error && <div className="error-toast">{error}</div>}
          </div>
        </div>
      </div>

      {/* Validation Log Panel */}
      <div className={`log-panel ${logPanelCollapsed ? 'collapsed' : ''}`}>
        <div className="log-panel-header">
          <span className="log-panel-title">Validation &amp; Simulation Logs</span>
          <button className="sidebar-toggle" onClick={() => setLogPanelCollapsed((prev) => !prev)}>
            {logPanelCollapsed ? '↑' : '↓'}
          </button>
        </div>
        {!logPanelCollapsed && (
          <div className="log-panel-content">
            {simLogs.map((simLog, idx) => (
              <div key={`sim-${idx}`} className="log-entry sim">
                {simLog}
              </div>
            ))}
            {validationLogs.length === 0 && <div className="log-entry info">[INFO] Awaiting validation...</div>}
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

      {/* Keyboard Shortcuts Help Toast */}
      {showKbdHelp && (
        <div className="kbd-toast">
          <div className="kbd-grid">
            <kbd>Ctrl+S</kbd> <span>Copy ALP Spec</span>
            <kbd>Ctrl+E</kbd> <span>Export as JSON</span>
            <kbd>Ctrl+B</kbd> <span>Toggle Sidebar</span>
            <kbd>Ctrl+L</kbd> <span>Toggle Log Panel</span>
            <kbd>Ctrl+/</kbd> <span>Show/Hide Shortcuts</span>
            <kbd>Esc</kbd> <span>Close Panels</span>
          </div>
        </div>
      )}
    </div>
  );
}

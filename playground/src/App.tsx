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
import { AlpParser, AlpGraph, AlpFormatter } from '@autonomous-lifecycle-protocol-alp/parser';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { SynapseModal } from './components/SynapseModal.js';
import { MultiModalModal } from './components/MultiModalModal.js';
import {
  FiPlay,
  FiPause,
  FiSkipForward,
  FiSkipBack,
  FiRotateCcw,
  FiCopy,
  FiDownload,
  FiCheck,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiClock,
  FiHelpCircle,
  FiSun,
  FiMoon,
  FiMaximize2,
  FiLayers,
  FiGrid,
  FiTerminal,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiCode,
  FiFileText,
  FiZap,
  FiSliders,
  FiKey,
  FiPlus,
  FiShare2,
  FiEdit2,
  FiTrash2,
  FiBookmark,
  FiTrendingUp,
  FiActivity,
} from 'react-icons/fi';
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
  dataPipeline: {
    label: 'Autonomous Data Pipeline ETL',
    code: `!alp-version: 3.0.0

@project
  id: alp-analytics-etl
  status: [~]
  description: "Distributed telemetry ETL and analytics ingestion"

@agent
  id: agent-data-engineer
  role: "Data Pipeline Orchestrator"

@workflow
  id: wf-daily-aggregation
  schedule: "0 2 * * *"
  status: [~]

@task
  id: task-extract-logs
  status: [x]
  owner: -> agent-data-engineer
  verify:
    - "python -m etl.extract --source=s3"

@task
  id: task-transform-parquet
  status: [~]
  depends_on:
    - -> task-extract-logs
  owner: -> agent-data-engineer
  verify:
    - "python -m etl.transform --format=parquet"

@task
  id: task-load-clickhouse
  status: [ ]
  depends_on:
    - -> task-transform-parquet
  owner: -> agent-data-engineer
  verify:
    - "python -m etl.load --target=clickhouse"
`,
  },
  bftConsensus: {
    label: 'BFT Consensus & Settlement Mesh',
    code: `!alp-version: 3.0.0

@project
  id: bft-governed-ledger
  status: [~]

@swarm
  id: swarm-validator-ring
  topology: mesh
  consensus: pbft
  threshold: 0.67

@agent
  id: agent-validator-01
  role: "BFT Consensus Validator 1"

@agent
  id: agent-validator-02
  role: "BFT Consensus Validator 2"

@task
  id: task-propose-block
  status: [x]
  owner: -> agent-validator-01

@task
  id: task-gather-signatures
  status: [~]
  depends_on:
    - -> task-propose-block
  owner: -> agent-validator-02

@task
  id: task-settle-epoch
  status: [ ]
  depends_on:
    - -> task-gather-signatures
`,
  },
  aiCopilot: {
    label: 'Multi-Agent Reasoning & Copilot',
    code: `!alp-version: 3.0.0

@project
  id: intelligent-code-copilot
  status: [~]

@agent
  id: agent-reasoner
  role: "Chain-of-Thought Reasoning Model"

@agent
  id: agent-executor
  role: "Sandboxed Code Execution Engine"

@memory
  id: mem-project-context
  type: semantic-vector
  scope: workspace

@task
  id: task-analyze-codebase
  status: [x]
  owner: -> agent-reasoner

@task
  id: task-synthesize-patch
  status: [~]
  depends_on:
    - -> task-analyze-codebase
  owner: -> agent-reasoner

@task
  id: task-sandbox-eval
  status: [ ]
  depends_on:
    - -> task-synthesize-patch
  owner: -> agent-executor
  verify:
    - "npm test --run"
`,
  },
  multimodal: {
    label: 'Multi-Modal & VLA Action Space',
    code: `!alp-version: 3.0.0

@project
  id: multimodal-vision-vla
  status: [~]
  description: "Vision-Language-Action Protocol & Sensor Stream Engine"

@agent
  id: agent-vla-controller
  role: "Embodied Vision-Language-Action Agent"

@multimodal
  id: mm-vision-pipeline
  modalities:
    - vision
    - text
    - sensor
  resolution: "1920x1080"
  fps: 30
  embedding_dim: 768
  assets:
    - id: asset-ui-screenshot
      type: image
      uri: "file://assets/screenshots/ui-main.png"
      format: png
    - id: asset-live-cam
      type: video
      uri: "rtsp://camera.local/live"
      format: h264

@vision_model
  id: model-siglip-base
  backbone: siglip
  context_tokens: 4096
  embedding_dim: 768
  latency_p95_ms: 45

@action_space
  id: act-browser-nav
  agent: agent-vla-controller
  domain: browser
  max_concurrency: 4
  actions:
    - name: click_element
      type: digital
      safety_level: low
    - name: submit_transaction
      type: api
      safety_level: critical
      requires_confirmation: true

@task
  id: task-capture-multimodal-frame
  status: [x]
  owner: -> agent-vla-controller

@task
  id: task-vla-action-dispatch
  status: [~]
  depends_on:
    - -> task-capture-multimodal-frame
  owner: -> agent-vla-controller
`,
  },
};

// ── Directive Snippets ─────────────────────────────────────────────────
const SNIPPETS: Record<string, string> = {
  task: `\n@task\n  id: task-new-feature\n  status: [ ]\n  description: "Implement new service component"\n  verify:\n    - "npm test"\n`,
  agent: `\n@agent\n  id: agent-specialist\n  role: "Automated Domain Specialist"\n`,
  feature: `\n@feature\n  id: feat-new-capability\n  status: [ ]\n  description: "Feature specification & requirements"\n`,
  workflow: `\n@workflow\n  id: wf-pipeline-flow\n  schedule: "0 0 * * *"\n  status: [ ]\n`,
  policy: `\n@policy\n  id: policy-security-guard\n  applies_to: "@agent-coder"\n  allow_paths:\n    - "src/**"\n  deny_paths:\n    - "config/keys/**"\n`,
  contract: `\n@contract\n  id: contract-service-boundary\n  from: "@agent-frontend"\n  to: "@agent-backend"\n  allows:\n    - "api.v1.*"\n`,
  vault: `\n@vault\n  id: vault-credentials\n  recipients:\n    - "devops.pub"\n`,
  rule: `\n@rule\n  id: rule-clean-architecture\n  description: "Do not import infrastructure logic directly into core entities"\n`,
  timeline: `\n@timeline\n  id: tl-scheduled-backup\n  cron: "0 0 * * *"\n  description: "Daily automated snapshot"\n  status: [ ]\n`,
  memory: `\n@memory\n  id: mem-knowledge-base\n  type: semantic-vector\n  scope: workspace\n`,
  swarm: `\n@swarm\n  id: swarm-federation\n  topology: mesh\n  consensus: pbft\n`,
  tenant: `\n@tenant\n  id: tenant-enterprise\n  tier: premium\n`,
  multimodal: `\n@multimodal\n  id: mm-stream-001\n  modalities:\n    - vision\n    - sensor\n  resolution: "1920x1080"\n  fps: 30\n`,
  vision_model: `\n@vision_model\n  id: model-clip-vit\n  backbone: clip\n  context_tokens: 4096\n`,
  action_space: `\n@action_space\n  id: act-space-001\n  domain: browser\n  actions:\n    - name: click\n      safety_level: low\n`,
};

// ── Helpers ────────────────────────────────────────────────────────────
const renderStatusBadge = (st: string) => {
  const normalized = st.split(' ')[0];
  if (normalized === '[x]') {
    return (
      <span className="status-badge done">
        <FiCheckCircle size={11} /> done
      </span>
    );
  }
  if (normalized === '[~]') {
    return (
      <span className="status-badge progress">
        <FiClock size={11} /> progress
      </span>
    );
  }
  if (normalized === '[!]') {
    return (
      <span className="status-badge blocked">
        <FiAlertTriangle size={11} /> blocked
      </span>
    );
  }
  if (normalized === '[?]') {
    return (
      <span className="status-badge review">
        <FiHelpCircle size={11} /> review
      </span>
    );
  }
  return (
    <span className="status-badge todo">
      <FiClock size={11} /> todo
    </span>
  );
};

type TypeFilter = 'all' | string;
type LayoutMode = 'dag' | 'tree' | 'grid';

interface Snapshot {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

const TYPE_META: Record<string, { color: string; icon: string; bg: string }> = {
  task: { color: '#00f0ff', icon: 'TSK', bg: 'rgba(0, 240, 255, 0.08)' },
  agent: { color: '#a855f7', icon: 'AGT', bg: 'rgba(168, 85, 247, 0.08)' },
  feature: { color: '#38bdf8', icon: 'FET', bg: 'rgba(56, 189, 248, 0.08)' },
  workflow: { color: '#fb923c', icon: 'WFL', bg: 'rgba(251, 146, 60, 0.08)' },
  policy: { color: '#10b981', icon: 'PLC', bg: 'rgba(16, 185, 129, 0.08)' },
  contract: { color: '#f59e0b', icon: 'CTR', bg: 'rgba(245, 158, 11, 0.08)' },
  vault: { color: '#f43f5e', icon: 'VLT', bg: 'rgba(244, 63, 94, 0.08)' },
  rule: { color: '#3b82f6', icon: 'RUL', bg: 'rgba(59, 130, 246, 0.08)' },
  timeline: { color: '#6366f1', icon: 'TML', bg: 'rgba(99, 102, 241, 0.08)' },
  memory: { color: '#ec4899', icon: 'MEM', bg: 'rgba(236, 72, 153, 0.08)' },
  swarm: { color: '#14b8a6', icon: 'SWM', bg: 'rgba(20, 184, 166, 0.08)' },
  tenant: { color: '#8b5cf6', icon: 'TNT', bg: 'rgba(139, 92, 246, 0.08)' },
  project: { color: '#ec4899', icon: 'PRJ', bg: 'rgba(236, 72, 153, 0.08)' },
  multimodal: { color: '#06b6d4', icon: 'MMD', bg: 'rgba(6, 182, 212, 0.08)' },
  vision_model: { color: '#8b5cf6', icon: 'VIS', bg: 'rgba(139, 92, 246, 0.08)' },
  action_space: { color: '#f43f5e', icon: 'ACT', bg: 'rgba(244, 63, 94, 0.08)' },
};

// ── Custom ReactFlow Node ─────────────────────────────────────────────
function AlpCustomNode({ data, selected }: NodeProps) {
  const rawStatus: string = data.simStatus || data.status || '[ ]';
  const isSimulating = Boolean(data.isSimulating);
  const isExecutingCurrent = Boolean(data.isExecutingCurrent);
  const isCriticalPath = Boolean(data.isCriticalPath);
  const meta = TYPE_META[data.type] || { color: '#94a3b8', icon: 'OBJ', bg: 'rgba(148, 163, 184, 0.08)' };

  return (
    <div
      className={`alp-custom-node ${selected ? 'selected' : ''} ${
        isExecutingCurrent ? 'node-executing-active' : ''
      } ${data.isHighlightConnected ? 'node-highlight-connected' : ''} ${
        isCriticalPath ? 'critical-path' : ''
      }`}
      style={{ borderLeft: `4px solid ${isCriticalPath ? '#f59e0b' : meta.color}` }}
    >
      <Handle type="target" position={Position.Left} style={{ background: isCriticalPath ? '#f59e0b' : meta.color, width: 8, height: 8 }} />
      <div className="node-header">
        <span className="node-type-icon">{meta.icon}</span>
        <span className="node-type-badge" style={{ color: meta.color }}>@{data.type}</span>
        {isCriticalPath && <span className="critical-path-chip">CP</span>}
      </div>
      <div className="node-title">{data.id}</div>
      <div className="node-footer">
        {renderStatusBadge(rawStatus)}
        {data.owner && <span className="node-owner">{data.owner.replace('-> ', '')}</span>}
      </div>
      {isSimulating && (
        <div className="sim-pulse-dot" style={{ background: isCriticalPath ? '#f59e0b' : meta.color }} title="Active simulation state" />
      )}
      <Handle type="source" position={Position.Right} style={{ background: isCriticalPath ? '#f59e0b' : meta.color, width: 8, height: 8 }} />
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logPanelCollapsed, setLogPanelCollapsed] = useState(true);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'progress' | 'blocked' | 'todo'>('all');
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dag');
  const [parsedObjects, setParsedObjects] = useState<AlpObject[]>([]);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSnapshotsModal, setShowSnapshotsModal] = useState(false);
  const [showTopologyHud, setShowTopologyHud] = useState(false);
  const [showSynapseModal, setShowSynapseModal] = useState(false);
  const [showMultiModalModal, setShowMultiModalModal] = useState(false);
  const [showKbdHelp, setShowKbdHelp] = useState(false);
  const [isEditingInspector, setIsEditingInspector] = useState(false);
  const [inspectorEditFields, setInspectorEditFields] = useState<Record<string, string>>({});

  // New Block Form State
  const [newBlockType, setNewBlockType] = useState('task');
  const [newBlockId, setNewBlockId] = useState('');
  const [newBlockDesc, setNewBlockDesc] = useState('');
  const [newBlockOwner, setNewBlockOwner] = useState('');
  const [newBlockDependsOn, setNewBlockDependsOn] = useState('');

  // Snapshots State
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    try {
      const stored = localStorage.getItem('alp-snapshots');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [snapshotNameInput, setSnapshotNameInput] = useState('');

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('alp-theme') as 'dark' | 'light') || 'dark';
    } catch { return 'dark'; }
  });

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

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Save snapshots to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alp-snapshots', JSON.stringify(snapshots));
    } catch {
      // ignore
    }
  }, [snapshots]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('alp-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Topological Analysis (Longest Path, Concurrency, Bottlenecks)
  const topologyMetrics = useMemo(() => {
    if (parsedObjects.length === 0) {
      return { criticalPath: [], maxDepth: 0, maxParallel: 0, bottlenecks: [] };
    }

    const inDegree: Record<string, number> = {};
    const outDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};

    parsedObjects.forEach((o) => {
      inDegree[o.id] = 0;
      outDegree[o.id] = 0;
      adj[o.id] = [];
    });

    edges.forEach((e) => {
      if (adj[e.source]) {
        adj[e.source].push(e.target);
        outDegree[e.source] = (outDegree[e.source] || 0) + 1;
      }
      if (inDegree[e.target] !== undefined) {
        inDegree[e.target] = (inDegree[e.target] || 0) + 1;
      }
    });

    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const queue: string[] = [];

    parsedObjects.forEach((o) => {
      if ((inDegree[o.id] || 0) === 0) {
        queue.push(o.id);
        dist[o.id] = 1;
        prev[o.id] = null;
      }
    });

    const levelCount: Record<number, number> = {};

    while (queue.length > 0) {
      const u = queue.shift()!;
      const d = dist[u] || 1;
      levelCount[d] = (levelCount[d] || 0) + 1;

      (adj[u] || []).forEach((v) => {
        if ((dist[v] || 0) < d + 1) {
          dist[v] = d + 1;
          prev[v] = u;
          queue.push(v);
        }
      });
    }

    let maxNode: string | null = null;
    let maxDist = 0;
    Object.entries(dist).forEach(([id, d]) => {
      if (d > maxDist) {
        maxDist = d;
        maxNode = id;
      }
    });

    const criticalPath: string[] = [];
    let curr: string | null = maxNode;
    while (curr) {
      criticalPath.unshift(curr);
      curr = prev[curr] || null;
    }

    const maxParallel = Math.max(1, ...Object.values(levelCount), 1);
    const bottlenecks = parsedObjects
      .map((o) => ({ id: o.id, type: o._type, score: (inDegree[o.id] || 0) + (outDegree[o.id] || 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return {
      criticalPath,
      maxDepth: maxDist || 1,
      maxParallel,
      bottlenecks,
    };
  }, [parsedObjects, edges]);

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
          if (e.type === 'policy') strokeColor = '#10b981';
          if (e.type === 'contract') strokeColor = '#f59e0b';
          if (e.type === 'vault') strokeColor = '#f43f5e';

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

  const handleStepBackSim = useCallback(() => {
    if (simStepIndex <= 0) return;
    const targetIdx = simStepIndex - 1;
    const targetId = simOrder[targetIdx];

    setSimNodeStates((prev) => {
      const next = { ...prev };
      next[targetId] = '[ ]';
      return next;
    });

    setSimStepIndex(targetIdx);
    setSimLogs((prev) => [`Stepped back before ${targetId}`, ...prev]);
  }, [simStepIndex, simOrder]);

  const handleInjectFailure = (nodeId: string) => {
    setSimNodeStates((prev) => ({
      ...prev,
      [nodeId]: '[!] Injected Failure',
    }));
    setSimLogs((prev) => [`[INJECTED FAULT] Simulated failure on ${nodeId}`, ...prev]);
    showToast(`Injected failure on ${nodeId}`);
  };

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
    showToast('Applied simulation status updates to spec');
  };

  // Sync Node data with simulation states and critical path
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        const simSt = simNodeStates[n.id];
        const isCurrent = simOrder[simStepIndex - 1] === n.id;
        const isSelected = selectedObj?.id === n.id;
        const isCritical = showCriticalPath && topologyMetrics.criticalPath.includes(n.id);

        return {
          ...n,
          data: {
            ...n.data,
            simStatus: simSt,
            isSimulating: simSt !== undefined,
            isExecutingCurrent: isCurrent,
            isHighlightConnected: isSelected,
            isCriticalPath: isCritical,
          },
        };
      })
    );
  }, [simNodeStates, simStepIndex, simOrder, selectedObj, showCriticalPath, topologyMetrics.criticalPath, setNodes]);

  // UI Handlers
  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    if (TEMPLATES[key]) {
      handleResetSim();
      setCode(TEMPLATES[key].code);
      showToast(`Loaded "${TEMPLATES[key].label}"`);
    }
  };

  const handleInsertSnippet = (snippetKey: string) => {
    if (SNIPPETS[snippetKey]) {
      const updated = code.trimEnd() + '\n' + SNIPPETS[snippetKey];
      setCode(updated);
      showToast(`Inserted @${snippetKey}`);
    }
  };

  const handleFormatSpec = useCallback(() => {
    try {
      const formatter = new AlpFormatter({ indentSize: 2 });
      const formattedCode = formatter.format(code);
      setCode(formattedCode);
      showToast('Formatted ALP spec');
    } catch {
      // ignore
    }
  }, [code, showToast]);

  const handleNodeClick = (_: any, node: Node) => {
    if (node.data && node.data.rawObject) {
      setSelectedObj(node.data.rawObject);
      setIsEditingInspector(false);
      setInspectorEditFields({
        id: node.data.rawObject.id,
        status: node.data.rawObject.status || '[ ]',
        description: node.data.rawObject.description || '',
        owner: (node.data.rawObject as any).owner || '',
      });
    }
  };

  const handleSaveInspectorEdit = () => {
    if (!selectedObj) return;
    const oldId = selectedObj.id;
    const newId = inspectorEditFields.id || oldId;
    const newStatus = inspectorEditFields.status || selectedObj.status || '[ ]';
    const newDesc = inspectorEditFields.description;

    let updatedCode = code;
    // Replace id
    if (newId !== oldId) {
      updatedCode = updatedCode.replace(new RegExp(`id:\\s*${oldId}\\b`, 'g'), `id: ${newId}`);
    }
    // Replace status
    const statusRegex = new RegExp(`(id:\\s*${newId}[\\s\\S]*?status:\\s*)\\[[^\\]]*\\]`, 'g');
    if (statusRegex.test(updatedCode)) {
      updatedCode = updatedCode.replace(statusRegex, `$1${newStatus}`);
    }
    // Replace description
    if (newDesc !== undefined) {
      const descRegex = new RegExp(`(id:\\s*${newId}[\\s\\S]*?description:\\s*)"[^"]*"`, 'g');
      if (descRegex.test(updatedCode)) {
        updatedCode = updatedCode.replace(descRegex, `$1"${newDesc}"`);
      }
    }

    setCode(updatedCode);
    setIsEditingInspector(false);
    showToast(`Updated @${selectedObj._type} "${newId}"`);
  };

  const handleCreateBlock = () => {
    if (!newBlockId.trim()) return;
    const lines: string[] = [];
    lines.push(`\n@${newBlockType}`);
    lines.push(`  id: ${newBlockId.trim()}`);
    lines.push(`  status: [ ]`);
    if (newBlockDesc.trim()) {
      lines.push(`  description: "${newBlockDesc.trim()}"`);
    }
    if (newBlockOwner.trim()) {
      lines.push(`  owner: "${newBlockOwner.trim()}"`);
    }
    if (newBlockDependsOn.trim()) {
      lines.push(`  depends_on:`);
      newBlockDependsOn.split(',').forEach((dep) => {
        lines.push(`    - -> ${dep.trim()}`);
      });
    }
    lines.push('');

    const updated = code.trimEnd() + '\n' + lines.join('\n');
    setCode(updated);
    setShowAddModal(false);
    setNewBlockId('');
    setNewBlockDesc('');
    setNewBlockOwner('');
    setNewBlockDependsOn('');
    showToast(`Created @${newBlockType} "${newBlockId.trim()}"`);
  };

  const handleSaveSnapshot = () => {
    const name = snapshotNameInput.trim() || `Snapshot ${snapshots.length + 1}`;
    const newSnap: Snapshot = {
      id: `snap-${Date.now()}`,
      name,
      code,
      createdAt: new Date().toLocaleTimeString(),
    };
    setSnapshots([newSnap, ...snapshots]);
    setSnapshotNameInput('');
    showToast(`Saved snapshot "${name}"`);
  };

  const handleLoadSnapshot = (snap: Snapshot) => {
    setCode(snap.code);
    setShowSnapshotsModal(false);
    showToast(`Restored "${snap.name}"`);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(snapshots.filter((s) => s.id !== id));
  };

  const handleExportMermaid = useCallback(() => {
    const lines: string[] = ['graph TD'];
    parsedObjects.forEach((obj) => {
      const rawSt = simNodeStates[obj.id] || obj.status || '[ ]';
      const cleanSt = rawSt.replace(/[[\]]/g, '');
      const safeId = obj.id.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`  ${safeId}["@${obj._type}: ${obj.id}<br/>(${cleanSt})"]`);
    });
    edges.forEach((e) => {
      const from = e.source.replace(/[^a-zA-Z0-9_]/g, '_');
      const to = e.target.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`  ${from} -->|${e.label || 'ref'}| ${to}`);
    });

    const mermaidText = lines.join('\n');
    navigator.clipboard.writeText(mermaidText);
    showToast('Copied Mermaid markdown to clipboard');
  }, [parsedObjects, edges, simNodeStates, showToast]);

  const handleCopyBundle = useCallback(() => {
    navigator.clipboard.writeText(code);
    showToast('Copied ALP spec to clipboard');
  }, [code, showToast]);

  const handleExportALP = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spec.alp';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded spec.alp');
  }, [code, showToast]);

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
      showToast('Downloaded spec.json');
    } catch {
      // ignore
    }
  }, [code, showToast]);

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
      } else if (ctrl && e.key === 'm') {
        e.preventDefault();
        handleExportMermaid();
      } else if (ctrl && e.key === 'i') {
        e.preventDefault();
        handleFormatSpec();
      } else if (ctrl && e.key === 'n') {
        e.preventDefault();
        setShowAddModal(true);
      } else if (ctrl && e.key === 'k') {
        e.preventDefault();
        setShowSnapshotsModal(true);
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
        setShowAddModal(false);
        setShowSnapshotsModal(false);
        setShowTopologyHud(false);
        setSelectedObj(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCopyBundle, handleExportJSON, handleExportMermaid, handleFormatSpec]);

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
    const obj = parsedObjects.find((o) => o.id === id) || null;
    setSelectedObj(obj);
    if (obj) {
      setIsEditingInspector(false);
      setInspectorEditFields({
        id: obj.id,
        status: simNodeStates[obj.id] || obj.status || '[ ]',
        description: obj.description || '',
        owner: (obj as any).owner || '',
      });
    }
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
              <FiSliders size={12} style={{ marginRight: 4 }} /> DAG
            </button>
            <button
              className={`layout-btn ${layoutMode === 'tree' ? 'active' : ''}`}
              onClick={() => setLayoutMode('tree')}
              title="Hierarchical Tree"
            >
              <FiLayers size={12} style={{ marginRight: 4 }} /> Tree
            </button>
            <button
              className={`layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
              onClick={() => setLayoutMode('grid')}
              title="Grid Matrix"
            >
              <FiGrid size={12} style={{ marginRight: 4 }} /> Grid
            </button>
          </div>

          <button
            className={`action-btn ${showCriticalPath ? 'active' : ''}`}
            onClick={() => setShowCriticalPath((p) => !p)}
            title="Highlight Critical Path (Longest chain)"
          >
            <FiActivity size={13} /> Critical Path
          </button>

          <button
            className="action-btn"
            onClick={() => setShowTopologyHud(true)}
            title="Topology & Bottleneck Analytics"
          >
            <FiTrendingUp size={13} /> Analytics
          </button>

          <button
            className="action-btn"
            onClick={() => setShowSynapseModal(true)}
            title="Synapse Knowledge Graph, Canvas Vault & Wikilinks"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              fontWeight: 600,
            }}
          >
            🧠 Synapse
          </button>

          <button
            className="action-btn"
            onClick={() => setShowMultiModalModal(true)}
            title="Multi-Modal Protocol & VLA Action Space Inspector"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: '#38bdf8',
              fontWeight: 600,
            }}
          >
            👁️ Multi-Modal
          </button>

          <button className="action-btn" onClick={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 400 })} title="Fit graph view">
            <FiMaximize2 size={13} /> Fit View
          </button>

          <button className="action-btn" onClick={handleFormatSpec} title="Format ALP spec (Ctrl+I)">
            <FiCode size={13} /> Format <span className="kbd-hint">Ctrl+I</span>
          </button>

          <button className="action-btn" onClick={() => setShowAddModal(true)} title="Create new ALP block (Ctrl+N)">
            <FiPlus size={13} /> Add <span className="kbd-hint">Ctrl+N</span>
          </button>

          <button className="action-btn" onClick={() => setShowSnapshotsModal(true)} title="Manage Snapshots (Ctrl+K)">
            <FiBookmark size={13} /> Snapshots <span className="kbd-hint">Ctrl+K</span>
          </button>

          <button className="action-btn" onClick={handleCopyBundle} title="Copy bundle (Ctrl+S)">
            <FiCopy size={13} /> Copy <span className="kbd-hint">Ctrl+S</span>
          </button>

          <button className="action-btn" onClick={handleExportMermaid} title="Export Mermaid diagram (Ctrl+M)">
            <FiShare2 size={13} /> Mermaid <span className="kbd-hint">Ctrl+M</span>
          </button>

          <button className="action-btn" onClick={handleExportALP} title="Export as spec.alp">
            <FiFileText size={13} /> .alp
          </button>

          <button className="action-btn" onClick={handleExportJSON} title="Export spec as JSON (Ctrl+E)">
            <FiDownload size={13} /> JSON <span className="kbd-hint">Ctrl+E</span>
          </button>

          <button
            className={`action-btn ${!logPanelCollapsed ? 'active' : ''}`}
            onClick={() => setLogPanelCollapsed((prev) => !prev)}
            title="Toggle validation log panel (Ctrl+L)"
          >
            <FiTerminal size={13} /> Logs <span className="kbd-hint">Ctrl+L</span>
          </button>

          <button
            className={`action-btn ${minimapEnabled ? 'active' : ''}`}
            onClick={() => setMinimapEnabled((prev) => !prev)}
            title="Toggle graph minimap"
          >
            <FiLayers size={13} /> Minimap
          </button>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

          <button
            className="action-btn"
            onClick={() => setShowKbdHelp((p) => !p)}
            title="Keyboard shortcuts (Ctrl+/)"
          >
            <FiKey size={13} /> <span className="kbd-hint">Ctrl+/</span>
          </button>

          <div className="telemetry-badge" title="Live task completion metric">
            <div className="telemetry-ring" />
            <span>{completionRate}% Complete</span>
          </div>

          <div className={`status-indicator ${error ? 'invalid' : 'valid'}`}>
            {error ? <><FiAlertCircle size={13} /> Invalid Spec</> : <><FiCheckCircle size={13} /> Verified DAG</>}
          </div>
        </div>
      </header>

      {/* Simulation Control Toolbar */}
      <div className="sim-bar">
        <div className="sim-controls">
          {!isSimulating ? (
            <button className="sim-btn play" onClick={handleStartSim} title="Start Swarm Simulation">
              <FiPlay size={13} /> Run Swarm Sim
            </button>
          ) : (
            <button className="sim-btn pause" onClick={() => setIsSimulating(false)} title="Pause Simulation">
              <FiPause size={13} /> Pause Sim
            </button>
          )}

          <button
            className="sim-btn step"
            onClick={handleStepBackSim}
            disabled={simStepIndex <= 0}
            title="Step Back in Simulation"
          >
            <FiSkipBack size={13} /> Back
          </button>

          <button
            className="sim-btn step"
            onClick={handleStepSim}
            disabled={simStepIndex >= simOrder.length}
            title="Step Forward Topologically"
          >
            <FiSkipForward size={13} /> Step
          </button>

          <button className="sim-btn reset" onClick={handleResetSim} title="Reset Simulation">
            <FiRotateCcw size={13} /> Reset
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
              <FiZap size={13} /> Apply Sim to Spec
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
              {sidebarCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="sidebar-filters">
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiSearch size={13} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search objects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="sidebar-search"
                    style={{ paddingLeft: 30 }}
                  />
                </div>
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
                {filteredObjects.map((obj) => {
                  const st = simNodeStates[obj.id] || obj.status || '[ ]';
                  const isCritical = showCriticalPath && topologyMetrics.criticalPath.includes(obj.id);
                  return (
                    <div
                      key={obj.id}
                      className={`sidebar-object-item ${selectedObj?.id === obj.id ? 'selected' : ''}`}
                      onClick={() => handleFocusNode(obj.id)}
                    >
                      <div className="sidebar-object-icon">
                        {renderStatusBadge(st)}
                      </div>
                      <div className="sidebar-object-info">
                        <div className="sidebar-object-id">
                          @{obj._type} · {obj.id}
                          {isCritical && <span className="critical-path-chip" style={{ marginLeft: 6 }}>CP</span>}
                        </div>
                        <div className="sidebar-object-status">
                          {obj.description ? obj.description.slice(0, 32) : st}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              <button className="snippet-chip" onClick={() => handleInsertSnippet('feature')}>+ @feature</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('workflow')}>+ @workflow</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('policy')}>+ @policy</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('contract')}>+ @contract</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('vault')}>+ @vault</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('rule')}>+ @rule</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('timeline')}>+ @timeline</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('memory')}>+ @memory</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('swarm')}>+ @swarm</button>
              <button className="snippet-chip" onClick={() => handleInsertSnippet('tenant')}>+ @tenant</button>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="inspector-edit-btn"
                      onClick={() => setIsEditingInspector((p) => !p)}
                    >
                      <FiEdit2 size={11} /> {isEditingInspector ? 'View' : 'Edit'}
                    </button>
                    <button className="close-btn" onClick={() => setSelectedObj(null)}>
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
                <div className="inspector-content">
                  {isEditingInspector ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="form-group">
                        <label className="form-label">ID</label>
                        <input
                          type="text"
                          className="inspector-input-field"
                          value={inspectorEditFields.id || ''}
                          onChange={(e) => setInspectorEditFields({ ...inspectorEditFields, id: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                          className="inspector-input-field"
                          value={inspectorEditFields.status || '[ ]'}
                          onChange={(e) => setInspectorEditFields({ ...inspectorEditFields, status: e.target.value })}
                        >
                          <option value="[ ]">[ ] Todo</option>
                          <option value="[~]">[~] In-Progress</option>
                          <option value="[x]">[x] Done</option>
                          <option value="[!]">[!] Blocked</option>
                          <option value="[?]">[?] Review</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <input
                          type="text"
                          className="inspector-input-field"
                          value={inspectorEditFields.description || ''}
                          onChange={(e) => setInspectorEditFields({ ...inspectorEditFields, description: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button className="sim-btn apply" onClick={handleSaveInspectorEdit}>
                          <FiCheck size={12} /> Save to Spec
                        </button>
                        <button className="sim-btn reset" onClick={() => handleInjectFailure(selectedObj.id)}>
                          <FiAlertTriangle size={12} /> Inject Failure
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {renderInspectorFields(selectedObj).map((field) => (
                        <div key={field.label} className="inspector-field">
                          <div className="field-label">{field.label}</div>
                          <div className="field-value">{field.value}</div>
                        </div>
                      ))}
                      <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                        <button
                          className="sim-btn reset"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => handleInjectFailure(selectedObj.id)}
                        >
                          <FiAlertTriangle size={12} /> Simulate Failure
                        </button>
                      </div>
                    </>
                  )}
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
          <span className="log-panel-title"><FiTerminal style={{ marginRight: 6 }} /> Validation &amp; Simulation Logs</span>
          <button className="sidebar-toggle" onClick={() => setLogPanelCollapsed((prev) => !prev)}>
            {logPanelCollapsed ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
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

      {/* Add New Block Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiPlus size={16} color="var(--accent-cyan)" /> Create New ALP Primitive</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <FiX size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Primitive Type</label>
                <select
                  className="form-select"
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value)}
                >
                  <option value="task">@task — Executable action node</option>
                  <option value="agent">@agent — AI actor profile</option>
                  <option value="feature">@feature — Requirement container</option>
                  <option value="workflow">@workflow — Pipeline schedule</option>
                  <option value="policy">@policy — Security guardrail</option>
                  <option value="contract">@contract — Service boundary</option>
                  <option value="vault">@vault — Secret repository</option>
                  <option value="rule">@rule — Project constraint</option>
                  <option value="timeline">@timeline — Scheduled job</option>
                  <option value="memory">@memory — Semantic vector store</option>
                  <option value="swarm">@swarm — Multi-agent mesh</option>
                  <option value="tenant">@tenant — Multi-tenant boundary</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ID (e.g. task-auth-service)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="my-object-id"
                  value={newBlockId}
                  onChange={(e) => setNewBlockId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Brief summary of this primitive"
                  value={newBlockDesc}
                  onChange={(e) => setNewBlockDesc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Agent (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="@agent-coder"
                  value={newBlockOwner}
                  onChange={(e) => setNewBlockOwner(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dependencies (Comma-separated IDs)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="task-db-schema, task-core"
                  value={newBlockDependsOn}
                  onChange={(e) => setNewBlockDependsOn(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="sim-btn play" onClick={handleCreateBlock} disabled={!newBlockId.trim()}>
                <FiPlus size={13} /> Insert into Spec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshots & History Modal */}
      {showSnapshotsModal && (
        <div className="modal-overlay" onClick={() => setShowSnapshotsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiBookmark size={16} color="var(--accent-purple)" /> Workspace Snapshots</h3>
              <button className="modal-close" onClick={() => setShowSnapshotsModal(false)}>
                <FiX size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Snapshot name (e.g. Before refactoring)"
                  value={snapshotNameInput}
                  onChange={(e) => setSnapshotNameInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="sim-btn play" onClick={handleSaveSnapshot}>
                  <FiBookmark size={13} /> Save
                </button>
              </div>

              <div className="snapshot-list">
                {snapshots.length === 0 ? (
                  <div className="sidebar-empty">No saved snapshots yet</div>
                ) : (
                  snapshots.map((snap) => (
                    <div key={snap.id} className="snapshot-item">
                      <div className="snapshot-info">
                        <span className="snapshot-name">{snap.name}</span>
                        <span className="snapshot-date">{snap.createdAt} · {snap.code.split('\n').length} lines</span>
                      </div>
                      <div className="snapshot-actions">
                        <button className="action-btn" onClick={() => handleLoadSnapshot(snap)}>
                          Restore
                        </button>
                        <button className="modal-close" onClick={() => handleDeleteSnapshot(snap.id)} title="Delete snapshot">
                          <FiTrash2 size={13} color="var(--accent-rose)" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn" onClick={() => setShowSnapshotsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Topology & Bottleneck Analytics HUD */}
      {showTopologyHud && (
        <div className="modal-overlay" onClick={() => setShowTopologyHud(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiTrendingUp size={16} color="var(--accent-cyan)" /> Topology &amp; Critical Path Analytics</h3>
              <button className="modal-close" onClick={() => setShowTopologyHud(false)}>
                <FiX size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="topology-hud-grid">
                <div className="hud-stat-box">
                  <span className="hud-stat-title">DAG Max Depth</span>
                  <span className="hud-stat-value">{topologyMetrics.maxDepth}</span>
                  <span className="hud-stat-desc">Sequential execution levels</span>
                </div>
                <div className="hud-stat-box">
                  <span className="hud-stat-title">Max Concurrency</span>
                  <span className="hud-stat-value">{topologyMetrics.maxParallel}</span>
                  <span className="hud-stat-desc">Peak parallel agent tasks</span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Critical Path ({topologyMetrics.criticalPath.length} nodes)</label>
                <div style={{ background: 'var(--bg-dark)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#f59e0b' }}>
                  {topologyMetrics.criticalPath.length > 0 ? topologyMetrics.criticalPath.join(' ➔ ') : 'None'}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">High-Impact Bottleneck Nodes</label>
                <div className="bottleneck-list">
                  {topologyMetrics.bottlenecks.map((b) => (
                    <div key={b.id} className="bottleneck-item">
                      <span>@{b.type} · <strong>{b.id}</strong></span>
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{b.score} dependencies</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className={`action-btn ${showCriticalPath ? 'active' : ''}`}
                onClick={() => {
                  setShowCriticalPath((p) => !p);
                  setShowTopologyHud(false);
                }}
              >
                <FiActivity size={13} /> {showCriticalPath ? 'Hide on Graph' : 'Highlight on Graph'}
              </button>
              <button className="action-btn" onClick={() => setShowTopologyHud(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Synapse Knowledge Graph & Vault Modal */}
      <SynapseModal
        isOpen={showSynapseModal}
        onClose={() => setShowSynapseModal(false)}
        parsedObjects={parsedObjects}
      />

      {/* Multi-Modal Protocol & VLA Modal */}
      <MultiModalModal
        isOpen={showMultiModalModal}
        onClose={() => setShowMultiModalModal(false)}
        parsedObjects={parsedObjects}
      />

      {/* Keyboard Shortcuts Help Toast */}
      {showKbdHelp && (
        <div className="modal-overlay" onClick={() => setShowKbdHelp(false)}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiKey size={16} color="var(--accent-cyan)" /> Keyboard Shortcuts</h3>
              <button className="modal-close" onClick={() => setShowKbdHelp(false)}>
                <FiX size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="kbd-grid">
                <kbd>Ctrl+S</kbd> <span>Copy ALP Spec</span>
                <kbd>Ctrl+I</kbd> <span>Format ALP Spec</span>
                <kbd>Ctrl+N</kbd> <span>Create New Block</span>
                <kbd>Ctrl+K</kbd> <span>Snapshots / History</span>
                <kbd>Ctrl+M</kbd> <span>Export Mermaid Diagram</span>
                <kbd>Ctrl+E</kbd> <span>Export as JSON</span>
                <kbd>Ctrl+B</kbd> <span>Toggle Explorer Sidebar</span>
                <kbd>Ctrl+L</kbd> <span>Toggle Logs Panel</span>
                <kbd>Ctrl+/</kbd> <span>Show/Hide Shortcuts</span>
                <kbd>Esc</kbd> <span>Close Any Open Modal</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn" onClick={() => setShowKbdHelp(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="toast-banner">
          <FiCheckCircle size={15} color="var(--accent-emerald)" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type { Edge, Node, ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';
import { AlpParser, AlpGraph, AlpFormatter } from '@autonomous-lifecycle-protocol-alp/parser';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import yaml from 'js-yaml';
import { TEMPLATES } from './constants/templates.js';
import { SynapseModal } from './components/SynapseModal.js';
import { MultiModalModal } from './components/MultiModalModal.js';
import { SnippetBar, SNIPPETS } from './components/SnippetBar.js';
import { AddBlockModal } from './components/AddBlockModal.js';
import { SnapshotsModal, type Snapshot } from './components/SnapshotsModal.js';
import { TopologyHud } from './components/TopologyHud.js';
import { KbdHelp } from './components/KbdHelp.js';
import { NodeInspector } from './components/NodeInspector.js';
import { AlpBreadcrumbs } from './components/AlpBreadcrumbs.js';
import { AlpCustomNode, renderStatusBadge } from './components/AlpCustomNode.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { useTopologyMetrics } from './hooks/useTopologyMetrics.js';
import { applyForceLayout, applyCircularLayout } from './hooks/layouts.js';
import { toPng } from 'html-to-image';
import {
  FiPlay,
  FiPause,
  FiSkipForward,
  FiSkipBack,
  FiRotateCcw,
  FiCopy,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
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
  FiCode,
  FiFileText,
  FiZap,
  FiSliders,
  FiKey,
  FiPlus,
  FiShare2,
  FiBookmark,
  FiTrendingUp,
  FiActivity,
  FiImage,
  FiCircle,
} from 'react-icons/fi';
import './App.css';

type TypeFilter = 'all' | string;
type LayoutMode = 'dag' | 'tree' | 'grid' | 'force' | 'circular';

// ── Helpers & Node Components moved to ./components/AlpCustomNode.tsx ──

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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dag');
  const [parsedObjects, setParsedObjects] = useState<AlpObject[]>([]);
  const [cursorLine, setCursorLine] = useState<number>(1);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSnapshotsModal, setShowSnapshotsModal] = useState(false);
  const [showTopologyHud, setShowTopologyHud] = useState(false);
  const [showSynapseModal, setShowSynapseModal] = useState(false);
  const [showMultiModalModal, setShowMultiModalModal] = useState(false);
  const [showKbdHelp, setShowKbdHelp] = useState(false);
  const [isEditingInspector, setIsEditingInspector] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

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
  const topologyMetrics = useTopologyMetrics(parsedObjects, edges);

  // Parse and Layout Engine (parsing is debounced via the useEffect below)
  const processCode = useCallback((codeToParse: string, currentLayout: LayoutMode) => {
    const logs: string[] = [];
    try {
      const parser = new AlpParser();
      const objects = parser.parseAndValidate(codeToParse);
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
                 owner: obj.owner || null,
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
               owner: obj.owner || null,
              rawObject: obj,
            },
          });
        });
      } else if (currentLayout === 'force') {
        const edgePairs = edgeList.map((e) => ({ source: e.from, target: e.to }));
        const forceNodes = applyForceLayout(objects, edgePairs);
        forceNodes.forEach((nd) => newNodes.push(nd));
      } else if (currentLayout === 'circular') {
        const circNodes = applyCircularLayout(objects);
        circNodes.forEach((nd) => newNodes.push(nd));
      } else {
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
                 owner: obj.owner || null,
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
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (processTimerRef.current) clearTimeout(processTimerRef.current);
    processTimerRef.current = window.setTimeout(() => {
      processCode(code, layoutMode);
    }, 300);
    return () => {
      if (processTimerRef.current) clearTimeout(processTimerRef.current);
    };
  }, [code, layoutMode, processCode]);

  const handleStartSim = useCallback(() => {
    const initialStates: Record<string, string> = {};
    parsedObjects.forEach((o) => {
      initialStates[o.id] = '[ ]';
    });
    setSimNodeStates(initialStates);
    setSimStepIndex(0);
    setIsSimulating(true);
    setSimLogs(['Swarm Simulation Started', `[TOPOLOGY] ${simOrder.join(' -> ')}`]);
  }, [parsedObjects, simOrder]);

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

  const handleInjectFailure = useCallback((nodeId: string) => {
    setSimNodeStates((prev) => ({
      ...prev,
      [nodeId]: '[!] Injected Failure',
    }));
    setSimLogs((prev) => [`[INJECTED FAULT] Simulated failure on ${nodeId}`, ...prev]);
    showToast(`Injected failure on ${nodeId}`);
  }, [showToast]);

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

  const handleResetSim = useCallback(() => {
    setIsSimulating(false);
    setSimStepIndex(0);
    setSimNodeStates({});
    setSimLogs([]);
  }, []);

  const handleApplySimToCode = useCallback(() => {
    let updatedCode = code;
    Object.entries(simNodeStates).forEach(([id, st]) => {
      const regex = new RegExp(`(id:\\s*${id}[\\s\\S]*?status:\\s*)\\[[^\\]]*\\]`, 'g');
      updatedCode = updatedCode.replace(regex, `$1${st}`);
    });
    setCode(updatedCode);
    setSimLogs((prev) => ['Applied simulation status updates to ALP spec', ...prev]);
    showToast('Applied simulation status updates to spec');
  }, [code, simNodeStates, showToast]);

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
  const handleTemplateChange = useCallback((key: string) => {
    setTemplateKey(key);
    if (TEMPLATES[key]) {
      handleResetSim();
      setCode(TEMPLATES[key].code);
      showToast(`Loaded "${TEMPLATES[key].label}"`);
    }
  }, [handleResetSim, showToast]);

  const handleInsertSnippet = useCallback((snippetKey: string) => {
    if (!SNIPPETS[snippetKey]) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        const position = editor.getPosition();
        if (position) {
          const currentLine = model.getLineContent(position.lineNumber);
          const indent = currentLine.match(/^\s*/)?.[0] || '';
          const snippet = SNIPPETS[snippetKey].replace(/^/gm, indent);
          editor.executeEdits('insert-snippet', [
            {
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: snippet,
            },
          ]);
          editor.focus();
          showToast(`Inserted @${snippetKey}`);
          return;
        }
      }
    }

    const updated = code.trimEnd() + '\n' + SNIPPETS[snippetKey];
    setCode(updated);
    showToast(`Inserted @${snippetKey}`);
  }, [code, showToast]);

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

  const handleUndo = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.trigger('keyboard', 'undo');
    }
  }, []);

  const handleRedo = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.trigger('keyboard', 'redo');
    }
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.data && node.data.rawObject) {
      setSelectedObj(node.data.rawObject);
    }
  }, [setSelectedObj]);

  const handleSaveInspectorEdit = useCallback((fields: { id: string; status: string; description: string }) => {
    if (!selectedObj) return;
    const oldId = selectedObj.id;
    const newId = fields.id || oldId;
    const newStatus = fields.status || selectedObj.status || '[ ]';
    const newDesc = fields.description;

    let updatedCode = code;
    if (newId !== oldId) {
      updatedCode = updatedCode.replace(new RegExp(`id:\\s*${oldId}\\b`, 'g'), `id: ${newId}`);
    }
    const statusRegex = new RegExp(`(id:\\s*${newId}[\\s\\S]*?status:\\s*)\\[[^\\]]*\\]`, 'g');
    if (statusRegex.test(updatedCode)) {
      updatedCode = updatedCode.replace(statusRegex, `$1${newStatus}`);
    }
    if (newDesc !== undefined) {
      const descRegex = new RegExp(`(id:\\s*${newId}[\\s\\S]*?description:\\s*)"[^"]*"`, 'g');
      if (descRegex.test(updatedCode)) {
        updatedCode = updatedCode.replace(descRegex, `$1"${newDesc}"`);
      }
    }

    setCode(updatedCode);
    showToast(`Updated @${selectedObj._type} "${newId}"`);
  }, [selectedObj, code, showToast]);

  const handleCreateBlock = useCallback((block: {
    type: string;
    id: string;
    description: string;
    owner: string;
    dependsOn: string;
  }) => {
    const lines: string[] = [];
    lines.push(`\n@${block.type}`);
    lines.push(`  id: ${block.id}`);
    lines.push(`  status: [ ]`);
    if (block.description) {
      lines.push(`  description: "${block.description}"`);
    }
    if (block.owner) {
      lines.push(`  owner: "${block.owner}"`);
    }
    if (block.dependsOn) {
      lines.push(`  depends_on:`);
      block.dependsOn.split(',').forEach((dep) => {
        lines.push(`    - -> ${dep.trim()}`);
      });
    }
    lines.push('');

    const updated = code.trimEnd() + '\n' + lines.join('\n');
    setCode(updated);
    setShowAddModal(false);
    showToast(`Created @${block.type} "${block.id}"`);
  }, [code, showToast]);

  const handleSaveSnapshot = useCallback(() => {
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
  }, [snapshotNameInput, snapshots, code, showToast]);

  const handleLoadSnapshot = useCallback((snap: Snapshot) => {
    setCode(snap.code);
    setShowSnapshotsModal(false);
    showToast(`Restored "${snap.name}"`);
  }, [showToast]);

  const handleDeleteSnapshot = useCallback((id: string) => {
    setSnapshots(snapshots.filter((s) => s.id !== id));
  }, [snapshots]);

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

  const handleExportYAML = useCallback(() => {
    try {
      const parser = new AlpParser();
      const objects = parser.parseAndValidate(code);
      const yamlStr = yaml.dump(objects, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        styles: { null: 'empty' },
      });
      const blob = new Blob([yamlStr], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spec.yaml';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded spec.yaml');
    } catch {
      // ignore
    }
  }, [code, showToast]);

  const handleExportPNG = useCallback(async () => {
    try {
      const element = document.querySelector('.graph-container .react-flow') as HTMLElement | null;
      if (!element) {
        showToast('Could not find canvas element');
        return;
      }
      const dataUrl = await toPng(element, {
        backgroundColor: theme === 'dark' ? '#0d1017' : '#f8fafc',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'spec.png';
      a.click();
      showToast('Downloaded spec.png');
    } catch (err) {
      console.error('PNG export failed:', err);
      showToast('PNG export failed. Please try again.');
    }
  }, [theme, showToast]);

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
      } else if (ctrl && e.key === 'y') {
        e.preventDefault();
        handleExportYAML();
      } else if (ctrl && e.key === 'p') {
        e.preventDefault();
        handleExportPNG();
      } else if (ctrl && e.key === 'm') {
        e.preventDefault();
        handleExportMermaid();
      } else if (ctrl && e.key === 'i') {
        e.preventDefault();
        handleFormatSpec();
      } else if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (ctrl && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
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
        setShowSynapseModal(false);
        setShowMultiModalModal(false);
        setSelectedObj(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCopyBundle, handleExportJSON, handleExportYAML, handleExportPNG, handleExportMermaid, handleFormatSpec, handleUndo, handleRedo]);

  const taskStats = useMemo(() => {
    const total = nodes.filter((n) => n.data.type === 'task').length;
    const done = nodes.filter((n) => (n.data.simStatus || n.data.status || '').includes('[x]')).length;
    const inProgress = nodes.filter((n) => (n.data.simStatus || n.data.status || '').includes('[~]')).length;
    const blocked = nodes.filter((n) => (n.data.simStatus || n.data.status || '').includes('[!]')).length;
    const review = nodes.filter((n) => (n.data.simStatus || n.data.status || '').includes('[?]')).length;
    const completion = total > 0 ? Math.round((done / total) * 100) : 100;
    return { total, done, inProgress, blocked, review, completion };
  }, [nodes]);

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

  const handleFocusNode = useCallback((id: string) => {
    const obj = parsedObjects.find((o) => o.id === id) || null;
    setSelectedObj(obj);
  }, [parsedObjects, setSelectedObj]);

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
            <button
              className={`layout-btn ${layoutMode === 'force' ? 'active' : ''}`}
              onClick={() => setLayoutMode('force')}
              title="Force-Directed Physics"
            >
              <FiZap size={12} style={{ marginRight: 4 }} /> Force
            </button>
            <button
              className={`layout-btn ${layoutMode === 'circular' ? 'active' : ''}`}
              onClick={() => setLayoutMode('circular')}
              title="Circular Layout"
            >
              <FiCircle size={12} style={{ marginRight: 4 }} /> Circular
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

          <button className="action-btn" onClick={handleUndo} title="Undo (Ctrl+Z)">
            Undo <span className="kbd-hint">Ctrl+Z</span>
          </button>

          <button className="action-btn" onClick={handleRedo} title="Redo (Ctrl+Shift+Z)">
            Redo <span className="kbd-hint">Ctrl+Shift+Z</span>
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

          <button className="action-btn" onClick={handleExportYAML} title="Export spec as YAML (Ctrl+Y)">
            <FiFileText size={13} /> YAML <span className="kbd-hint">Ctrl+Y</span>
          </button>

          <button className="action-btn" onClick={handleExportPNG} title="Export canvas as PNG (Ctrl+P)">
            <FiImage size={13} /> PNG <span className="kbd-hint">Ctrl+P</span>
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
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
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
             <span>{taskStats.completion}% Complete</span>
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
            <button className="sidebar-toggle" onClick={() => setSidebarCollapsed((prev) => !prev)} aria-label="Toggle sidebar">
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

            <SnippetBar onInsert={handleInsertSnippet} />
            <AlpBreadcrumbs code={code} lineNumber={cursorLine} />

            <ErrorBoundary
              fallbackTitle="Editor failed to load"
              fallbackMessage="The code editor encountered an unexpected error. You can try reloading the app."
            >
              <Editor
                height="100%"
                language="alp"
                theme={theme === 'dark' ? 'alp-dark' : 'light'}
                value={code}
                onChange={(val) => setCode(val || '')}
                beforeMount={(monaco) => { monacoRef.current = monaco; }}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.onDidChangeCursorPosition((e: any) => {
                    setCursorLine(e.position.lineNumber);
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono',
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  lineNumbersMinChars: 3,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </ErrorBoundary>
          </div>

          {/* Right: DAG Visualizer */}
          <div className="graph-container" role="application" aria-label="ALP specification graph visualization">
            <ErrorBoundary
              fallbackTitle="Graph rendering failed"
              fallbackMessage="The graph visualizer encountered an unexpected error. Try reloading or simplifying your spec."
            >
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
            </ErrorBoundary>

            {selectedObj && (
              <NodeInspector
                obj={selectedObj}
                simStatus={simNodeStates[selectedObj.id]}
                isEditing={isEditingInspector}
                onClose={() => setSelectedObj(null)}
                onToggleEdit={() => setIsEditingInspector((p) => !p)}
                onSave={handleSaveInspectorEdit}
                onInjectFailure={handleInjectFailure}
              />
            )}

            {/* Error Banner */}
            {error && <div className="error-toast">{error}</div>}
          </div>
        </div>
        {/* Mobile sidebar backdrop */}
        <div className="sidebar-backdrop" onClick={() => setSidebarCollapsed(true)} />
        {/* Mobile sidebar floating toggle */}
        <button
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Open sidebar"
          title="Open explorer sidebar"
        >
          <FiChevronRight size={18} />
        </button>
      </div>

      {/* Validation Log Panel */}
      <div className={`log-panel ${logPanelCollapsed ? 'collapsed' : ''}`}>
        <div className="log-panel-header">
          <span className="log-panel-title"><FiTerminal style={{ marginRight: 6 }} /> Validation &amp; Simulation Logs</span>
          <button className="sidebar-toggle" onClick={() => setLogPanelCollapsed((prev) => !prev)} aria-label="Toggle log panel">
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
          Tasks: <strong>{taskStats.total}</strong>
        </div>
        <div className="summary-item done">
          Done: <strong>{taskStats.done}</strong>
        </div>
        <div className="summary-item in-progress">
          In Progress: <strong>{taskStats.inProgress}</strong>
        </div>
        <div className="summary-item blocked">
          Blocked: <strong>{taskStats.blocked}</strong>
        </div>
        <div className="summary-item review">
          Review: <strong>{taskStats.review}</strong>
        </div>
        <div className="summary-item edges-count">
          Edges: <strong>{edges.length}</strong>
        </div>
      </footer>

      <AddBlockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateBlock}
      />

      <SnapshotsModal
        isOpen={showSnapshotsModal}
        onClose={() => setShowSnapshotsModal(false)}
        snapshots={snapshots}
        onSave={handleSaveSnapshot}
        onLoad={handleLoadSnapshot}
        onDelete={handleDeleteSnapshot}
      />

      <TopologyHud
        isOpen={showTopologyHud}
        onClose={() => setShowTopologyHud(false)}
        metrics={{
          maxDepth: topologyMetrics.maxDepth,
          maxParallel: topologyMetrics.maxParallel,
          criticalPath: topologyMetrics.criticalPath,
          bottlenecks: topologyMetrics.bottlenecks,
        }}
        showCriticalPath={showCriticalPath}
        onToggleCriticalPath={() => {
          setShowCriticalPath((p) => !p);
          setShowTopologyHud(false);
        }}
      />

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

      <KbdHelp isOpen={showKbdHelp} onClose={() => setShowKbdHelp(false)} />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="toast-banner" role="status" aria-live="polite">
          <FiCheckCircle size={15} color="var(--accent-emerald)" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

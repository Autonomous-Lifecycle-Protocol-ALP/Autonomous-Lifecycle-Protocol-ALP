import { Handle, Position } from 'reactflow';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiHelpCircle } from 'react-icons/fi';

interface AlpCustomNodeData {
  id: string;
  type: string;
  status?: string;
  owner?: string;
  simStatus?: string;
  isSimulating?: boolean;
  isExecutingCurrent?: boolean;
  isCriticalPath?: boolean;
  isHighlightConnected?: boolean;
  rawObject?: any;
}

interface AlpCustomNodeProps {
  data: AlpCustomNodeData;
  selected?: boolean;
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

export function AlpCustomNode({ data, selected = false }: AlpCustomNodeProps) {
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

// oxlint-disable-next-line react/only-export-components
export { TYPE_META, renderStatusBadge };

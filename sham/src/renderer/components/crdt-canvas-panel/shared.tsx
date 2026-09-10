import React, { useState } from 'react';
import { CRDTCanvasEngine, CanvasEdge } from '@autonomous-lifecycle-protocol-alp/parser';

export interface Peer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  title: string;
  type: 'TASK' | 'POLICY' | 'AGENT' | 'NOTE';
  x: number;
  y: number;
  content: string;
  version: number;
}

export interface SnapPanelProps {
  snapshotJson: string | null;
  onDismiss: () => void;
}

export interface ToolbarProps {
  newNodeTitle: string;
  newNodeType: 'TASK' | 'POLICY' | 'AGENT' | 'NOTE';
  onTitleChange: (value: string) => void;
  onTypeChange: (value: 'TASK' | 'POLICY' | 'AGENT' | 'NOTE') => void;
  onAddNode: () => void;
}

export interface CanvasViewProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  peers: Peer[];
  selectedNode: CanvasNode | null;
  snapshotJson: string | null;
  onSelectNode: (node: CanvasNode) => void;
  onDismissSnapshot: () => void;
}

export const TYPE_COLORS: Record<string, string> = {
  TASK: '#4fc3f7',
  POLICY: '#aed581',
  AGENT: '#ff8a65',
  NOTE: '#ffd54f',
};

export const styles = {
  container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: '#0a0a14', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' },
  header: { padding: '12px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  canvas: { flex: 1, position: 'relative' as const, overflow: 'hidden', background: '#0a0a14' },
  nodeCard: (type: string, isSelected: boolean) => ({
    position: 'absolute' as const,
    width: 180,
    padding: 12,
    borderRadius: 8,
    background: '#16182a',
    border: `2px solid ${isSelected ? '#a78bfa' : TYPE_COLORS[type] || '#4fc3f7'}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    cursor: 'pointer',
    userSelect: 'none' as const,
    zIndex: 2,
  }),
  peerBadge: (color: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 16,
    background: color + '22',
    color,
    fontSize: 12,
    fontWeight: 600,
    border: `1px solid ${color}44`,
  }),
  cursorMarker: (color: string) => ({
    position: 'absolute' as const,
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 10px ${color}`,
    pointerEvents: 'none' as const,
    transform: 'translate(-50%, -50%)',
    zIndex: 3,
  }),
  input: { background: '#16182a', border: '1px solid #2a2d4a', borderRadius: 6, color: '#e0e0e0', padding: '6px 10px', fontSize: 13 },
  btn: { background: '#a78bfa', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};

export const getNodeCenter = (id: string, nodes: CanvasNode[]) => {
  const n = nodes.find(x => x.id === id);
  if (!n) return { x: 0, y: 0 };
  return { x: n.x + 90, y: n.y + 40 };
};

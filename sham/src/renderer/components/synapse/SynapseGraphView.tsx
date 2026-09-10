import React from 'react';
import { SynapseTopology, SynapseNode } from '@autonomous-lifecycle-protocol-alp/sdk';
import { Icon } from '../Icon.js';

interface SynapseGraphViewProps {
  topology: SynapseTopology;
  filteredNodes: SynapseNode[];
  nodePositions: Map<string, { x: number; y: number }>;
  selectedNode: SynapseNode | null;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string) => void;
  onSelectNode?: (nodeId: string) => void;
}

export function SynapseGraphView({
  topology,
  filteredNodes,
  nodePositions,
  selectedNode,
  selectedNodeId,
  setSelectedNodeId,
  onSelectNode,
}: SynapseGraphViewProps): React.JSX.Element {
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (onSelectNode) onSelectNode(nodeId);
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '480px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 680 480" style={{ display: 'block' }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="18" refY="3" orient="auto">
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
              onClick={() => handleNodeClick(node.id)}
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
  );
}

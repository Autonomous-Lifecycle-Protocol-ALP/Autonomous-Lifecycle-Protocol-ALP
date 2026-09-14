import React from 'react';
import { SynapseNode } from '@autonomous-lifecycle-protocol-alp/sdk';

interface SynapseInspectorProps {
  selectedNode: SynapseNode;
  setSelectedNodeId: (id: string) => void;
}

export function SynapseInspector({ selectedNode, setSelectedNodeId }: SynapseInspectorProps): React.JSX.Element {
  return (
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
  );
}

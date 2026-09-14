import React from 'react';
import { Icon } from '../Icon.js';
import { ToolbarProps } from './shared.js';

export function Toolbar({ newNodeTitle, newNodeType, onTitleChange, onTypeChange, onAddNode }: ToolbarProps) {
  return (
    <div style={{ padding: '8px 16px', borderBottom: '1px solid #1e2035', background: '#121324', display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        placeholder="Node title (@policy, @task, etc.)"
        value={newNodeTitle}
        onChange={e => onTitleChange(e.target.value)}
        style={{ flex: 1 }}
      />
      <select value={newNodeType} onChange={e => onTypeChange(e.target.value as any)} style={{ background: '#16182a', border: '1px solid #2a2d4a', borderRadius: 6, color: '#e0e0e0', padding: '6px 10px', fontSize: 13 }}>
        <option value="TASK">TASK</option>
        <option value="POLICY">POLICY</option>
        <option value="AGENT">AGENT</option>
        <option value="NOTE">NOTE</option>
      </select>
      <button onClick={onAddNode} style={{ background: '#a78bfa', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        + Add Node
      </button>
    </div>
  );
}

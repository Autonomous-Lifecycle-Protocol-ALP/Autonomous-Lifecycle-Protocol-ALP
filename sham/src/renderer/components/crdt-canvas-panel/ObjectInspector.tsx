import React from 'react';
import { CanvasViewProps, SnapPanelProps } from './shared.js';

export function ObjectInspector({ snapshotJson, onDismissSnapshot }: SnapPanelProps) {
  if (!snapshotJson) return null;

  return (
    <div style={{ position: 'absolute', bottom: 16, right: 16, width: 320, background: '#121324', border: '1px solid #10b98144', borderRadius: 8, padding: 12, zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
        <span>CRDT Snapshot JSON</span>
        <button onClick={onDismissSnapshot} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 12 }}>&times;</span>
        </button>
      </div>
      <pre style={{ margin: 0, fontSize: 10, maxHeight: 150, overflow: 'auto', background: '#0a0a14', padding: 8, borderRadius: 4 }}>{snapshotJson}</pre>
    </div>
  );
}

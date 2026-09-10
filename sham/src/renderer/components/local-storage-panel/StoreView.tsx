import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { LocalStorageContainer, ContainerMetrics, StorageItem } from '@autonomous-lifecycle-protocol-alp/parser';

export interface StoreViewProps {
  container: LocalStorageContainer;
  metrics: ContainerMetrics;
  activeNamespace: string;
  keyInput: string;
  valInput: string;
  ttlInput: string;
  onNamespaceChange: (ns: string) => void;
  onKeyInputChange: (v: string) => void;
  onValInputChange: (v: string) => void;
  onTtlInputChange: (v: string) => void;
  onSetItem: () => void;
  onDeleteItem: (key: string) => void;
  onPurge: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  container,
  metrics,
  activeNamespace,
  keyInput,
  valInput,
  ttlInput,
  onNamespaceChange,
  onKeyInputChange,
  onValInputChange,
  onTtlInputChange,
  onSetItem,
  onDeleteItem,
  onPurge,
}) => {
  const items: StorageItem[] = container.listNamespace(activeNamespace);

  return (
    <>
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Items</div>
          <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '4px' }}>{metrics.totalItems}</div>
        </div>
        <div className="kpi-card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Bytes Used</div>
          <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, color: 'var(--accent-green)', marginTop: '4px' }}>{metrics.totalBytesUsed} B</div>
        </div>
        <div className="kpi-card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Namespaces</div>
          <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, color: 'var(--accent-pink)', marginTop: '4px' }}>{metrics.namespaces.length}</div>
        </div>
        <div className="kpi-card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active / Expired</div>
          <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, color: 'var(--accent-yellow)', marginTop: '4px' }}>{metrics.activeItems} / {metrics.expiredItems}</div>
        </div>
      </div>

      <div className="flex-wrap-gap" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        {['workspace', 'agent-cache', 'session', 'tenant'].map((ns) => (
          <button
            key={ns}
            onClick={() => onNamespaceChange(ns)}
            className="btn btn-sm badge-responsive"
            style={{
              borderRadius: '6px',
              border: activeNamespace === ns ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
              background: activeNamespace === ns ? 'var(--accent-blue)10' : 'var(--bg-secondary)',
              color: activeNamespace === ns ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {ns}
          </button>
        ))}
      </div>

      <div className="section-card">
        <h4 className="section-card-title">+ Add Key to &quot;{activeNamespace}&quot; Namespace</h4>
        <div className="flex-wrap-gap">
          <input
            type="text"
            placeholder="Key..."
            value={keyInput}
            onChange={(e) => onKeyInputChange(e.target.value)}
            className="input-field input-responsive"
            style={{ width: 'clamp(120px, 25vw, 180px)' }}
          />
          <input
            type="text"
            placeholder="Value (string or JSON)..."
            value={valInput}
            onChange={(e) => onValInputChange(e.target.value)}
            className="input-field input-fluid"
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="text"
            placeholder="TTL (sec)..."
            value={ttlInput}
            onChange={(e) => onTtlInputChange(e.target.value)}
            className="input-field input-responsive"
            style={{ width: 'clamp(60px, 15vw, 100px)' }}
          />
          <button
            onClick={onSetItem}
            className="btn btn-sm btn-responsive btn-primary"
            style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'var(--bg-primary)', fontWeight: 700 }}
          >
            Save Key
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Size</th>
              <th>SHA-256 Checksum</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((it) => (
                <tr key={it.key}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{it.key}</td>
                  <td style={{ color: 'var(--accent-green)', fontFamily: 'monospace' }}>
                    {JSON.stringify(it.value)}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{it.sizeBytes} B</td>
                  <td style={{ color: 'var(--accent-yellow)', fontFamily: 'monospace' }}>{it.checksum}</td>
                  <td>
                    <button
                      onClick={() => onDeleteItem(it.key)}
                      className="btn btn-xs badge-responsive"
                      style={{ background: 'var(--accent-red)10', color: 'var(--accent-red)', border: '1px solid var(--accent-red)33', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-state-title">
                  No items in namespace &quot;{activeNamespace}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

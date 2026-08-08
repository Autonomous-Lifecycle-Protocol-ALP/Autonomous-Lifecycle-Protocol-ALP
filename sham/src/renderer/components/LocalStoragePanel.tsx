import React, { useState } from 'react';
import { Icon } from './Icon.js';
import { LocalStorageContainer, ContainerMetrics, StorageItem } from '@autonomous-lifecycle-protocol-alp/parser';

export const LocalStoragePanel: React.FC = () => {
  const [container] = useState(() => {
    const c = new LocalStorageContainer(50 * 1024 * 1024);
    c.set('workspace', 'project_name', 'Autonomous-Lifecycle-Protocol');
    c.set('workspace', 'active_branch', 'main');
    c.set('agent-cache', 'parser_ast_nodes', 1420);
    c.set('session', 'auth_token', 'jwt-token-sample-9014');
    return c;
  });

  const [activeNamespace, setActiveNamespace] = useState('workspace');
  const [keyInput, setKeyInput] = useState('');
  const [valInput, setValInput] = useState('');
  const [ttlInput, setTtlInput] = useState('');
  const [metrics, setMetrics] = useState<ContainerMetrics>(container.getMetrics());

  const items: StorageItem[] = container.listNamespace(activeNamespace);

  const handleSetItem = () => {
    if (!keyInput.trim()) return;
    let parsedVal: unknown = valInput;
    try {
      parsedVal = JSON.parse(valInput);
    } catch {
      parsedVal = valInput;
    }
    const ttl = ttlInput ? parseInt(ttlInput, 10) : undefined;
    container.set(activeNamespace, keyInput, parsedVal, ttl);
    setMetrics(container.getMetrics());
    setKeyInput('');
    setValInput('');
    setTtlInput('');
  };

  const handleDeleteItem = (key: string) => {
    container.delete(activeNamespace, key);
    setMetrics(container.getMetrics());
  };

  const handlePurge = () => {
    container.purgeExpired();
    setMetrics(container.getMetrics());
  };

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent-blue)', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="database" size={20} /> Isolated Local Storage Container (v78.0.0)</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Scoped namespace key-value persistence, encrypted state envelopes, checksums, and TTL decay manager
          </p>
        </div>
        <button
          onClick={handlePurge}
          className="btn btn-sm badge-responsive"
          style={{ background: 'var(--accent-red)15', color: 'var(--accent-red)', border: '1px solid var(--accent-red)44', fontWeight: 600 }}
        >
          Purge Expired Keys
        </button>
      </div>

      {/* Storage Health Metrics Bar */}
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

      {/* Namespace Tabs */}
      <div className="flex-wrap-gap" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        {['workspace', 'agent-cache', 'session', 'tenant'].map((ns) => (
          <button
            key={ns}
            onClick={() => setActiveNamespace(ns)}
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

      {/* Add New Key Form */}
      <div className="section-card">
        <h4 className="section-card-title">+ Add Key to "{activeNamespace}" Namespace</h4>
        <div className="flex-wrap-gap">
          <input
            type="text"
            placeholder="Key..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="input-field input-responsive"
            style={{ width: 'clamp(120px, 25vw, 180px)' }}
          />
          <input
            type="text"
            placeholder="Value (string or JSON)..."
            value={valInput}
            onChange={(e) => setValInput(e.target.value)}
            className="input-field input-fluid"
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="text"
            placeholder="TTL (sec)..."
            value={ttlInput}
            onChange={(e) => setTtlInput(e.target.value)}
            className="input-field input-responsive"
            style={{ width: 'clamp(60px, 15vw, 100px)' }}
          />
          <button
            onClick={handleSetItem}
            className="btn btn-sm btn-responsive btn-primary"
            style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'var(--bg-primary)', fontWeight: 700 }}
          >
            Save Key
          </button>
        </div>
      </div>

      {/* Items Table */}
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
                      onClick={() => handleDeleteItem(it.key)}
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
                  No items in namespace "{activeNamespace}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

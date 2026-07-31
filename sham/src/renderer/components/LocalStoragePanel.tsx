import React, { useState } from 'react';
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
    <div style={{ padding: '24px', color: '#e6e6f0', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #2a2a3a', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#00f0ff', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.5px' }}>
            📦 Isolated Local Storage Container (v78.0.0)
          </h2>
          <p style={{ margin: '4px 0 0', color: '#9e9eb0', fontSize: '0.875rem' }}>
            Scoped namespace key-value persistence, encrypted state envelopes, checksums, and TTL decay manager
          </p>
        </div>
        <button
          onClick={handlePurge}
          style={{ padding: '8px 16px', background: 'rgba(255, 51, 102, 0.15)', color: '#ff3366', border: '1px solid rgba(255, 51, 102, 0.4)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Purge Expired Keys
        </button>
      </div>

      {/* Storage Health Metrics Bar */}
      <div style={{ gridTemplateColumns: 'repeat(4, 1fr)', display: 'grid', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a' }}>
          <div style={{ color: '#9e9eb0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Items</div>
          <div style={{ color: '#00f0ff', fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>{metrics.totalItems}</div>
        </div>
        <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a' }}>
          <div style={{ color: '#9e9eb0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Bytes Used</div>
          <div style={{ color: '#00ff9d', fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>{metrics.totalBytesUsed} B</div>
        </div>
        <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a' }}>
          <div style={{ color: '#9e9eb0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Namespaces</div>
          <div style={{ color: '#ff00ff', fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>{metrics.namespaces.length}</div>
        </div>
        <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a' }}>
          <div style={{ color: '#9e9eb0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Active / Expired</div>
          <div style={{ color: '#ffcc00', fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>{metrics.activeItems} / {metrics.expiredItems}</div>
        </div>
      </div>

      {/* Namespace Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #1f1f2e', paddingBottom: '8px' }}>
        {['workspace', 'agent-cache', 'session', 'tenant'].map((ns) => (
          <button
            key={ns}
            onClick={() => setActiveNamespace(ns)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeNamespace === ns ? '1px solid #00f0ff' : '1px solid #2a2a3a',
              background: activeNamespace === ns ? 'rgba(0, 240, 255, 0.1)' : '#12121c',
              color: activeNamespace === ns ? '#00f0ff' : '#9e9eb0',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {ns}
          </button>
        ))}
      </div>

      {/* Add New Key Form */}
      <div style={{ background: '#0d0d14', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a3a', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px', color: '#e6e6f0', fontSize: '0.9rem', fontWeight: 600 }}>
          + Add Key to "{activeNamespace}" Namespace
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Key..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            style={{ width: '180px', padding: '8px 12px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
          />
          <input
            type="text"
            placeholder="Value (string or JSON)..."
            value={valInput}
            onChange={(e) => setValInput(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
          />
          <input
            type="text"
            placeholder="TTL (sec)..."
            value={ttlInput}
            onChange={(e) => setTtlInput(e.target.value)}
            style={{ width: '100px', padding: '8px 12px', background: '#161622', border: '1px solid #2a2a3a', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
          />
          <button
            onClick={handleSetItem}
            style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #00f0ff, #0066ff)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Save Key
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ background: '#0d0d14', borderRadius: '10px', border: '1px solid #2a2a3a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#12121c', color: '#00f0ff', borderBottom: '1px solid #2a2a3a' }}>
              <th style={{ padding: '12px 16px' }}>Key</th>
              <th style={{ padding: '12px 16px' }}>Value</th>
              <th style={{ padding: '12px 16px' }}>Size</th>
              <th style={{ padding: '12px 16px' }}>SHA-256 Checksum</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((it) => (
                <tr key={it.key} style={{ borderBottom: '1px solid #1f1f2e' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>{it.key}</td>
                  <td style={{ padding: '12px 16px', color: '#00ff9d', fontFamily: 'monospace' }}>
                    {JSON.stringify(it.value)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9e9eb0' }}>{it.sizeBytes} B</td>
                  <td style={{ padding: '12px 16px', color: '#ffcc00', fontFamily: 'monospace' }}>{it.checksum}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleDeleteItem(it.key)}
                      style={{ padding: '4px 10px', background: 'rgba(255, 51, 102, 0.1)', color: '#ff3366', border: '1px solid rgba(255, 51, 102, 0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6c6c80', fontStyle: 'italic' }}>
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

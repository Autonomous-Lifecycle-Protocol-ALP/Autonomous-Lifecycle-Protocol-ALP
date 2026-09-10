import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.js';
import { LocalStorageContainer, ContainerMetrics, StorageItem } from '@autonomous-lifecycle-protocol-alp/parser';
import { StoreView } from './StoreView.js';

export const LocalStoragePanel: React.FC = () => {
  const container = useMemo(() => {
    const c = new LocalStorageContainer(50 * 1024 * 1024);
    c.set('workspace', 'project_name', 'Autonomous-Lifecycle-Protocol');
    c.set('workspace', 'active_branch', 'main');
    c.set('agent-cache', 'parser_ast_nodes', 1420);
    c.set('session', 'auth_token', 'jwt-token-sample-9014');
    return c;
  }, []);

  const [activeNamespace, setActiveNamespace] = useState('workspace');
  const [keyInput, setKeyInput] = useState('');
  const [valInput, setValInput] = useState('');
  const [ttlInput, setTtlInput] = useState('');
  const [metrics, setMetrics] = useState<ContainerMetrics>(container.getMetrics());

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

      <StoreView
        container={container}
        metrics={metrics}
        activeNamespace={activeNamespace}
        keyInput={keyInput}
        valInput={valInput}
        ttlInput={ttlInput}
        onNamespaceChange={setActiveNamespace}
        onKeyInputChange={setKeyInput}
        onValInputChange={setValInput}
        onTtlInputChange={setTtlInput}
        onSetItem={handleSetItem}
        onDeleteItem={handleDeleteItem}
        onPurge={handlePurge}
      />
    </div>
  );
};

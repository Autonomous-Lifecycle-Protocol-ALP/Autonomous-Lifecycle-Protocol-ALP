import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageContainer } from '../src/local-storage-container';

describe('LocalStorageContainer (v78.0.0)', () => {
  let container: LocalStorageContainer;

  beforeEach(() => {
    container = new LocalStorageContainer(10 * 1024 * 1024);
  });

  it('stores and retrieves scoped key-value pairs', () => {
    container.set('agent-cache', 'session-123', { role: 'coder', level: 5 });
    const cached = container.get<{ role: string; level: number }>('agent-cache', 'session-123');

    expect(cached).toBeDefined();
    expect(cached?.role).toBe('coder');
    expect(cached?.level).toBe(5);
  });

  it('isolates keys across different namespaces', () => {
    container.set('ns-alpha', 'key-1', 'Alpha Value');
    container.set('ns-beta', 'key-1', 'Beta Value');

    expect(container.get('ns-alpha', 'key-1')).toBe('Alpha Value');
    expect(container.get('ns-beta', 'key-1')).toBe('Beta Value');
  });

  it('computes metrics, byte sizes, and checksum integrity', () => {
    container.set('workspace', 'config', { env: 'prod', region: 'us-east' });
    const metrics = container.getMetrics();

    expect(metrics.totalItems).toBe(1);
    expect(metrics.namespaces).toContain('workspace');
    expect(metrics.totalBytesUsed).toBeGreaterThan(0);
  });

  it('supports snapshot export and import', () => {
    container.set('vault', 'token-1', 'secret-abc');
    container.set('vault', 'token-2', 'secret-xyz');

    const snapshot = container.exportSnapshot();
    expect(snapshot.version).toBe('78.0.0');
    expect(snapshot.items.length).toBe(2);

    const targetContainer = new LocalStorageContainer();
    const importedCount = targetContainer.importSnapshot(snapshot);

    expect(importedCount).toBe(2);
    expect(targetContainer.get('vault', 'token-1')).toBe('secret-abc');
  });
});

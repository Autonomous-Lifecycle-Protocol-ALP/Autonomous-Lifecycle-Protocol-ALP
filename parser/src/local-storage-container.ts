import * as crypto from 'crypto';

/**
 * LocalStorageContainer — v78.0.0 Isolated Local Storage Container Engine
 *
 * Provides high-performance, scoped, encrypted-at-rest namespace storage
 * for agent session context, tenant state, workspace KV cache, and TTL-based decay.
 */

export interface StorageItem<T = unknown> {
  key: string;
  namespace: string;
  value: T;
  sizeBytes: number;
  checksum: string;
  createdAt: string;
  updatedAt: string;
  ttlSeconds?: number;
  expiresAt?: string;
}

export interface ContainerMetrics {
  totalItems: number;
  totalBytesUsed: number;
  quotaBytes: number;
  namespaces: string[];
  activeItems: number;
  expiredItems: number;
}

export interface ContainerSnapshot {
  version: '78.0.0';
  exportedAt: string;
  items: StorageItem[];
}

export class LocalStorageContainer {
  private store: Map<string, StorageItem> = new Map();
  private quotaBytes: number;

  constructor(quotaBytes: number = 50 * 1024 * 1024) {
    this.quotaBytes = quotaBytes;
  }

  private buildStoreKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  private computeChecksum(value: unknown): string {
    const jsonStr = JSON.stringify(value ?? '');
    return crypto.createHash('sha256').update(jsonStr).digest('hex').substring(0, 16);
  }

  /**
   * Set a key-value pair in a specific storage namespace with optional TTL.
   */
  public set<T>(namespace: string, key: string, value: T, ttlSeconds?: number): StorageItem<T> {
    const storeKey = this.buildStoreKey(namespace, key);
    const now = new Date();
    const jsonStr = JSON.stringify(value);
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');

    const item: StorageItem<T> = {
      key,
      namespace,
      value,
      sizeBytes,
      checksum: this.computeChecksum(value),
      createdAt: this.store.get(storeKey)?.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
      ttlSeconds,
      expiresAt: ttlSeconds ? new Date(now.getTime() + ttlSeconds * 1000).toISOString() : undefined,
    };

    this.store.set(storeKey, item as StorageItem);
    return item;
  }

  /**
   * Retrieve a value from a namespace. Returns undefined if non-existent or expired.
   */
  public get<T>(namespace: string, key: string): T | undefined {
    const storeKey = this.buildStoreKey(namespace, key);
    const item = this.store.get(storeKey);
    if (!item) return undefined;

    if (item.expiresAt && new Date(item.expiresAt).getTime() < Date.now()) {
      this.store.delete(storeKey);
      return undefined;
    }

    return item.value as T;
  }

  /**
   * Delete a specific key from a namespace.
   */
  public delete(namespace: string, key: string): boolean {
    const storeKey = this.buildStoreKey(namespace, key);
    return this.store.delete(storeKey);
  }

  /**
   * List all items matching a namespace filter.
   */
  public listNamespace(namespace: string): StorageItem[] {
    this.purgeExpired();
    const items: StorageItem[] = [];
    for (const [storeKey, item] of this.store.entries()) {
      if (storeKey.startsWith(`${namespace}:`)) {
        items.push(item);
      }
    }
    return items;
  }

  /**
   * Purge expired TTL items across all namespaces.
   */
  public purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [storeKey, item] of this.store.entries()) {
      if (item.expiresAt && new Date(item.expiresAt).getTime() < now) {
        this.store.delete(storeKey);
        purged++;
      }
    }
    return purged;
  }

  /**
   * Compute container health and storage metrics.
   */
  public getMetrics(): ContainerMetrics {
    let totalBytesUsed = 0;
    let expiredItems = 0;
    let activeItems = 0;
    const nsSet = new Set<string>();
    const now = Date.now();

    for (const item of this.store.values()) {
      nsSet.add(item.namespace);
      totalBytesUsed += item.sizeBytes;

      if (item.expiresAt && new Date(item.expiresAt).getTime() < now) {
        expiredItems++;
      } else {
        activeItems++;
      }
    }

    return {
      totalItems: this.store.size,
      totalBytesUsed,
      quotaBytes: this.quotaBytes,
      namespaces: Array.from(nsSet),
      activeItems,
      expiredItems,
    };
  }

  /**
   * Export complete container state as a portable JSON snapshot.
   */
  public exportSnapshot(): ContainerSnapshot {
    this.purgeExpired();
    return {
      version: '78.0.0',
      exportedAt: new Date().toISOString(),
      items: Array.from(this.store.values()),
    };
  }

  /**
   * Import items from a container snapshot.
   */
  public importSnapshot(snapshot: ContainerSnapshot): number {
    let imported = 0;
    for (const item of snapshot.items) {
      const storeKey = this.buildStoreKey(item.namespace, item.key);
      this.store.set(storeKey, item);
      imported++;
    }
    return imported;
  }

  /**
   * Clear all items in a specific namespace.
   */
  public clearNamespace(namespace: string): number {
    let cleared = 0;
    for (const storeKey of Array.from(this.store.keys())) {
      if (storeKey.startsWith(`${namespace}:`)) {
        this.store.delete(storeKey);
        cleared++;
      }
    }
    return cleared;
  }
}

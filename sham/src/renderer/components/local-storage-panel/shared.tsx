export interface StorageItem {
  key: string;
  value: unknown;
  sizeBytes: number;
  checksum: string;
}

export interface ContainerMetrics {
  totalItems: number;
  totalBytesUsed: number;
  namespaces: string[];
  activeItems: number;
  expiredItems: number;
}

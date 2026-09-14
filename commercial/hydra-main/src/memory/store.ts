export interface MemoryEntry {
  id: string;
  type: string;
  key: string;
  value: string;
  importance: "low" | "medium" | "high" | "critical";
  scope?: string;
  source?: string;
  ttl?: number;
  createdAt: string;
  updatedAt: string;
  tokensEstimate?: number;
}

export interface MemoryQuery {
  type?: string;
  scope?: string;
  key?: string;
  importance?: MemoryEntry["importance"];
  limit?: number;
}

export interface MemoryStore {
  put(entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">): Promise<MemoryEntry>;
  get(id: string): Promise<MemoryEntry | undefined>;
  query(query: MemoryQuery): Promise<MemoryEntry[]>;
  delete(id: string): Promise<void>;
}

export { InMemoryStore } from "./stores/session";

import { InMemoryStore } from "./session";
import { PostgresMemoryStore } from "./postgres";
import type { MemoryStore } from "../store";

export type StoreBackend = "memory" | "postgres";

export interface StoreFactoryOptions {
  backend?: StoreBackend;
  connectionString?: string;
}

export function createStore(options: StoreFactoryOptions = {}): MemoryStore {
  const backend = options.backend ?? "memory";

  if (backend === "postgres") {
    if (!options.connectionString) {
      throw new Error("connectionString is required for postgres backend");
    }
    return new PostgresMemoryStore(options.connectionString);
  }

  return new InMemoryStore();
}

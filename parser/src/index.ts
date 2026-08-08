import { AlpReader, AlpObject } from './reader';
import { AlpValidator } from './validator';

// ── Core ──────────────────────────────────────────────────────────────────────
export * from './error';
export * from './graph';
export * from './loop';
export * from './memory';
export * from './lock-manager';
export * from './policy';
export * from './plugin';
export * from './alpel';
export * from './remote';
export * from './state-store';
export * from './debug';
export * from './swarm-client';
export * from './repo-resolver';
export * from './node-utils';

// ── Parsing & Lifecycle ───────────────────────────────────────────────────────
export * from './status';
export * from './schedule';
export * from './contract';
export * from './formal';
export * from './vault';
export * from './event-store';
export * from './visualize';
export * from './anomaly';
export * from './planner';
export * from './negotiate';
export * from './provenance';
export * from './autonomy';
export * from './crdt';
export * from './author';
export * from './migration';
export * from './cost-optimizer';
export * from './bridge';
export * from './identity';
export * from './p2p';

// ── Governance & Security ─────────────────────────────────────────────────────
export * from './healing';
export * from './resilience';
export * from './tenant';
export * from './governance';
export * from './domain_trust';
export * from './telemetry';
export * from './zk-proof';
export * from './vector-store';
export * from './did-identity';
export * from './crdt-sync';
export * from './self-healing';
export * from './formal-verification';

// ── Resource & Asset Management ───────────────────────────────────────────────
export * from './asset-context';
export * from './cost-budget';
export * from './execution-quota';
export * from './sandbox-env';
export * from './tenant-mesh';
export * from './arch-decomposer';
export * from './edge-model';
export * from './code-index';
export * from './eval-suite';
export * from './prompt-optimizer';
export * from './consensus-vote';
export * from './code-transform';
export * from './event-mesh';
export * from './swarm-marketplace';

// ── IDE & Editor Extensions ───────────────────────────────────────────────────
export * from './macro';
export * from './collaboration';
export * from './memory-mesh';
export * from './settings';
export * from './snippet';
export * from './test-runner';
export * from './linter';
export * from './formatter';
export * from './intelligence';
export * from './context-bundler';
export * from './bft-consensus';
export * from './dag-partitioner';
export * from './policy-optimizer';
export * from './pq-crypto';
export * from './swarm-settlement';
export * from './workflow-replay';
export * from './swarm-self-healing-mesh';
export * from './swarm-intelligence';
export * from './agent-copilot';
export * from './crdt-canvas';
export * from './wasm-ast';
export * from './edge-debug';
export * from './telemetry-inspector';
export * from './chaos-engine';
export * from './feature-flags';
export * from './local-storage-container';
export * from './reasoning-core';


export { AlpObject, AlpReader };

export class AlpParser {
  private reader: AlpReader;
  private validator: AlpValidator;

  constructor() {
    this.reader = new AlpReader();
    this.validator = new AlpValidator();
  }

  public parse(content: string): AlpObject[] {
    return this.reader.parse(content);
  }

  public get warnings(): string[] {
    return this.reader.warnings;
  }

  public parseAndValidate(content: string): AlpObject[] {
    const objects = this.reader.parse(content);
    for (const obj of objects) {
      this.validator.validate(obj);
    }
    return objects;
  }
}

/**
 * Convenience function: parse ALP content and return a result object.
 * Used by SHAM IDE bridge and other consumers that expect a single-call API.
 */
export function parseALP(content: string): { objects: AlpObject[]; errors: string[] } {
  const reader = new AlpReader();
  try {
    const objects = reader.parse(content);
    return { objects, errors: reader.warnings ?? [] };
  } catch (err) {
    return { objects: [], errors: [err instanceof Error ? err.message : String(err)] };
  }
}


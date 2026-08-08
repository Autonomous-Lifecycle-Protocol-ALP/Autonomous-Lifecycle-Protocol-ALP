import * as fs from 'fs';
import * as path from 'path';
import {
  AlpParser,
  AlpObject,
  AlpGraph,
  GraphNode,
  EventMeshEngine,
  MeshEvent,
  SwarmMarketplaceEngine,
  SkillListing,
  SkillInvocationResult,
  MacroEngine,
  MacroDefinition,
  CollaborationEngine,
  CollabSession,
  CollabOperation,
  CollabBranch,
  PresenceInfo,
  TeamPermission,
  Comment,
  ReviewThread,
  ActivityEvent,
  LiveShareSession,
  AuditEvent,
  MemoryMeshEngine,
  MemoryNode,
  MemoryQueryResult,
  MemoryMeshStats,
  PolicyEngine,
  PolicyActionKind,
  TimeWindow,
  ApprovalRule,
  PolicyProposal,
  PolicyDecision,
  PolicyQuery,
  FederatedTrustRoot,
} from '@autonomous-lifecycle-protocol-alp/parser';

export class AlpWorkspace {
  private parser: AlpParser;
  private graph: AlpGraph | null = null;
  public objects: AlpObject[] = [];

  constructor() {
    this.parser = new AlpParser();
  }

  /**
   * Load and validate all .alp files in a directory.
   */
  public load(workspaceDir: string): void {
    this.objects = [];
    const files = this.findAlpFiles(workspaceDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const parsed = this.parser.parseAndValidate(content);
      this.objects.push(...parsed);
    }
  }

  /**
   * Build and return the dependency graph.
   */
  public getGraph(): AlpGraph {
    if (!this.graph) {
      this.graph = new AlpGraph();
      this.graph.buildGraph(this.objects);
      this.graph.detectCycles();
    }
    return this.graph;
  }

  /**
   * Get the topological execution order of all objects.
   */
  public getExecutionOrder(): GraphNode[] {
    return this.getGraph().topologicalSort();
  }

  /**
   * Find an object by its ID.
   */
  public findById(id: string): AlpObject | undefined {
    return this.objects.find(obj => obj.id === id);
  }

  /**
   * Helper to recursively find all .alp files under a directory.
   */
  private findAlpFiles(dir: string): string[] {
    const fileList: string[] = [];
    const alpDir = path.join(dir, '.alp');
    if (!fs.existsSync(alpDir)) return fileList;

    const walk = (current: string): void => {
      const entries = fs.readdirSync(current);
      for (const entry of entries) {
        const filePath = path.join(current, entry);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walk(filePath);
        } else if (filePath.endsWith('.alp')) {
          fileList.push(filePath);
        }
      }
    };

    walk(alpDir);
    return fileList;
  }
}

// Core parser surface
export { AlpObject, AlpGraph, GraphNode, AlpParser };

// v35-v38 engine surface
export {
  EventMeshEngine,
  MeshEvent,
  SwarmMarketplaceEngine,
  SkillListing,
  SkillInvocationResult,
  MacroEngine,
  MacroDefinition,
  CollaborationEngine,
  CollabSession,
  CollabOperation,
  CollabBranch,
  PresenceInfo,
  TeamPermission,
  Comment,
  ReviewThread,
  ActivityEvent,
  LiveShareSession,
  AuditEvent,
  MemoryMeshEngine,
  MemoryNode,
  MemoryQueryResult,
  MemoryMeshStats,
};

// v41.0.0 IDE Productivity surface
export { SettingsManager, WorkspaceSettings } from '@autonomous-lifecycle-protocol-alp/parser';
export { SnippetManager, Snippet } from '@autonomous-lifecycle-protocol-alp/parser';

// v42.0.0 IDE Quality surface
export { TestRunner, TestCase, TestSuiteResult, CoverageReport } from '@autonomous-lifecycle-protocol-alp/parser';
export { Linter, LintRule, LintDiagnostic } from '@autonomous-lifecycle-protocol-alp/parser';
export { AlpFormatter, FormatOptions } from '@autonomous-lifecycle-protocol-alp/parser';

// v45.0.0 IDE Intelligence surface
export {
  IntelligenceEngine,
  SmartSuggestion,
  DiagnosisResult,
  PredictionResult,
  ReviewFinding,
} from '@autonomous-lifecycle-protocol-alp/parser';

// v45.0.0 Autonomous Orchestration surface
export {
  AutonomyController,
  WorkflowMutator,
  AdaptiveEngine,
  EditProposal,
  EnvironmentSignal,
  SwarmRun,
} from '@autonomous-lifecycle-protocol-alp/parser';

// v41.0.0 policy surface
export {
  PolicyEngine,
  PolicyActionKind,
  TimeWindow,
  ApprovalRule,
  PolicyProposal,
  PolicyDecision,
  PolicyQuery,
  FederatedTrustRoot,
};

// ── PolicyEnforcer ──────────────────────────────────────────────────────

export interface PolicyEnforcerRules {
  requiredFields?: string[];
  denyTypes?: string[];
}

export class PolicyEnforcer {
  private rules: PolicyEnforcerRules;

  constructor(rules: PolicyEnforcerRules = {}) {
    this.rules = rules;
  }

  /**
   * Validate a document against configured policy rules.
   */
  enforce(document: Record<string, unknown>): boolean {
    if (!document || typeof document !== 'object') return false;

    const requiredFields = this.rules.requiredFields ?? [];
    for (const field of requiredFields) {
      if (!(field in document)) return false;
    }

    const denyTypes = this.rules.denyTypes ?? [];
    const docType = (document._type ?? document.type) as string | undefined;
    if (docType && denyTypes.includes(docType)) return false;

    return true;
  }

  /**
   * Govern a workspace by loading and enforcing all ALP objects.
   */
  govern(workspace: AlpWorkspace): { compliant: boolean; violations: string[]; objectsScanned: number } {
    const violations: string[] = [];
    for (const obj of workspace.objects) {
      const doc: Record<string, unknown> = { _type: (obj as any).type ?? '', id: (obj as any).id ?? '', ...(obj as any).properties };
      if (!this.enforce(doc)) {
        violations.push((obj as any).id ?? 'unknown');
      }
    }
    return {
      compliant: violations.length === 0,
      violations,
      objectsScanned: workspace.objects.length,
    };
  }
}

// ── DocumentValidator ───────────────────────────────────────────────────

const VALID_BLOCK_TYPES = new Set([
  'agent', 'skill', 'macro', 'event', 'memory', 'contract',
  'vault', 'swarm', 'workflow', 'task', 'decision', 'rule', 'policy',
]);

export class DocumentValidator {
  private strict: boolean;

  constructor(options: { strict?: boolean } = {}) {
    this.strict = options.strict ?? false;
  }

  /**
   * Validate a document has required structure. Returns true or throws.
   */
  validate(document: Record<string, unknown>): boolean {
    if (!document || typeof document !== 'object') {
      throw new Error('Document must be an object');
    }

    const docType = (document._type ?? document.type) as string | undefined;
    if (!docType) {
      throw new Error("Document must have a '_type' or 'type' field");
    }

    if (this.strict && !VALID_BLOCK_TYPES.has(docType)) {
      throw new Error(`Unknown block type: @${docType}`);
    }

    const docId = document.id ?? (document.properties as Record<string, unknown> | undefined)?.id;
    if (!docId) {
      throw new Error("Document must have an 'id' field");
    }

    return true;
  }
}

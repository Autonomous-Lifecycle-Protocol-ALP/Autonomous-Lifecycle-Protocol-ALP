/**
 * AgentStudioEngine — ALP Agent Studio
 *
 * Low-code platform for building ALP agents with visual DAG design,
 * template scaffolding, and a capability marketplace.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type VisualNodeType = 'TASK' | 'DECISION' | 'AGENT' | 'GATE' | 'INPUT' | 'OUTPUT' | 'TRANSFORM';

export interface VisualNode {
  id: string;
  type: VisualNodeType;
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  capabilities?: string[];
}

export interface VisualEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface StudioProject {
  projectId: string;
  name: string;
  description: string;
  template?: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface StudioTemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  nodes: Omit<VisualNode, 'x' | 'y'>[];
  edges: Omit<VisualEdge, 'id'>[];
}

export interface CapabilityListing {
  capabilityId: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  version: string;
  rating: number;
  downloads: number;
}

export interface DAGValidationResult {
  valid: boolean;
  nodeCount: number;
  edgeCount: number;
  errors: string[];
  warnings: string[];
  topologicalOrder?: string[];
}

// ── Engine ───────────────────────────────────────────────────────────────────

export class AgentStudioEngine {
  private projects: Map<string, StudioProject> = new Map();

  private static readonly BUILT_IN_TEMPLATES: StudioTemplate[] = [
    {
      templateId: 'tpl-coder',
      name: 'Code Agent',
      description: 'Single autonomous coding agent with task intake, implementation, and test verification.',
      category: 'development',
      nodes: [
        { id: 'input', type: 'INPUT', label: 'Task Intake', config: {}, capabilities: ['parse-task'] },
        { id: 'agent', type: 'AGENT', label: 'Code Agent', config: { model: 'gpt-4o' }, capabilities: ['code-gen', 'refactor'] },
        { id: 'gate', type: 'GATE', label: 'Test Gate', config: { command: 'npm test' } },
        { id: 'output', type: 'OUTPUT', label: 'Commit Output', config: {} },
      ],
      edges: [
        { from: 'input', to: 'agent' },
        { from: 'agent', to: 'gate' },
        { from: 'gate', to: 'output' },
      ],
    },
    {
      templateId: 'tpl-reviewer',
      name: 'Code Reviewer',
      description: 'Automated code review agent with style, security, and correctness checks.',
      category: 'quality',
      nodes: [
        { id: 'input', type: 'INPUT', label: 'PR Diff Intake', config: {} },
        { id: 'style', type: 'TASK', label: 'Style Check', config: {} },
        { id: 'security', type: 'TASK', label: 'Security Scan', config: {} },
        { id: 'decision', type: 'DECISION', label: 'Pass/Fail', config: {} },
        { id: 'output', type: 'OUTPUT', label: 'Review Report', config: {} },
      ],
      edges: [
        { from: 'input', to: 'style' },
        { from: 'input', to: 'security' },
        { from: 'style', to: 'decision' },
        { from: 'security', to: 'decision' },
        { from: 'decision', to: 'output' },
      ],
    },
    {
      templateId: 'tpl-tester',
      name: 'Test Agent',
      description: 'Autonomous test generation, execution, and coverage reporting agent.',
      category: 'testing',
      nodes: [
        { id: 'input', type: 'INPUT', label: 'Source Intake', config: {} },
        { id: 'gen', type: 'AGENT', label: 'Test Generator', config: { model: 'gpt-4o' } },
        { id: 'run', type: 'TASK', label: 'Test Runner', config: { command: 'vitest run' } },
        { id: 'output', type: 'OUTPUT', label: 'Coverage Report', config: {} },
      ],
      edges: [
        { from: 'input', to: 'gen' },
        { from: 'gen', to: 'run' },
        { from: 'run', to: 'output' },
      ],
    },
    {
      templateId: 'tpl-fullstack',
      name: 'Full-Stack Swarm',
      description: 'Multi-agent swarm with coder, reviewer, tester, and deployer in a coordinated pipeline.',
      category: 'swarm',
      nodes: [
        { id: 'input', type: 'INPUT', label: 'Feature Request', config: {} },
        { id: 'coder', type: 'AGENT', label: 'Coder Agent', config: { model: 'gpt-4o' } },
        { id: 'reviewer', type: 'AGENT', label: 'Reviewer Agent', config: { model: 'claude-4' } },
        { id: 'tester', type: 'AGENT', label: 'Tester Agent', config: { model: 'gpt-4o' } },
        { id: 'gate', type: 'GATE', label: 'Quality Gate', config: { threshold: 90 } },
        { id: 'deployer', type: 'TASK', label: 'Deploy', config: { target: 'staging' } },
        { id: 'output', type: 'OUTPUT', label: 'Deployment Receipt', config: {} },
      ],
      edges: [
        { from: 'input', to: 'coder' },
        { from: 'coder', to: 'reviewer' },
        { from: 'reviewer', to: 'tester' },
        { from: 'tester', to: 'gate' },
        { from: 'gate', to: 'deployer' },
        { from: 'deployer', to: 'output' },
      ],
    },
  ];

  private static readonly BUILT_IN_CAPABILITIES: CapabilityListing[] = [
    { capabilityId: 'cap-code-gen', name: 'Code Generation', description: 'Generate source code from natural language specifications', category: 'development', provider: 'alp-core', version: '2.0.0', rating: 4.8, downloads: 12450 },
    { capabilityId: 'cap-code-review', name: 'Code Review', description: 'Automated code review with style, security, and correctness analysis', category: 'quality', provider: 'alp-core', version: '2.0.0', rating: 4.7, downloads: 9870 },
    { capabilityId: 'cap-test-gen', name: 'Test Generation', description: 'Generate unit and integration tests from source code', category: 'testing', provider: 'alp-core', version: '1.5.0', rating: 4.5, downloads: 7340 },
    { capabilityId: 'cap-refactor', name: 'Refactoring', description: 'Intelligent code refactoring with architecture-aware transforms', category: 'development', provider: 'alp-core', version: '1.2.0', rating: 4.6, downloads: 5120 },
    { capabilityId: 'cap-security-scan', name: 'Security Scanning', description: 'SAST/DAST vulnerability scanning with auto-remediation', category: 'security', provider: 'alp-security', version: '1.0.0', rating: 4.9, downloads: 15200 },
    { capabilityId: 'cap-deploy', name: 'Deployment', description: 'Multi-cloud deployment orchestration with rollback', category: 'devops', provider: 'alp-devops', version: '1.1.0', rating: 4.4, downloads: 3200 },
    { capabilityId: 'cap-doc-gen', name: 'Documentation Generation', description: 'Auto-generate API docs, READMEs, and architecture diagrams', category: 'documentation', provider: 'alp-core', version: '1.0.0', rating: 4.3, downloads: 4560 },
    { capabilityId: 'cap-perf-opt', name: 'Performance Optimization', description: 'Profile and optimize code performance with AI-guided suggestions', category: 'optimization', provider: 'alp-perf', version: '0.9.0', rating: 4.2, downloads: 1890 },
  ];

  /**
   * Create a new studio project, optionally from a template.
   */
  public createProject(name: string, templateId?: string, description?: string): StudioProject {
    const projectId = `proj-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    let nodes: VisualNode[] = [];
    let edges: VisualEdge[] = [];
    let template: string | undefined;

    if (templateId) {
      const tpl = AgentStudioEngine.BUILT_IN_TEMPLATES.find(
        t => t.templateId === templateId || t.name.toLowerCase() === templateId.toLowerCase()
      );
      if (!tpl) {
        throw new Error(`Template '${templateId}' not found. Use listTemplates() to see available templates.`);
      }
      template = tpl.templateId;
      nodes = tpl.nodes.map((n, i) => ({ ...n, x: 100 + i * 200, y: 100 + (i % 2) * 80 }));
      edges = tpl.edges.map((e, i) => ({ ...e, id: `edge-${i}` }));
    }

    const project: StudioProject = {
      projectId,
      name,
      description: description ?? `ALP Agent Studio project: ${name}`,
      template,
      nodes,
      edges,
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
    };

    this.projects.set(projectId, project);
    return project;
  }

  /**
   * Add a visual node to a project.
   */
  public addNode(projectId: string, type: VisualNodeType, label: string, config: Record<string, unknown> = {}): VisualNode {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project '${projectId}' not found.`);

    const nodeId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const x = 100 + project.nodes.length * 200;
    const y = 100;

    const node: VisualNode = { id: nodeId, type, label, x, y, config };
    project.nodes.push(node);
    project.updatedAt = new Date().toISOString();
    return node;
  }

  /**
   * Add an edge between two nodes.
   */
  public addEdge(projectId: string, from: string, to: string, label?: string): VisualEdge {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project '${projectId}' not found.`);

    const fromNode = project.nodes.find(n => n.id === from);
    const toNode = project.nodes.find(n => n.id === to);
    if (!fromNode) throw new Error(`Source node '${from}' not found.`);
    if (!toNode) throw new Error(`Target node '${to}' not found.`);

    const edgeId = `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const edge: VisualEdge = { id: edgeId, from, to, label };
    project.edges.push(edge);
    project.updatedAt = new Date().toISOString();
    return edge;
  }

  /**
   * Validate the DAG of a project (cycle detection + topological sort).
   */
  public validateDAG(projectId: string): DAGValidationResult {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project '${projectId}' not found.`);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (project.nodes.length === 0) {
      errors.push('Project has no nodes.');
      return { valid: false, nodeCount: 0, edgeCount: 0, errors, warnings };
    }

    // Build adjacency list and in-degree map
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    for (const node of project.nodes) {
      adj.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    for (const edge of project.edges) {
      if (!adj.has(edge.from)) {
        errors.push(`Edge references unknown source node '${edge.from}'.`);
        continue;
      }
      if (!adj.has(edge.to)) {
        errors.push(`Edge references unknown target node '${edge.to}'.`);
        continue;
      }
      adj.get(edge.from)!.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    for (const [nodeId, deg] of inDegree) {
      if (deg === 0) queue.push(nodeId);
    }

    const topologicalOrder: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      topologicalOrder.push(current);
      for (const neighbor of adj.get(current) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    if (topologicalOrder.length !== project.nodes.length) {
      errors.push('Cycle detected in DAG — topological sort failed.');
    }

    // Warnings
    const inputNodes = project.nodes.filter(n => n.type === 'INPUT');
    const outputNodes = project.nodes.filter(n => n.type === 'OUTPUT');
    if (inputNodes.length === 0) warnings.push('No INPUT node defined.');
    if (outputNodes.length === 0) warnings.push('No OUTPUT node defined.');

    const orphans = project.nodes.filter(n => {
      const hasIn = project.edges.some(e => e.to === n.id);
      const hasOut = project.edges.some(e => e.from === n.id);
      return !hasIn && !hasOut;
    });
    if (orphans.length > 0) {
      warnings.push(`${orphans.length} orphan node(s) with no connections: ${orphans.map(n => n.label).join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      nodeCount: project.nodes.length,
      edgeCount: project.edges.length,
      errors,
      warnings,
      topologicalOrder: errors.length === 0 ? topologicalOrder : undefined,
    };
  }

  /**
   * Export a project to ALP format.
   */
  public exportProject(projectId: string): string {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project '${projectId}' not found.`);

    const lines: string[] = [];
    lines.push(`# ALP Specification — Generated by Agent Studio: ${project.name}`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push(`# Version: ${project.version}`);
    lines.push('');

    for (const node of project.nodes) {
      const typeMap: Record<VisualNodeType, string> = {
        TASK: '@task', DECISION: '@decision', AGENT: '@agent',
        GATE: '@gate', INPUT: '@input', OUTPUT: '@output', TRANSFORM: '@transform',
      };
      const alpType = typeMap[node.type] || '@task';
      const configStr = Object.keys(node.config).length > 0
        ? `(${Object.entries(node.config).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')})`
        : '';
      lines.push(`${alpType} ${node.id}${configStr}`);
      lines.push(`  name "${node.label}"`);
      if (node.capabilities?.length) {
        lines.push(`  capabilities [${node.capabilities.join(', ')}]`);
      }
      lines.push('');
    }

    for (const edge of project.edges) {
      const label = edge.label ? ` "${edge.label}"` : '';
      lines.push(`@edge ${edge.from} -> ${edge.to}${label}`);
    }

    return lines.join('\n');
  }

  /**
   * List built-in templates.
   */
  public listTemplates(): StudioTemplate[] {
    return [...AgentStudioEngine.BUILT_IN_TEMPLATES];
  }

  /**
   * List capability marketplace listings.
   */
  public listCapabilities(category?: string): CapabilityListing[] {
    const caps = [...AgentStudioEngine.BUILT_IN_CAPABILITIES];
    if (category) {
      return caps.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }
    return caps;
  }

  /**
   * Get a project by ID.
   */
  public getProject(projectId: string): StudioProject | undefined {
    return this.projects.get(projectId);
  }
}

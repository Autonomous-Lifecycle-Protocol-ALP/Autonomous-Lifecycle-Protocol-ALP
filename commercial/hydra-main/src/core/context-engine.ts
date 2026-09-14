export interface ProjectDependency {
  source: string;
  target: string;
  type: "imports" | "calls" | "depends_on" | "implements";
}

export interface ProjectGraph {
  nodes: string[];
  edges: ProjectDependency[];
}

export class ContextEngine {
  private readonly graphs: Map<string, ProjectGraph> = new Map();

  registerProject(projectId: string): void {
    this.graphs.set(projectId, { nodes: [], edges: [] });
  }

  addDependency(projectId: string, dep: ProjectDependency): void {
    const graph = this.graphs.get(projectId);
    if (!graph) return;
    if (!graph.nodes.includes(dep.source)) graph.nodes.push(dep.source);
    if (!graph.nodes.includes(dep.target)) graph.nodes.push(dep.target);
    graph.edges.push(dep);
  }

  getGraph(projectId: string): ProjectGraph | undefined {
    return this.graphs.get(projectId);
  }

  getAffectedNodes(projectId: string, changedNode: string): string[] {
    const graph = this.graphs.get(projectId);
    if (!graph) return [];
    const affected = new Set<string>();
    const queue = [changedNode];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of graph.edges) {
        if (edge.source === current && !affected.has(edge.target)) {
          affected.add(edge.target);
          queue.push(edge.target);
        }
      }
    }
    return Array.from(affected);
  }
}

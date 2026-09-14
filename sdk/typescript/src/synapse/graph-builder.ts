import { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import {
  SynapseNode,
  SynapseEdge,
  SynapseTopology,
  SynapseStats,
} from './types.js';

const TYPE_COLORS: Record<string, string> = {
  agent: '#8b5cf6',
  task: '#3b82f6',
  policy: '#ef4444',
  contract: '#10b981',
  workflow: '#f59e0b',
  vault: '#06b6d4',
  swarm: '#ec4899',
  timeline: '#6366f1',
  tenant_mesh: '#14b8a6',
  default: '#64748b',
};

const TYPE_GROUPS: Record<string, number> = {
  agent: 1,
  task: 2,
  policy: 3,
  contract: 4,
  workflow: 5,
  vault: 6,
  swarm: 7,
  timeline: 8,
  tenant_mesh: 9,
  default: 0,
};

export class GraphBuilder {
  private cleanRef(raw: unknown): string {
    if (typeof raw !== 'string') return '';
    return raw.trim().replace(/^(?:->|@|#|\s)+/, '').trim();
  }

  public buildTopology(objects: AlpObject[]): SynapseTopology {
    const nodeMap = new Map<string, SynapseNode>();
    const edges: SynapseEdge[] = [];
    const knownIds = new Set(objects.map((o) => o.id));
    const brokenLinks: { source: string; target: string }[] = [];

    for (const obj of objects) {
      const type = obj._type || 'object';
      const color = TYPE_COLORS[type] || TYPE_COLORS.default;
      const group = TYPE_GROUPS[type] || 0;

      const tags: string[] = [type];
      if (obj.status) tags.push(String(obj.status));
      if ((obj as any).priority) tags.push(String((obj as any).priority));

      nodeMap.set(obj.id, {
        id: obj.id,
        type,
        title: (obj as any).title || obj.id,
        status: obj.status ? String(obj.status) : undefined,
        owner: (obj as any).owner || (obj as any).agent || undefined,
        tags,
        inLinks: [],
        outLinks: [],
        properties: { ...obj },
        color,
        degree: 0,
        group,
      });
    }

    const addEdge = (
      fromId: string,
      toId: string,
      label: string,
      relation: 'depends_on' | 'assigned_to' | 'guards' | 'implements' | 'references'
    ) => {
      const fromNode = nodeMap.get(fromId);
      const toNode = nodeMap.get(toId);
      if (!fromNode || !toNode) {
        brokenLinks.push({ source: fromId, target: toId });
        return;
      }
      if (
        !edges.some(
          (e) => e.source === fromId && e.target === toId && e.relation === relation
        )
      ) {
        edges.push({ source: fromId, target: toId, label, relation });
        if (!fromNode.outLinks.includes(toId)) fromNode.outLinks.push(toId);
        if (!toNode.inLinks.includes(fromId)) toNode.inLinks.push(fromId);
      }
    };

    for (const obj of objects) {
      const sourceId = obj.id;

      const deps = (obj as any).depends || (obj as any).deps || (obj as any).depends_on || [];
      const depList = Array.isArray(deps) ? deps : [deps];
      for (const rawTarget of depList) {
        const cleanTarget = this.cleanRef(rawTarget);
        if (cleanTarget) addEdge(sourceId, cleanTarget, 'depends on', 'depends_on');
      }

      const owner = (obj as any).owner || (obj as any).agent;
      if (owner) {
        const cleanOwner = this.cleanRef(owner);
        if (cleanOwner) addEdge(cleanOwner, sourceId, 'executes', 'assigned_to');
      }

      if (obj._type === 'policy') {
        const guards = (obj as any).guards || (obj as any).targets || [];
        const guardList = Array.isArray(guards) ? guards : [guards];
        for (const rawTarget of guardList) {
          const cleanTarget = this.cleanRef(rawTarget);
          if (cleanTarget) addEdge(sourceId, cleanTarget, 'guards', 'guards');
        }
      } else {
        const policies = (obj as any).policy || (obj as any).policies || [];
        const polList = Array.isArray(policies) ? policies : [policies];
        for (const rawPol of polList) {
          const cleanPol = this.cleanRef(rawPol);
          if (cleanPol) addEdge(cleanPol, sourceId, 'guards', 'guards');
        }
      }

      if (obj._type === 'contract') {
        const from = this.cleanRef((obj as any).from);
        const to = this.cleanRef((obj as any).to);
        if (from && to) addEdge(from, to, 'contracts', 'references');
        if (to) addEdge(sourceId, to, 'governs', 'implements');
      } else {
        const contracts = (obj as any).contract || (obj as any).contracts || [];
        const conList = Array.isArray(contracts) ? contracts : [contracts];
        for (const rawCon of conList) {
          const cleanCon = this.cleanRef(rawCon);
          if (cleanCon) addEdge(cleanCon, sourceId, 'governs', 'implements');
        }
      }

      if (obj._type === 'vault') {
        const recipients = (obj as any).recipients || [];
        const recList = Array.isArray(recipients) ? recipients : [recipients];
        for (const rawRec of recList) {
          const cleanRec = this.cleanRef(rawRec);
          if (cleanRec) addEdge(sourceId, cleanRec, 'secures', 'references');
        }
      } else {
        const vaults = (obj as any).vault || (obj as any).vaults || [];
        const vList = Array.isArray(vaults) ? vaults : [vaults];
        for (const rawV of vList) {
          const cleanV = this.cleanRef(rawV);
          if (cleanV) addEdge(cleanV, sourceId, 'secures', 'references');
        }
      }

      const feature = this.cleanRef((obj as any).feature);
      if (feature) addEdge(sourceId, feature, 'part of', 'references');

      const steps = (obj as any).steps || [];
      const stepList = Array.isArray(steps) ? steps : [steps];
      for (const rawStep of stepList) {
        const cleanStep = this.cleanRef(rawStep);
        if (cleanStep) addEdge(sourceId, cleanStep, 'executes step', 'references');
      }
    }

    const nodes = Array.from(nodeMap.values());
    for (const node of nodes) {
      node.degree = node.inLinks.length + node.outLinks.length;
    }

    const stats = this.computeStats(nodes, edges, brokenLinks);

    return { nodes, edges, stats };
  }

  private computeStats(
    nodes: SynapseNode[],
    edges: SynapseEdge[],
    brokenLinks: { source: string; target: string }[]
  ): SynapseStats {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const maxEdges = totalNodes > 1 ? totalNodes * (totalNodes - 1) : 1;
    const density = totalNodes > 1 ? totalEdges / maxEdges : 0;

    const centralHubs = [...nodes]
      .sort((a, b) => b.degree - a.degree)
      .map((n) => ({ id: n.id, degree: n.degree }));

    const orphanNodes = nodes.filter((n) => n.degree === 0).map((n) => n.id);

    const byTypeCount: Record<string, number> = {};
    const byStatusCount: Record<string, number> = {};

    for (const n of nodes) {
      byTypeCount[n.type] = (byTypeCount[n.type] || 0) + 1;
      if (n.status) {
        byStatusCount[n.status] = (byStatusCount[n.status] || 0) + 1;
      }
    }

    return {
      totalNodes,
      totalEdges,
      density,
      centralHubs,
      orphanNodes,
      brokenLinks,
      byTypeCount,
      byStatusCount,
    };
  }
}

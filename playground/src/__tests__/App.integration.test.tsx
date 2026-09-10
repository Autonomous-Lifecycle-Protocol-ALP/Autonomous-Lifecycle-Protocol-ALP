// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { AlpParser, AlpGraph } from '@autonomous-lifecycle-protocol-alp/parser';
import { TEMPLATES } from '../constants/templates.js';
import { SNIPPETS } from '../components/SnippetBar.js';

function buildGraph(code: string, validate = true) {
  const parser = new AlpParser();
  const objects = validate ? parser.parseAndValidate(code) : parser.parse(code);
  const graph = new AlpGraph();
  graph.buildGraph(objects);
  return { objects, graph };
}

describe('Editor → Graph integration', () => {
  describe('parsing to graph conversion', () => {
    it('parses a simple @task spec and produces nodes and edges', () => {
      const code = `!alp-version: 3.0.0

@project
  id: test-project
  status: [ ]

@task
  id: task-a
  status: [ ]

@task
  id: task-b
  status: [ ]
  depends_on:
    - -> task-a
`;
      const { objects, graph } = buildGraph(code);

      expect(objects).toHaveLength(3);
      expect(objects[0]._type).toBe('project');
      expect(objects[0].id).toBe('test-project');
      expect(objects[1]._type).toBe('task');
      expect(objects[1].id).toBe('task-a');
      expect(objects[2]._type).toBe('task');
      expect(objects[2].id).toBe('task-b');

      expect(graph.nodes.size).toBe(3);
      expect(graph.nodes.has('test-project')).toBe(true);
      expect(graph.nodes.has('task-a')).toBe(true);
      expect(graph.nodes.has('task-b')).toBe(true);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]).toEqual({
        source: 'task-b',
        target: 'task-a',
        type: 'blocks',
      });
    });

    it('produces correct node data from parsed objects', () => {
      const code = `!alp-version: 3.0.0

@task
  id: task-alpha
  status: [x]
  description: "First task"
`;
      const { graph } = buildGraph(code);

      const node = graph.nodes.get('task-alpha');
      expect(node).toBeDefined();
      expect(node?.type).toBe('task');
      expect(node?.object.id).toBe('task-alpha');
      expect(node?.object.status).toBe('[x]');
      expect(node?.object.description).toBe('First task');
    });
  });

  describe('template loading flow', () => {
    it('parses the webApp template without throwing', () => {
      const { objects, graph } = buildGraph(TEMPLATES['webApp'].code, false);

      expect(objects.length).toBeGreaterThan(0);
      expect(graph.nodes.size).toBe(objects.filter((o) => o.id).length);

      const project = objects.find((o) => o._type === 'project' && o.id === 'alp-commerce-app');
      expect(project).toBeDefined();
      expect(project?.status).toBe('[~]');
    });

    it('parses the swarm template with agents and tasks', () => {
      const { objects } = buildGraph(TEMPLATES['swarm'].code, false);

      const agents = objects.filter((o) => o._type === 'agent');
      expect(agents.length).toBe(3);

      const tasks = objects.filter((o) => o._type === 'task');
      expect(tasks.length).toBe(3);
    });

    it('parses the governance template with policy and contract objects', () => {
      const { objects, graph } = buildGraph(TEMPLATES['governance'].code, false);

      const policies = objects.filter((o) => o._type === 'policy');
      expect(policies.length).toBe(1);
      expect(policies[0].id).toBe('policy-prod-deploy');

      const contracts = objects.filter((o) => o._type === 'contract');
      expect(contracts.length).toBe(1);

      expect(graph.edges.length).toBeGreaterThan(0);
    });

    it('produces a valid DAG from the zkProof template', () => {
      const { objects, graph } = buildGraph(TEMPLATES['zkProof'].code, false);

      const taskIds = objects.filter((o) => o._type === 'task').map((o) => o.id);
      expect(taskIds).toContain('task-compile-circom-circuit');
      expect(taskIds).toContain('task-generate-witness');
      expect(taskIds).toContain('task-prove-zk-snark');

      const edges = graph.edges;
      const compileEdge = edges.find((e) => e.target === 'task-compile-circom-circuit');
      expect(compileEdge).toBeDefined();
      expect(compileEdge?.source).toBe('task-generate-witness');
    });
  });

  describe('snippet insertion flow', () => {
    it('inserting @task snippet produces valid parseable ALP code', () => {
      const baseCode = `!alp-version: 3.0.0

@project
  id: base-project
  status: [ ]
`;
      const snippet = SNIPPETS['task'];
      const inserted = baseCode.trimEnd() + '\n' + snippet;
      const { objects } = buildGraph(inserted, false);

      const task = objects.find((o) => o._type === 'task' && o.id === 'task-new-feature');
      expect(task).toBeDefined();
      expect(task?.status).toBe('[ ]');
    });

    it('inserting @agent snippet adds an agent object', () => {
      const baseCode = `!alp-version: 3.0.0

@project
  id: proj
  status: [ ]
`;
      const inserted = baseCode.trimEnd() + '\n' + SNIPPETS['agent'];
      const { objects } = buildGraph(inserted, false);

      expect(objects).toHaveLength(2);
      expect(objects[1]._type).toBe('agent');
      expect(objects[1].id).toBe('agent-specialist');
    });

    it('inserting @feature snippet preserves existing code', () => {
      const baseCode = `!alp-version: 3.0.0

@project
  id: existing
  status: [ ]
`;
      const inserted = baseCode.trimEnd() + '\n' + SNIPPETS['feature'];
      const { objects } = buildGraph(inserted, false);

      expect(objects).toHaveLength(2);
      expect(objects[0].id).toBe('existing');
      expect(objects[1]._type).toBe('feature');
      expect(objects[1].id).toBe('feat-new-capability');
    });

    it('inserting @policy snippet produces a valid policy object', () => {
      const baseCode = `!alp-version: 3.0.0

@project
  id: policy-proj
  status: [ ]
`;
      const inserted = baseCode.trimEnd() + '\n' + SNIPPETS['policy'];
      const { objects, graph } = buildGraph(inserted, false);

      const policy = objects.find((o) => o._type === 'policy');
      expect(policy).toBeDefined();
      expect(policy?.id).toBe('policy-security-guard');
      expect(graph.nodes.has('policy-security-guard')).toBe(true);
    });
  });

  describe('status marker parsing', () => {
    const statusSpec = `!alp-version: 3.0.0

@project
  id: status-proj
  status: [ ]

@task
  id: task-todo
  status: [ ]

@task
  id: task-done
  status: [x]

@task
  id: task-progress
  status: [~]

@task
  id: task-blocked
  status: [!] Blocked reason

@task
  id: task-question
  status: [?] Awaiting review
`;

    it('recognizes empty [ ] todo status', () => {
      const { objects } = buildGraph(statusSpec, false);
      const todo = objects.find((o) => o.id === 'task-todo');
      expect(todo?.status).toBe('[ ]');
    });

    it('recognizes [x] done status', () => {
      const { objects } = buildGraph(statusSpec, false);
      const done = objects.find((o) => o.id === 'task-done');
      expect(done?.status).toBe('[x]');
    });

    it('recognizes [~] in-progress status', () => {
      const { objects } = buildGraph(statusSpec, false);
      const progress = objects.find((o) => o.id === 'task-progress');
      expect(progress?.status).toBe('[~]');
    });

    it('recognizes [!] blocked status with reason', () => {
      const { objects } = buildGraph(statusSpec, false);
      const blocked = objects.find((o) => o.id === 'task-blocked');
      expect(blocked?.status).toBe('[!] Blocked reason');
    });

    it('recognizes [?] question status with reason', () => {
      const { objects } = buildGraph(statusSpec, false);
      const question = objects.find((o) => o.id === 'task-question');
      expect(question?.status).toBe('[?] Awaiting review');
    });

    it('classifies blocked count correctly using App-style logic', () => {
      const { objects } = buildGraph(statusSpec, false);
      const blockedCount = objects.filter((o) => o.status && o.status.includes('[!]')).length;
      expect(blockedCount).toBe(1);
    });

    it('classifies in-progress count correctly using App-style logic', () => {
      const { objects } = buildGraph(statusSpec, false);
      const inProgressCount = objects.filter((o) => o.status && o.status.includes('[~]')).length;
      expect(inProgressCount).toBe(1);
    });
  });

  describe('dependency resolution', () => {
    it('depends_on: [-> other] creates a blocks edge', () => {
      const code = `!alp-version: 3.0.0

@project
  id: dep-proj
  status: [ ]

@task
  id: upstream
  status: [ ]

@task
  id: downstream
  status: [ ]
  depends_on:
    - -> upstream
`;
      const { graph } = buildGraph(code);

      const edge = graph.edges.find((e) => e.source === 'downstream' && e.target === 'upstream');
      expect(edge).toBeDefined();
      expect(edge?.type).toBe('blocks');
    });

    it('multiple depends_on entries produce multiple edges', () => {
      const code = `!alp-version: 3.0.0

@project
  id: multi-dep
  status: [ ]

@task
  id: a
  status: [ ]

@task
  id: b
  status: [ ]

@task
  id: c
  status: [ ]
  depends_on:
    - -> a
    - -> b
`;
      const { graph } = buildGraph(code);

      expect(graph.edges).toHaveLength(2);
      expect(graph.edges.some((e) => e.source === 'c' && e.target === 'a')).toBe(true);
      expect(graph.edges.some((e) => e.source === 'c' && e.target === 'b')).toBe(true);
    });

    it('owner references create reference edges', () => {
      const code = `!alp-version: 3.0.0

@agent
  id: agent-x
  role: "Tester"

@task
  id: task-owned
  status: [ ]
  owner: -> agent-x
`;
      const { graph } = buildGraph(code);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]).toEqual({
        source: 'task-owned',
        target: 'agent-x',
        type: 'references',
      });
    });

    it('requires with -> reference creates a requires edge', () => {
      const code = `!alp-version: 3.0.0

@project
  id: req-proj
  status: [ ]

@task
  id: task-needs-key
  status: [ ]
  requires:
    - -> env-stripe-key
`;
      const { graph } = buildGraph(code);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].type).toBe('requires');
      expect(graph.edges[0].source).toBe('task-needs-key');
      expect(graph.edges[0].target).toBe('env-stripe-key');
    });

    it('dependency chain produces the expected topo order from App-style logic', () => {
      const code = `!alp-version: 3.0.0

@project
  id: chain
  status: [ ]

@task
  id: t1
  status: [ ]

@task
  id: t2
  status: [ ]
  depends_on:
    - -> t1

@task
  id: t3
  status: [ ]
  depends_on:
    - -> t2
`;
      const { objects, graph } = buildGraph(code);

      expect(graph.edges).toHaveLength(2);

      const inDegree: Record<string, number> = {};
      const adj: Record<string, string[]> = {};
      objects.forEach((obj) => {
        if (obj.id) {
          inDegree[obj.id] = 0;
          adj[obj.id] = [];
        }
      });
      graph.edges.forEach((e) => {
        if (adj[e.source]) adj[e.source].push(e.target);
        if (inDegree[e.target] !== undefined) inDegree[e.target] += 1;
      });

      const queue: string[] = [];
      const topoOrder: string[] = [];
      Object.keys(inDegree).forEach((id) => {
        if (inDegree[id] === 0) queue.push(id);
      });
      while (queue.length > 0) {
        const curr = queue.shift()!;
        topoOrder.push(curr);
        (adj[curr] || []).forEach((next) => {
          inDegree[next] -= 1;
          if (inDegree[next] === 0) queue.push(next);
        });
      }

      expect(topoOrder).toContain('t1');
      expect(topoOrder).toContain('t2');
      expect(topoOrder).toContain('t3');
      expect(topoOrder.length).toBe(objects.filter((o) => o.id).length);
      expect(topoOrder.indexOf('t3')).toBeLessThan(topoOrder.indexOf('t2'));
      expect(topoOrder.indexOf('t2')).toBeLessThan(topoOrder.indexOf('t1'));
    });

    it('detects cycles and reports error via App-style logic', () => {
      const code = `!alp-version: 3.0.0

@project
  id: cycle-proj
  status: [ ]

@task
  id: a
  status: [ ]
  depends_on:
    - -> b

@task
  id: b
  status: [ ]
  depends_on:
    - -> a
`;
      const { objects, graph } = buildGraph(code);

      const inDegree: Record<string, number> = {};
      const adj: Record<string, string[]> = {};
      objects.forEach((obj) => {
        if (obj.id) {
          inDegree[obj.id] = 0;
          adj[obj.id] = [];
        }
      });
      graph.edges.forEach((e) => {
        if (adj[e.source]) adj[e.source].push(e.target);
        if (inDegree[e.target] !== undefined) inDegree[e.target] += 1;
      });

      const queue: string[] = [];
      let processed = 0;
      Object.keys(inDegree).forEach((id) => {
        if (inDegree[id] === 0) queue.push(id);
      });
      while (queue.length > 0) {
        const curr = queue.shift()!;
        processed++;
        (adj[curr] || []).forEach((next) => {
          inDegree[next] -= 1;
          if (inDegree[next] === 0) queue.push(next);
        });
      }

      expect(processed).toBeLessThan(objects.filter((o) => o.id).length);
    });

    it('feature references create reference edges', () => {
      const code = `!alp-version: 3.0.0

@feature
  id: feat-core
  status: [ ]

@task
  id: task-implement
  status: [ ]
  feature: -> feat-core
`;
      const { graph } = buildGraph(code);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]).toEqual({
        source: 'task-implement',
        target: 'feat-core',
        type: 'references',
      });
    });
  });
});

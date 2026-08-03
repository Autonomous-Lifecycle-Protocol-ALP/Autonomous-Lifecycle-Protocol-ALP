import { describe, it, expect } from 'vitest';
import { WorkflowVisualizer } from '../src/visualize';

function makeObject(type: string, id: string, steps: any[] = []): any {
  return { _type: type, id, name: id, steps };
}

describe('WorkflowVisualizer', () => {
  const visualizer = new WorkflowVisualizer();

  it('parses workflow objects from mixed object list', () => {
    const objects = [
      makeObject('task', 't1'),
      makeObject('workflow', 'wf1', [{ name: 'step1' }, { name: 'step2' }]),
    ];
    const workflows = visualizer.parseWorkflows(objects);
    expect(workflows).toHaveLength(1);
    expect(workflows[0].id).toBe('wf1');
    expect(workflows[0].steps).toHaveLength(2);
  });

  it('generates mermaid flowchart', () => {
    const workflows = [
      {
        id: 'wf1',
        name: 'Test Workflow',
        steps: [
          { name: 'Start' },
          { name: 'Process' },
          { name: 'End' },
        ],
      },
    ];
    const mermaid = visualizer.toMermaid(workflows);
    expect(mermaid).toContain('flowchart TD');
    expect(mermaid).toContain('subgraph wf1');
    expect(mermaid).toContain('Start');
    expect(mermaid).toContain('Process');
  });

  it('generates dot format', () => {
    const workflows = [
      {
        id: 'wf1',
        name: 'Test',
        steps: [{ name: 'A' }, { name: 'B' }],
      },
    ];
    const dot = visualizer.toDot(workflows);
    expect(dot).toContain('digraph');
    expect(dot).toContain('wf1');
  });

  it('generates json format', () => {
    const workflows = [
      {
        id: 'wf1',
        name: 'Test',
        steps: [{ name: 'A' }],
      },
    ];
    const json = visualizer.toJson(workflows);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('wf1');
  });

  it('returns empty list when no workflows present', () => {
    const workflows = visualizer.parseWorkflows([makeObject('task', 't1')]);
    expect(workflows).toHaveLength(0);
  });
});

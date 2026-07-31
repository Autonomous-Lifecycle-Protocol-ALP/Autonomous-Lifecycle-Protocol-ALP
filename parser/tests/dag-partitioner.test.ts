import { describe, it, expect } from 'vitest';
import { DAGPartitioner } from '../src/dag-partitioner';
import { AlpGraph } from '../src/graph';
import { AlpObject } from '../src/reader';

describe('v50.0.0 DAGPartitioner — Multi-Region Execution Graph Partitioning', () => {
  const sampleObjects: AlpObject[] = [
    { id: 'task-auth', _type: 'task', depends_on: '-> task-db' } as any,
    { id: 'task-db', _type: 'task' } as any,
    { id: 'task-ui', _type: 'task', depends_on: '-> task-auth' } as any,
    { id: 'task-api', _type: 'task', depends_on: '-> task-db' } as any,
  ];

  it('partitions graph nodes across target cloud regions', () => {
    const graph = new AlpGraph();
    graph.buildGraph(sampleObjects);

    const partitioner = new DAGPartitioner();
    const result = partitioner.partition(graph, ['us-east', 'eu-west', 'ap-southeast']);

    expect(result.totalNodes).toBe(4);
    expect(result.regions).toHaveLength(3);
    expect(result.regions[0].region).toBe('us-east');
    expect(result.regions[1].region).toBe('eu-west');
    expect(result.regions[2].region).toBe('ap-southeast');
  });

  it('retrieves assigned sub-graph node IDs for a specific region', () => {
    const graph = new AlpGraph();
    graph.buildGraph(sampleObjects);

    const partitioner = new DAGPartitioner();
    const result = partitioner.partition(graph, ['us-east', 'eu-west']);
    const usEastNodes = partitioner.getSubGraphForRegion(result, 'us-east');

    expect(usEastNodes.length).toBeGreaterThan(0);
    expect(result.crossRegionEdgesCount).toBeGreaterThanOrEqual(0);
  });
});

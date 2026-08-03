import React, { useState } from 'react';

interface RegionAssignment {
  region: string;
  color: string;
  nodeIds: string[];
  latencyMs: number;
}

const regionColors: Record<string, string> = {
  'us-east': '#4caf50',
  'eu-west': '#2196f3',
  'ap-southeast': '#ff9800',
  'sa-east': '#e91e63',
};

const sampleTasks = [
  'task-auth', 'task-db', 'task-api', 'task-ui',
  'task-logging', 'task-cache', 'task-deploy', 'task-test',
];

export function DAGPartitionPanel(): React.JSX.Element {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['us-east', 'eu-west', 'ap-southeast']);
  const [partitions, setPartitions] = useState<RegionAssignment[] | null>(null);

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const handlePartition = () => {
    if (selectedRegions.length === 0) return;
    const result: RegionAssignment[] = selectedRegions.map(r => ({
      region: r,
      color: regionColors[r] || '#888',
      nodeIds: [],
      latencyMs: Math.round((1.2 + Math.random() * 3) * 10) / 10,
    }));

    sampleTasks.forEach((task, i) => {
      result[i % result.length].nodeIds.push(task);
    });

    setPartitions(result);
  };

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      <div className="panel-header">
        <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginTop: 0, fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--accent)' }}>
           🌐 Multi-Region DAG Partitioner (v50.0.0)
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Partition workspace execution graph across distributed cloud edge regions for parallel execution.
        </p>
      </div>

      {/* Region Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Cloud Regions</label>
        <div className="flex-wrap-gap">
          {Object.entries(regionColors).map(([region, color]) => (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              className="btn btn-sm badge-responsive"
              style={{
                borderRadius: '4px',
                border: `1px solid ${selectedRegions.includes(region) ? color : 'var(--border)'}`,
                background: selectedRegions.includes(region) ? `${color}22` : 'var(--bg-secondary)',
                color: selectedRegions.includes(region) ? color : 'var(--text-muted)',
                fontWeight: selectedRegions.includes(region) ? 'bold' : 'normal',
              }}
            >
              📍 {region}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handlePartition}
        disabled={selectedRegions.length === 0}
        className="btn btn-lg btn-block"
        style={{
          background: selectedRegions.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
          color: 'var(--bg-primary)',
          fontWeight: 'bold',
          marginBottom: '20px',
        }}
      >
        ⚡ Partition DAG ({sampleTasks.length} nodes → {selectedRegions.length} regions)
      </button>

      {/* Partition Results */}
      {partitions && (
        <div className="grid-auto-fit-md">
          {partitions.map(p => (
            <div
              key={p.region}
              className="card"
              style={{
                border: `1px solid ${p.color}`,
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--spacing-sm)',
                background: `${p.color}08`,
                boxSizing: 'border-box',
              }}
            >
              <div className="flex-between">
                <strong style={{ color: p.color, fontSize: 'var(--font-size-sm)' }}>📍 {p.region.toUpperCase()}</strong>
                <span className="badge badge-responsive" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{p.latencyMs} ms</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {p.nodeIds.length} nodes assigned
              </div>
              <div className="flex-wrap-gap">
                {p.nodeIds.map(id => (
                  <span
                    key={id}
                    className="badge badge-responsive"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 8px',
                      background: `${p.color}22`,
                      color: p.color,
                      borderRadius: '3px',
                      border: `1px solid ${p.color}44`,
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {partitions && (
        <div className="card" style={{ marginTop: '16px', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>
          <strong style={{ color: 'var(--accent-blue)' }}>Partition Summary</strong>
          <div style={{ marginTop: '6px' }}>
            Total Nodes: {sampleTasks.length} | Regions: {partitions.length} |
            Avg Latency: {(partitions.reduce((s, p) => s + p.latencyMs, 0) / partitions.length).toFixed(1)} ms
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="dag-partition-panel" style={{ padding: '16px', color: '#e0e0e0', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginTop: 0 }}>
        🌐 Multi-Region DAG Partitioner (v50.0.0)
      </h2>
      <p style={{ color: '#aaa', fontSize: '13px' }}>
        Partition workspace execution graph across distributed cloud edge regions for parallel execution.
      </p>

      {/* Region Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Target Cloud Regions</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(regionColors).map(([region, color]) => (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: `1px solid ${selectedRegions.includes(region) ? color : '#444'}`,
                background: selectedRegions.includes(region) ? `${color}22` : '#222',
                color: selectedRegions.includes(region) ? color : '#666',
                cursor: 'pointer',
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
        style={{
          padding: '10px 20px',
          background: selectedRegions.length > 0 ? '#0066cc' : '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: selectedRegions.length > 0 ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          marginBottom: '20px',
        }}
      >
        ⚡ Partition DAG ({sampleTasks.length} nodes → {selectedRegions.length} regions)
      </button>

      {/* Partition Results */}
      {partitions && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {partitions.map(p => (
            <div
              key={p.region}
              style={{
                border: `1px solid ${p.color}`,
                borderRadius: '8px',
                padding: '14px',
                background: `${p.color}08`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: p.color }}>📍 {p.region.toUpperCase()}</strong>
                <span style={{ fontSize: '11px', color: '#888' }}>{p.latencyMs} ms</span>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                {p.nodeIds.length} nodes assigned
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {p.nodeIds.map(id => (
                  <span
                    key={id}
                    style={{
                      fontSize: '11px',
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
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#111',
          border: '1px solid #333',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}>
          <strong style={{ color: '#0066cc' }}>Partition Summary</strong>
          <div style={{ marginTop: '6px' }}>
            Total Nodes: {sampleTasks.length} | Regions: {partitions.length} |
            Avg Latency: {(partitions.reduce((s, p) => s + p.latencyMs, 0) / partitions.length).toFixed(1)} ms
          </div>
        </div>
      )}
    </div>
  );
}

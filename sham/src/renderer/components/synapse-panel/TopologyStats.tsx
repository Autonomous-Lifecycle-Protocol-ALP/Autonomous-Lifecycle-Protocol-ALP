import React from 'react';
import type { SynapseTopology } from '@autonomous-lifecycle-protocol-alp/sdk';
import { COLORS } from './shared.js';

interface TopologyStatsProps {
  topology: SynapseTopology;
}

export function TopologyStats({ topology }: TopologyStatsProps): React.JSX.Element {
  const { stats } = topology;
  const hasOrphans = stats.orphanNodes.length > 0;
  const hasBroken = stats.brokenLinks.length > 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '8px',
        padding: '10px 16px',
        background: COLORS.bgStats,
        borderBottom: `1px solid ${COLORS.border}`,
        fontSize: '11px',
      }}
    >
      <StatCard label="Total Nodes" value={stats.totalNodes} color={COLORS.accent} />
      <StatCard label="Total Edges" value={stats.totalEdges} color={COLORS.green} />
      <StatCard label="Graph Density" value={stats.density.toFixed(3)} color={COLORS.yellow} />
      <StatCard label="Central Hubs" value={stats.centralHubs.length} color={COLORS.violet} />
      <StatCard
        label="Orphan Nodes"
        value={stats.orphanNodes.length}
        color={hasOrphans ? COLORS.red : COLORS.textMuted}
      />
      <StatCard
        label="Broken Links"
        value={stats.brokenLinks.length}
        color={hasBroken ? COLORS.red : COLORS.textMuted}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps): React.JSX.Element {
  return (
    <div
      style={{
        background: COLORS.bgHeader,
        padding: '6px 10px',
        borderRadius: '4px',
        border: `1px solid ${COLORS.borderLight}`,
      }}
    >
      <div style={{ color: COLORS.textMuted }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
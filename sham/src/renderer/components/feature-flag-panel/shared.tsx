export type FlagStatus = 'ENABLED' | 'DISABLED' | 'ROLLOUT' | 'EXPERIMENT';

export interface Flag {
  id: string;
  name: string;
  description: string;
  status: FlagStatus;
  rollout: number;
  variants: { id: string; name: string; weight: number }[];
  environments: string[];
  killSwitch: boolean;
  updatedAt: string;
}

export const INITIAL_FLAGS: Flag[] = [
  { id: 'flag-001', name: 'New Consensus v3', description: 'Upgraded BFT consensus algorithm', status: 'ROLLOUT', rollout: 30, variants: [{ id: 'control', name: 'BFT v2', weight: 50 }, { id: 'treatment', name: 'BFT v3', weight: 50 }], environments: ['staging', 'production'], killSwitch: false, updatedAt: '2 min ago' },
  { id: 'flag-002', name: 'Enhanced Telemetry', description: 'Extended pub/sub metrics', status: 'ENABLED', rollout: 100, variants: [], environments: ['production'], killSwitch: false, updatedAt: '1 hr ago' },
  { id: 'flag-003', name: 'ML Scheduler', description: 'ML-based task scheduling', status: 'EXPERIMENT', rollout: 50, variants: [{ id: 'fifo', name: 'FIFO', weight: 33 }, { id: 'priority', name: 'Priority', weight: 34 }, { id: 'ml', name: 'ML v1', weight: 33 }], environments: ['staging'], killSwitch: false, updatedAt: '5 min ago' },
  { id: 'flag-004', name: 'Dark Launch: Edge Sync', description: 'Edge node real-time sync', status: 'DISABLED', rollout: 0, variants: [], environments: [], killSwitch: false, updatedAt: '3 hrs ago' },
  { id: 'flag-005', name: 'Auto-Healing v2', description: 'Improved self-healing mesh', status: 'ROLLOUT', rollout: 75, variants: [{ id: 'v1', name: 'Legacy', weight: 25 }, { id: 'v2', name: 'v2 Mesh', weight: 75 }], environments: ['production'], killSwitch: false, updatedAt: '10 min ago' },
];

export const statusMeta: Record<FlagStatus, { icon: string; color: string }> = {
  ENABLED: { icon: 'check', color: '#4ade80' },
  DISABLED: { icon: 'xCircle', color: '#6b7280' },
  ROLLOUT: { icon: 'alertTriangle', color: '#fbbf24' },
  EXPERIMENT: { icon: 'search', color: '#a78bfa' },
};

export const s = {
  container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const },
  header: { padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' as const },
  kpiRow: { display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-xs) var(--spacing-md)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' as const },
  kpi: (accent: string) => ({ flex: 1, minWidth: 'clamp(100px, 25vw, 150px)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 12px) clamp(10px, 3vw, 14px)', border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 3 }),
  kpiLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  kpiValue: (accent: string) => ({ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 700, color: accent }),
  body: { flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' as const },
  list: { width: 'clamp(200px, 30vw, 320px)', borderRight: '1px solid var(--border)', overflowY: 'auto' as const, maxWidth: '400px' },
  detail: { flex: 1, overflowY: 'auto' as const, padding: 'var(--spacing-sm)' },
  flagRow: (active: boolean) => ({
    padding: 'clamp(6px, 1.5vw, 12px) clamp(10px, 2vw, 16px)', cursor: 'pointer', borderBottom: '1px solid var(--border)',
    background: active ? 'var(--bg-secondary)' : 'transparent',
    borderLeft: active ? '3px solid var(--accent-green)' : '3px solid transparent',
    boxSizing: 'border-box' as const,
  }),
  badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, background: color + '18', color, fontSize: 'var(--font-size-xs)', fontWeight: 600, border: `1px solid ${color}33` }),
  card: { background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'clamp(8px, 2vw, 16px)', border: '1px solid var(--border)', marginBottom: 12, boxSizing: 'border-box' as const },
  btn: (color: string) => ({ background: color, border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600 }),
  slider: { width: '100%', accentColor: 'var(--accent)' },
};

import React from 'react';
import { Icon } from '../Icon.js';

export interface TopicMetric {
  topic: string;
  published: number;
  delivered: number;
  failed: number;
  throughput: number;
}

export interface SubHealth {
  id: string;
  topic: string;
  consumer: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DEAD';
  unacked: number;
}

export interface DLQAlert {
  id: string;
  topic: string;
  reason: string;
  time: string;
}

export const INITIAL_TOPICS: TopicMetric[] = [
  { topic: 'orders.created', published: 1284, delivered: 1271, failed: 13, throughput: 42.8 },
  { topic: 'payments.processed', published: 892, delivered: 876, failed: 16, throughput: 29.7 },
  { topic: 'notifications.email', published: 3410, delivered: 3408, failed: 2, throughput: 113.7 },
  { topic: 'inventory.updated', published: 567, delivered: 567, failed: 0, throughput: 18.9 },
  { topic: 'analytics.events', published: 12450, delivered: 12301, failed: 149, throughput: 415.0 },
];

export const INITIAL_SUBS: SubHealth[] = [
  { id: 'sub-orders-1', topic: 'orders.created', consumer: 'order-service', status: 'HEALTHY', unacked: 0 },
  { id: 'sub-payments-1', topic: 'payments.processed', consumer: 'payment-gateway', status: 'DEGRADED', unacked: 12 },
  { id: 'sub-email-1', topic: 'notifications.email', consumer: 'email-worker', status: 'HEALTHY', unacked: 2 },
  { id: 'sub-inventory-1', topic: 'inventory.updated', consumer: 'warehouse-sync', status: 'HEALTHY', unacked: 0 },
  { id: 'sub-analytics-1', topic: 'analytics.events', consumer: 'analytics-ingester', status: 'DEAD', unacked: 149 },
];

export const INITIAL_DLQ: DLQAlert[] = [
  { id: 'dlq-001', topic: 'payments.processed', reason: 'Max retries exceeded (gateway timeout)', time: '2 min ago' },
  { id: 'dlq-002', topic: 'analytics.events', reason: 'Consumer disconnected', time: '5 min ago' },
  { id: 'dlq-003', topic: 'orders.created', reason: 'Schema validation failed', time: '12 min ago' },
];

export type TabId = 'topics' | 'subscriptions' | 'dlq';

export const statusColor = (s: string) => s === 'HEALTHY' ? 'var(--accent-green)' : s === 'DEGRADED' ? 'var(--accent-yellow)' : 'var(--accent-red)';
export const statusIcon = (s: string) => s === 'HEALTHY' ? <Icon name="check" size={11} /> : s === 'DEGRADED' ? <Icon name="alertTriangle" size={11} /> : <Icon name="xCircle" size={11} />;

export const s = {
  container: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const },
  header: { padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' as const },
  kpiRow: { display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-xs) var(--spacing-md)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' as const },
  kpi: (accent: string) => ({
    flex: 1, minWidth: '120px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 'var(--spacing-sm)',
    border: `1px solid ${accent}33`, display: 'flex', flexDirection: 'column' as const, gap: 4,
  }),
  kpiLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  kpiValue: (accent: string) => ({ fontSize: 'clamp(1rem, 3vw, 1.3rem)', fontWeight: 700, color: accent }),
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' as const },
  tab: (active: boolean) => ({
    padding: '8px 20px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600,
    color: active ? 'var(--accent)' : 'var(--text-muted)', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent', border: 'none',
  }),
  body: { flex: 1, overflow: 'auto', padding: 'var(--spacing-sm)' },
};

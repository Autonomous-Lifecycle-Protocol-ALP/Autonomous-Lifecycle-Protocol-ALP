import React from 'react';
import { Icon } from '../Icon.js';

export type ExpType = 'LATENCY' | 'ERROR' | 'RESOURCE_EXHAUSTION' | 'PARTITION' | 'KILL_AGENT';
export type ExpStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ABORTED';

export interface Experiment {
  id: string;
  name: string;
  type: ExpType;
  target: string;
  status: ExpStatus;
  intensity: number;
  blastRadius: string;
  score?: number;
  injected?: number;
  recovered?: number;
  meanRecoveryMs?: number;
  observations?: string[];
}

export const TYPE_META: Record<ExpType, { icon: string; color: string; label: string }> = {
  LATENCY: { icon: 'clock', color: '#fbbf24', label: 'Latency Injection' },
  ERROR: { icon: 'alertTriangle', color: '#f87171', label: 'Error Simulation' },
  RESOURCE_EXHAUSTION: { icon: 'zap', color: '#fb923c', label: 'Resource Exhaustion' },
  PARTITION: { icon: 'wifiOff', color: '#a78bfa', label: 'Network Partition' },
  KILL_AGENT: { icon: 'xCircle', color: '#ef4444', label: 'Kill Agent' },
};

export const INITIAL_EXPERIMENTS: Experiment[] = [
  { id: 'chaos-001', name: 'Latency Storm', type: 'LATENCY', target: 'agent-executor-1', status: 'COMPLETED', intensity: 0.7, blastRadius: 'SINGLE', score: 92, injected: 18, recovered: 17, meanRecoveryMs: 245, observations: ['Circuit breaker activated within SLA', 'PASS: System demonstrates excellent resilience'] },
  { id: 'chaos-002', name: 'Payment Gateway Errors', type: 'ERROR', target: 'payment-gateway', status: 'COMPLETED', intensity: 0.5, blastRadius: 'WORKFLOW', score: 78, injected: 12, recovered: 9, meanRecoveryMs: 520, observations: ['Retry exhaustion detected — escalation needed', 'WARN: Acceptable resilience with room for improvement'] },
  { id: 'chaos-003', name: 'Memory Pressure Test', type: 'RESOURCE_EXHAUSTION', target: 'analytics-worker', status: 'RUNNING', intensity: 0.9, blastRadius: 'SWARM' },
  { id: 'chaos-004', name: 'Split-Brain Simulation', type: 'PARTITION', target: 'consensus-node-3', status: 'PENDING', intensity: 0.6, blastRadius: 'SWARM' },
];

export const statusColor = (s: ExpStatus) => s === 'COMPLETED' ? 'var(--accent-green)' : s === 'RUNNING' ? 'var(--accent-blue)' : s === 'ABORTED' ? 'var(--accent-red)' : 'var(--text-muted)';
export const scoreColor = (s: number) => s >= 90 ? 'var(--accent-green)' : s >= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)';
